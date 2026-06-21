"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  orders as ordersTable,
  orderItems as orderItemsTable,
  products as productsTable,
  user as userTable,
  returns as returnsTable,
} from "@/lib/db/schema"
import { eq, sql, desc, and } from "drizzle-orm"
import { headers } from "next/headers"
import { sendMail, getBrandedLayout } from "@/lib/email"
import { sendTelegramNotification } from "@/lib/telegram"

export async function submitReturnRequest(
  orderId: string,
  reason: string,
  description: string,
  images: string[]
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // 1. Fetch order
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1)

    const order = orders[0]
    if (!order) {
      return { success: false, error: "Order not found" }
    }

    // 2. Ownership check
    if (order.userId !== session.user.id) {
      return { success: false, error: "Unauthorized access to order" }
    }

    // 3. Status/Eligibility Checks
    // Eligibility Rule 1: Delivered orders only
    if (order.status !== "delivered") {
      return { success: false, error: "Return can only be requested for delivered orders." }
    }

    // Eligibility Rule 2: Not cancelled
    if (order.status === "cancelled") {
      return { success: false, error: "Cancelled orders cannot be returned." }
    }

    // Eligibility Rule 3: Within 7 days
    if (!order.deliveredAt) {
      return { success: false, error: "Delivery date not recorded on order." }
    }
    const deliveredDate = new Date(order.deliveredAt)
    const now = new Date()
    const diffInTime = now.getTime() - deliveredDate.getTime()
    const diffInDays = diffInTime / (1000 * 3600 * 24)
    if (diffInDays > 7) {
      return { success: false, error: "Return window has expired (must be within 7 days of delivery)." }
    }

    // Eligibility Rule 4: Not already returned (no existing return record)
    const existingReturns = await db
      .select()
      .from(returnsTable)
      .where(eq(returnsTable.orderId, orderId))
      .limit(1)
    if (existingReturns[0]) {
      return { success: false, error: "A return request has already been submitted for this order." }
    }

    // 4. Create the return request record
    const [newReturn] = await db
      .insert(returnsTable)
      .values({
        orderId,
        userId: session.user.id,
        reason,
        description,
        images: images || [],
        status: "requested",
      })
      .returning()

    // 5. Fetch vendor details to notify
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId))
    const vendorId = items[0]?.vendorId
    let vendorEmail = ""
    if (vendorId) {
      const vendorUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, vendorId))
        .limit(1)
      vendorEmail = vendorUser[0]?.email || ""
    }

    // 6. Send notification emails
    const buyerEmail = session.user.email
    if (buyerEmail) {
      const buyerContent = getBrandedLayout(
        "Return Request Submitted",
        `Your return request for order ${orderId} has been successfully submitted.`,
        `<div style="font-family: sans-serif; color: #334155;">
          <h2 style="color: #1e3a8a;">Return Request Submitted</h2>
          <p>Hi ${order.shippingName},</p>
          <p>Your return request for order <strong>${orderId}</strong> has been successfully submitted.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Description:</strong> ${description || "N/A"}</p>
          <p>Status: <span style="font-weight: bold; color: #d97706;">Requested</span></p>
          <p>The vendor will review your request and get back to you shortly.</p>
        </div>`
      )
      await sendMail({
        to: buyerEmail,
        subject: `Return Requested for Order: ${orderId}`,
        html: buyerContent,
      })
    }

    if (vendorEmail) {
      const vendorContent = getBrandedLayout(
        "New Return Request Received",
        `A return request has been submitted for order ${orderId}.`,
        `<div style="font-family: sans-serif; color: #334155;">
          <h2 style="color: #1e3a8a;">New Return Request Received</h2>
          <p>Dear Seller,</p>
          <p>A buyer has requested a return for order reference <strong>${orderId}</strong>.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Description:</strong> ${description || "N/A"}</p>
          <p>Please log in to your seller panel to approve or reject the request.</p>
        </div>`
      )
      await sendMail({
        to: vendorEmail,
        subject: `New Return Request - Order: ${orderId}`,
        html: vendorContent,
      })
    }

    // 7. Dispatch Telegram Notification Hook
    await sendTelegramNotification(`Return requested for order ${orderId} by user ${session.user.name}`)

    return { success: true, returnRequest: newReturn }
  } catch (error: any) {
    console.error("Failed to submit return request:", error)
    return { success: false, error: error.message || "Failed to submit return request" }
  }
}

export async function getVendorReturnRequests() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const list = await db
      .select({
        id: returnsTable.id,
        orderId: returnsTable.orderId,
        userId: returnsTable.userId,
        reason: returnsTable.reason,
        description: returnsTable.description,
        images: returnsTable.images,
        status: returnsTable.status,
        refundMethod: returnsTable.refundMethod,
        rejectionReason: returnsTable.rejectionReason,
        createdAt: returnsTable.createdAt,
        updatedAt: returnsTable.updatedAt,
        shippingName: ordersTable.shippingName,
        totalAmount: ordersTable.totalAmount,
      })
      .from(returnsTable)
      .innerJoin(ordersTable, eq(returnsTable.orderId, ordersTable.id))
      .innerJoin(orderItemsTable, eq(orderItemsTable.orderId, returnsTable.orderId))
      .where(eq(orderItemsTable.vendorId, session.user.id))
      .orderBy(desc(returnsTable.createdAt))

    // Remove duplicates due to multiple order items
    const uniqueReturns = Array.from(new Map(list.map((r) => [r.id, r])).values())

    return { success: true, returns: uniqueReturns }
  } catch (error: any) {
    console.error("Failed to fetch vendor returns:", error)
    return { success: false, error: error.message || "Failed to fetch return requests" }
  }
}

export async function getBuyerReturnRequest(orderId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return null
  }

  try {
    const list = await db
      .select()
      .from(returnsTable)
      .where(eq(returnsTable.orderId, orderId))
      .limit(1)

    return list[0] || null
  } catch (error) {
    console.error("Failed to fetch buyer return request:", error)
    return null
  }
}

export async function updateReturnStatus(
  orderId: string,
  status: "approved" | "pickup_scheduled" | "item_received" | "rejected",
  rejectionReason?: string
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // 1. Fetch return record
    const list = await db
      .select()
      .from(returnsTable)
      .where(eq(returnsTable.orderId, orderId))
      .limit(1)

    const returnRequest = list[0]
    if (!returnRequest) {
      return { success: false, error: "Return request not found" }
    }

    // 2. Authorization check (only vendor of items or admin)
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId))
    
    const isVendor = items.some((item) => item.vendorId === session.user.id)
    const isAdmin = session.user.role === "admin"
    if (!isVendor && !isAdmin) {
      return { success: false, error: "Unauthorized access to this return request" }
    }

    // 3. Update status
    const updated = await db
      .update(returnsTable)
      .set({
        status,
        rejectionReason: status === "rejected" ? rejectionReason || null : null,
        updatedAt: new Date(),
      })
      .where(eq(returnsTable.orderId, orderId))
      .returning()

    // 4. Notify buyer
    const buyerResult = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, returnRequest.userId))
      .limit(1)
    
    const buyerEmail = buyerResult[0]?.email
    if (buyerEmail) {
      let statusText = status.toUpperCase()
      let statusDesc = `Your return status has been updated to ${statusText}.`
      if (status === "rejected") {
        statusDesc = `Your return request has been rejected. Reason: ${rejectionReason || "Not specified"}.`
      }

      const buyerContent = getBrandedLayout(
        "Return Status Updated",
        `Your return status for order ${orderId} has been updated.`,
        `<div style="font-family: sans-serif; color: #334155;">
          <h2 style="color: #1e3a8a;">Return Status Update</h2>
          <p>Hi,</p>
          <p>Your return request status for order reference <strong>${orderId}</strong> has been updated to:</p>
          <p style="font-size: 16px; font-weight: bold; color: ${status === "rejected" ? "#dc2626" : "#2563eb"};">${statusText}</p>
          <p>${statusDesc}</p>
          <p>Thank you for your patience.</p>
        </div>`
      )
      await sendMail({
        to: buyerEmail,
        subject: `Return Request Update: ${statusText} - Order: ${orderId}`,
        html: buyerContent,
      })
    }

    // 5. Telegram
    await sendTelegramNotification(`Return status updated to ${status} for order ${orderId}`)

    return { success: true, returnRequest: updated[0] }
  } catch (error: any) {
    console.error("Failed to update return status:", error)
    return { success: false, error: error.message || "Failed to update return status" }
  }
}

export async function processAdminRefund(
  orderId: string,
  refundMethod: "original_payment_method" | "store_credit"
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized admin access" }
  }

  try {
    // 1. Fetch return record
    const list = await db
      .select()
      .from(returnsTable)
      .where(eq(returnsTable.orderId, orderId))
      .limit(1)

    const returnRequest = list[0]
    if (!returnRequest) {
      return { success: false, error: "Return request not found" }
    }

    return await db.transaction(async (tx) => {
      // 2. Update order columns
      // order status = returned
      // payment status = refunded
      // invoice status = refunded
      await tx
        .update(ordersTable)
        .set({
          status: "returned",
          paymentStatus: "refunded",
          invoiceStatus: "refunded",
          updatedAt: new Date(),
        })
        .where(eq(ordersTable.id, orderId))

      // 3. Update return columns
      const updatedReturn = await tx
        .update(returnsTable)
        .set({
          status: "refunded",
          refundMethod,
          updatedAt: new Date(),
        })
        .where(eq(returnsTable.orderId, orderId))
        .returning()

      // 4. Restore product stock levels for all items in the order
      const items = await tx
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, orderId))

      for (const item of items) {
        await tx
          .update(productsTable)
          .set({
            stock: sql`${productsTable.stock} + ${item.quantity}`,
          })
          .where(eq(productsTable.id, item.productId))
      }

      // 5. Notify buyer of successful refund
      const buyerResult = await tx
        .select()
        .from(userTable)
        .where(eq(userTable.id, returnRequest.userId))
        .limit(1)

      const buyerEmail = buyerResult[0]?.email
      if (buyerEmail) {
        const buyerContent = getBrandedLayout(
          "Refund Processed Successfully",
          `Your refund for order ${orderId} has been successfully processed.`,
          `<div style="font-family: sans-serif; color: #334155;">
            <h2 style="color: #16a34a;">Refund Processed</h2>
            <p>Hi,</p>
            <p>We have successfully processed the refund for your returned order reference <strong>${orderId}</strong>.</p>
            <p><strong>Refund Method:</strong> ${refundMethod === "original_payment_method" ? "Original Payment Method" : "Store Credit"}</p>
            <p>Order Status: <span style="font-weight: bold; color: #16a34a;">Returned</span></p>
            <p>Payment/Invoice Status: <span style="font-weight: bold; color: #16a34a;">Refunded</span></p>
            <p>The refunded amount should reflect in your account shortly.</p>
          </div>`
        )
        await sendMail({
          to: buyerEmail,
          subject: `Refund Successful: ${orderId}`,
          html: buyerContent,
        })
      }

      // 6. Telegram notification
      await sendTelegramNotification(`Refund processed for order ${orderId} via ${refundMethod}`)

      return { success: true, returnRequest: updatedReturn[0] }
    })
  } catch (error: any) {
    console.error("Failed to process refund:", error)
    return { success: false, error: error.message || "Failed to process refund" }
  }
}

export async function getAdminRefundRequests() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const list = await db
      .select({
        id: returnsTable.id,
        orderId: returnsTable.orderId,
        userId: returnsTable.userId,
        reason: returnsTable.reason,
        description: returnsTable.description,
        images: returnsTable.images,
        status: returnsTable.status,
        refundMethod: returnsTable.refundMethod,
        rejectionReason: returnsTable.rejectionReason,
        createdAt: returnsTable.createdAt,
        updatedAt: returnsTable.updatedAt,
        shippingName: ordersTable.shippingName,
        totalAmount: ordersTable.totalAmount,
      })
      .from(returnsTable)
      .innerJoin(ordersTable, eq(returnsTable.orderId, ordersTable.id))
      .orderBy(desc(returnsTable.createdAt))

    return { success: true, returns: list }
  } catch (error: any) {
    console.error("Failed to fetch admin returns:", error)
    return { success: false, error: error.message || "Failed to fetch return requests" }
  }
}
