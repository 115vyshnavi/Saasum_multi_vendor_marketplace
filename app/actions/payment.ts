"use server"

import { db } from "@/lib/db"
import {
  orders as ordersTable,
  user as userTable,
  cart as cartTable,
  cartItems as cartItemsTable,
  orderItems as orderItemsTable,
  products as productsTable,
} from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import crypto from "crypto"
import Razorpay from "razorpay"

// Get Razorpay client configuration (Key ID) for the frontend
export async function getRazorpayConfig() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || null,
  }
}

export type CreateRazorpayOrderInput = {
  orderId: string
  amount: number
}

// Initiate Razorpay Order on the server
export async function createRazorpayOrder(input: CreateRazorpayOrderInput) {
  const { orderId, amount } = input
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  // If Razorpay keys are not configured in environment, return a mock order response for the sandbox simulation
  if (!keyId || !keySecret) {
    console.log(`[Payment Sandbox] Initiating mock order for ${orderId} (Amount: $${amount})`)
    return {
      success: true,
      mock: true,
      id: `order_mock_${crypto.randomUUID().replace(/-/g, "").substring(0, 14)}`,
      amount: Math.round(amount * 100),
      currency: "USD",
    }
  }

  try {
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    // Razorpay amounts are in the smallest currency unit (e.g. cents/paise)
    // Convert USD to cents. For production Indian Razorpay, currency can be changed to INR.
    const options = {
      amount: Math.round(amount * 100),
      currency: "USD",
      receipt: orderId,
    }

    const razorpayOrder = await razorpay.orders.create(options)

    return {
      success: true,
      mock: false,
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    }
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error)
    return {
      success: false,
      error: error.message || "Failed to create payment order",
    }
  }
}

export type VerifyPaymentInput = {
  orderId: string
  razorpayPaymentId: string
  razorpayOrderId: string
  razorpaySignature: string
  paymentMethod: string
}

// Verify payment signature and mark order as Paid in DB
export async function verifyAndCompletePayment(input: VerifyPaymentInput) {
  const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentMethod } = input
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  // 1. Signature Verification
  if (keySecret && !razorpayPaymentId.startsWith("pay_sandbox_")) {
    // Real mode verification
    const text = razorpayOrderId + "|" + razorpayPaymentId
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex")

    if (generatedSignature !== razorpaySignature) {
      console.error(`[Payment Verification] Signature mismatch for Order ${orderId}`)
      return { success: false, error: "Invalid payment signature verification" }
    }
  } else {
    console.log(`[Payment Sandbox] Verifying mock payment ${razorpayPaymentId} for Order ${orderId}`)
  }

  try {
    const orderIds = orderId.split(",")
    let userId: string | null = null

    // 2. Update Order status to paid and confirmed for all orders
    for (const id of orderIds) {
      const updated = await db
        .update(ordersTable)
        .set({
          paymentStatus: "paid",
          paymentId: razorpayPaymentId,
          paymentMethod: paymentMethod,
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(ordersTable.id, id))
        .returning()

      if (updated[0]) {
        userId = updated[0].userId
      }
    }

    if (!userId) {
      throw new Error(`No orders updated or found for IDs: ${orderId}`)
    }

    // 3. Clear database cart for the user to keep things in sync
    const userCart = await db
      .select()
      .from(cartTable)
      .where(eq(cartTable.userId, userId))
      .limit(1)

    if (userCart[0]) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, userCart[0].id))
    }

    // 4. Send Order Confirmation Email asynchronously for each order
    const userResult = await db
      .select({ email: userTable.email })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1)

    const email = userResult[0]?.email
    if (email) {
      import("@/lib/email").then(({ sendOrderConfirmationEmail }) => {
        for (const id of orderIds) {
          sendOrderConfirmationEmail(id, email).catch((err) => {
            console.error(`Failed to send order confirmation email for ${id}:`, err)
          })
        }
      }).catch((err) => {
        console.error("Failed to import email module:", err)
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error("Payment confirmation failed:", error)
    return { success: false, error: error.message || "Failed to confirm payment" }
  }
}

// Log payment failure in DB and restore stock
export async function markPaymentFailed(orderId: string) {
  try {
    const orderIds = orderId.split(",")
    return await db.transaction(async (tx) => {
      for (const id of orderIds) {
        // 1. Fetch order details
        const orders = await tx
          .select()
          .from(ordersTable)
          .where(eq(ordersTable.id, id))
          .limit(1)

        if (!orders[0]) {
          console.warn(`Order ${id} not found for payment failure handler`)
          continue
        }

        // 2. Prevent double-cancellation or processing of completed orders
        if (orders[0].paymentStatus === "failed" || orders[0].status === "cancelled") {
          console.log(`Order ${id} is already failed/cancelled. Skipping stock restoration.`)
          continue
        }

        if (orders[0].paymentStatus === "paid" || orders[0].status === "confirmed") {
          console.log(`Order ${id} is already paid/confirmed. Cannot mark as failed.`)
          continue
        }

        // 3. Update order record to failed and cancelled
        await tx
          .update(ordersTable)
          .set({
            paymentStatus: "failed",
            status: "cancelled",
            cancelledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(ordersTable.id, id))

        // 4. Update order items status
        await tx
          .update(orderItemsTable)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(orderItemsTable.orderId, id))

        // 5. Fetch items and restore product stock
        const items = await tx
          .select()
          .from(orderItemsTable)
          .where(eq(orderItemsTable.orderId, id))

        for (const item of items) {
          await tx
            .update(productsTable)
            .set({
              stock: sql`${productsTable.stock} + ${item.quantity}`,
            })
            .where(eq(productsTable.id, item.productId))
        }

        console.log(`Order ${id} marked as failed. Restored stock for ${items.length} items.`)
      }
      return { success: true }
    })
  } catch (error: any) {
    console.error(`Failed to mark orders ${orderId} payment as failed:`, error)
    return { success: false }
  }
}

// Query history of user orders and payments
export async function getUserPaymentHistory() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const list = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, session.user.id))
      .orderBy(desc(ordersTable.createdAt))

    return { success: true, history: list }
  } catch (error: any) {
    console.error("Failed to fetch payment history:", error)
    return { success: false, error: "Failed to fetch payment history" }
  }
}
