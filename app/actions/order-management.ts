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
import { eq, inArray, sql, and } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

export async function getVendorOrders() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || (session.user.role !== "vendor" && session.user.role !== "brand" && session.user.role !== "admin")) {
    return { success: false, error: "Unauthorized" }
  }

  const vendorId = session.user.id

  try {
    // 1. Get all order items belonging to this vendor
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.vendorId, vendorId))

    if (items.length === 0) {
      return { success: true, orders: [], stats: { pending: 0, shipped: 0, outForDelivery: 0, delivered: 0, revenue: 0 } }
    }

    // 2. Fetch the corresponding orders
    const orderIds = Array.from(new Set(items.map((i) => i.orderId)))
    const orders = await db
      .select()
      .from(ordersTable)
      .where(inArray(ordersTable.id, orderIds))

    // 3. Group items by orderId
    const itemsByOrder = new Map<string, typeof items>()
    for (const item of items) {
      if (!itemsByOrder.has(item.orderId)) {
        itemsByOrder.set(item.orderId, [])
      }
      itemsByOrder.get(item.orderId)!.push(item)
    }

    // 4. Calculate vendor-specific order summaries and stats
    const vendorOrders = orders.map((order) => {
      const orderItems = itemsByOrder.get(order.id) || []
      const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0)
      
      // Calculate shipping: if subtotal >= 150, shipping is free, else it's $10 (same as placeOrder logic)
      const shippingCost = subtotal >= 150 ? 0 : 10
      const totalAmount = subtotal + shippingCost

      return {
        ...order,
        items: orderItems,
        vendorSubtotal: subtotal.toFixed(2),
        vendorShippingCost: shippingCost.toFixed(2),
        vendorTotalAmount: totalAmount.toFixed(2),
      }
    })

    // Calculate Stats
    let pending = 0
    let shipped = 0
    let outForDelivery = 0
    let delivered = 0
    let revenue = 0

    for (const order of vendorOrders) {
      const isOutForDelivery = order.status === "shipped" && order.trackingNumber?.startsWith("[Out for Delivery]")
      
      if (order.status === "placed" || order.status === "confirmed") {
        pending++
      } else if (order.status === "shipped") {
        if (isOutForDelivery) {
          outForDelivery++
        } else {
          shipped++
        }
      } else if (order.status === "delivered") {
        delivered++
      }

      // Add to revenue if paid
      if (order.paymentStatus === "paid") {
        revenue += parseFloat(order.vendorSubtotal)
      }
    }

    return {
      success: true,
      orders: vendorOrders,
      stats: {
        pending,
        shipped,
        outForDelivery,
        delivered,
        revenue,
      },
    }
  } catch (error: any) {
    console.error("Failed to fetch vendor orders:", error)
    return { success: false, error: error.message || "Failed to fetch vendor orders" }
  }
}

export async function updateVendorOrderStatus(
  orderId: string,
  status: "placed" | "confirmed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "returned",
  trackingNumber?: string
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || (session.user.role !== "vendor" && session.user.role !== "brand" && session.user.role !== "admin")) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // 1. Verify that this order belongs to the vendor (or if user is admin, allow)
    if (session.user.role !== "admin") {
      const vendorItems = await db
        .select()
        .from(orderItemsTable)
        .where(
          and(
            eq(orderItemsTable.orderId, orderId),
            eq(orderItemsTable.vendorId, session.user.id)
          )
        )
        .limit(1)

      if (vendorItems.length === 0) {
        return { success: false, error: "Access Denied: Order does not belong to you" }
      }
    }

    // 2. Map status if "out_for_delivery"
    let dbStatus: "placed" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned" = "shipped"
    let finalTrackingNumber = trackingNumber || ""

    if (status === "out_for_delivery") {
      dbStatus = "shipped"
      if (!finalTrackingNumber.startsWith("[Out for Delivery]")) {
        finalTrackingNumber = `[Out for Delivery] ${finalTrackingNumber}`.trim()
      }
    } else {
      dbStatus = status as any
      // If it was out_for_delivery and we are changing to something else, strip prefix if there
      if (finalTrackingNumber.startsWith("[Out for Delivery]")) {
        finalTrackingNumber = finalTrackingNumber.replace("[Out for Delivery]", "").trim()
      }
    }

    // 3. Update order in database
    const updated = await db
      .update(ordersTable)
      .set({
        status: dbStatus,
        trackingNumber: finalTrackingNumber || null,
        updatedAt: new Date(),
        ...(dbStatus === "delivered" ? { deliveredAt: new Date() } : {}),
        ...(dbStatus === "cancelled" ? { cancelledAt: new Date() } : {}),
      })
      .where(eq(ordersTable.id, orderId))
      .returning()

    if (!updated[0]) {
      return { success: false, error: "Order not found" }
    }

    // 4. Update items status for items belonging to this vendor
    await db
      .update(orderItemsTable)
      .set({
        status: dbStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orderItemsTable.orderId, orderId),
          session.user.role !== "admin" ? eq(orderItemsTable.vendorId, session.user.id) : undefined
        )
      )

    // Send notifications if applicable (e.g. welcome/shipped)
    if (dbStatus === "shipped") {
      const userResult = await db
        .select({ email: userTable.email })
        .from(userTable)
        .where(eq(userTable.id, updated[0].userId))
        .limit(1)
      
      const email = userResult[0]?.email
      if (email) {
        try {
          const { sendOrderShippedEmail } = await import("@/lib/email")
          sendOrderShippedEmail(orderId, email, finalTrackingNumber).catch((err) => {
            console.error("Failed to send order shipped email:", err)
          })
        } catch (e) {
          console.error("Failed to import sendOrderShippedEmail", e)
        }
      }
    }

    revalidatePath("/vendor/orders")
    revalidatePath("/orders")
    revalidatePath(`/payment/success`)
    return { success: true }
  } catch (error: any) {
    console.error("Failed to update vendor order status:", error)
    return { success: false, error: error.message || "Failed to update order status" }
  }
}

export async function getAdminOrders() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Fetch all orders
    const allOrders = await db.select().from(ordersTable)

    // Fetch all order items and users
    const allItems = await db.select().from(orderItemsTable)
    const allUsers = await db.select({ id: userTable.id, email: userTable.email, name: userTable.name }).from(userTable)

    const userMap = new Map(allUsers.map((u) => [u.id, u]))
    const itemsByOrder = new Map<string, typeof allItems>()
    for (const item of allItems) {
      if (!itemsByOrder.has(item.orderId)) {
        itemsByOrder.set(item.orderId, [])
      }
      itemsByOrder.get(item.orderId)!.push(item)
    }

    // Get list of vendors for filtering
    const vendors = await db.select({ id: userTable.id, name: userTable.name, email: userTable.email }).from(userTable).where(eq(userTable.role, "vendor"))

    const enrichedOrders = allOrders.map((order) => {
      const orderItems = itemsByOrder.get(order.id) || []
      const customer = userMap.get(order.userId) || { name: "Guest Customer", email: "guest@saasum.com" }
      
      // Get unique vendor IDs for items in this order
      const vendorIds = Array.from(new Set(orderItems.map((i) => i.vendorId)))

      return {
        ...order,
        items: orderItems,
        customer,
        vendorIds,
      }
    })

    return {
      success: true,
      orders: enrichedOrders,
      vendors,
    }
  } catch (error: any) {
    console.error("Failed to fetch admin orders:", error)
    return { success: false, error: error.message || "Failed to fetch admin orders" }
  }
}

export async function getBuyerOrders() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  const userId = session.user.id

  try {
    const list = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, userId))
      .orderBy(sql`${ordersTable.createdAt} DESC`)

    if (list.length === 0) {
      return { success: true, orders: [] }
    }

    const orderIds = list.map((o) => o.id)
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(inArray(orderItemsTable.orderId, orderIds))

    const itemsByOrder = new Map<string, typeof items>()
    for (const item of items) {
      if (!itemsByOrder.has(item.orderId)) {
        itemsByOrder.set(item.orderId, [])
      }
      itemsByOrder.get(item.orderId)!.push(item)
    }

    const vendorIds = Array.from(new Set(items.map((i) => i.vendorId)))
    let vendorNames = new Map<string, string>()
    if (vendorIds.length > 0) {
      const vendors = await db
        .select({ id: userTable.id, name: userTable.name })
        .from(userTable)
        .where(inArray(userTable.id, vendorIds))
      vendorNames = new Map(vendors.map((v) => [v.id, v.name]))
    }

    // Fetch return requests for these orders
    const returnRequests = await db
      .select()
      .from(returnsTable)
      .where(inArray(returnsTable.orderId, orderIds))
    const returnsByOrder = new Map(returnRequests.map((r) => [r.orderId, r]))

    const enrichedOrders = list.map((order) => {
      const orderItems = itemsByOrder.get(order.id) || []
      const vendorId = orderItems[0]?.vendorId
      const vendorName = vendorId ? vendorNames.get(vendorId) || "SaaSum Seller" : "SaaSum Seller"
      const returnRequest = returnsByOrder.get(order.id) || null

      return {
        ...order,
        items: orderItems,
        vendorId,
        vendorName,
        returnRequest,
      }
    })

    return { success: true, orders: enrichedOrders }
  } catch (error: any) {
    console.error("Failed to fetch buyer orders:", error)
    return { success: false, error: error.message || "Failed to fetch orders" }
  }
}

export async function cancelBuyerOrder(orderId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    return await db.transaction(async (tx) => {
      // 1. Fetch order details and verify ownership
      const orders = await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .limit(1)

      if (!orders[0]) {
        throw new Error("Order not found")
      }

      if (orders[0].userId !== session.user.id && session.user.role !== "admin") {
        throw new Error("Unauthorized to cancel this order")
      }

      // 2. Verify status is 'placed' or 'confirmed'
      const status = orders[0].status
      if (status !== "placed" && status !== "confirmed") {
        throw new Error(`Order cannot be cancelled in its current state: ${status}`)
      }

      // 3. Update order status
      await tx
        .update(ordersTable)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(ordersTable.id, orderId))

      // 4. Update order items status
      await tx
        .update(orderItemsTable)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(orderItemsTable.orderId, orderId))

      // 5. Restore product stock
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

      // 6. If payment was paid, mark paymentStatus as refunded
      if (orders[0].paymentStatus === "paid") {
        await tx
          .update(ordersTable)
          .set({
            paymentStatus: "refunded",
          })
          .where(eq(ordersTable.id, orderId))
      }

      return { success: true }
    })
  } catch (error: any) {
    console.error("Order cancellation failed:", error)
    return { success: false, error: error.message || "Failed to cancel order" }
  }
}
