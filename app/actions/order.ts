"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  orders as ordersTable,
  orderItems as orderItemsTable,
  products as productsTable,
  user as userTable,
  coupons as couponsTable,
} from "@/lib/db/schema"
import { eq, inArray, sql, and, ne } from "drizzle-orm"
import { headers } from "next/headers"
import crypto from "crypto"

export type ShippingAddress = {
  name: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
}

export type PlaceOrderInput = {
  items: { id: string; quantity: number }[]
  address: ShippingAddress
  paymentMethod: string
  email?: string
  couponCode?: string
}

export async function placeOrder(input: PlaceOrderInput) {
  const session = await auth.api.getSession({ headers: await headers() })
  const { items, address, paymentMethod, email } = input

  if (items.length === 0) {
    return { success: false, error: "Cart is empty" }
  }

  try {
    return await db.transaction(async (tx) => {
      // 1. Resolve or create user ID
      let userId: string

      if (session?.user) {
        userId = session.user.id
      } else {
        // Guest checkout
        if (!email) {
          throw new Error("Email is required for guest checkout")
        }

        const normalizedEmail = email.trim().toLowerCase()

        // Check if user already exists
        const existingUsers = await tx
          .select()
          .from(userTable)
          .where(eq(userTable.email, normalizedEmail))
          .limit(1)

        if (existingUsers[0]) {
          userId = existingUsers[0].id
        } else {
          // Provision guest user record
          const guestId = `guest_${crypto.randomUUID()}`
          await tx.insert(userTable).values({
            id: guestId,
            name: address.name,
            email: normalizedEmail,
            role: "buyer",
            profileComplete: false,
          })
          userId = guestId
        }
      }

      // 2. Fetch products to get pricing, vendor details, and check stock
      const productIds = items.map((i) => i.id)
      const dbProducts = await tx
        .select()
        .from(productsTable)
        .where(inArray(productsTable.id, productIds))

      const productMap = new Map(dbProducts.map((p) => [p.id, p]))

      // Group cart items by vendorId
      const vendorItemsMap = new Map<string, { id: string; quantity: number }[]>()
      for (const item of items) {
        const product = productMap.get(item.id)
        if (!product) {
          throw new Error(`Product with ID ${item.id} not found`)
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`)
        }

        const vendorId = product.vendorId
        if (!vendorItemsMap.has(vendorId)) {
          vendorItemsMap.set(vendorId, [])
        }
        vendorItemsMap.get(vendorId)!.push(item)
      }

      // 2b. Coupon Validation & Application inside transaction
      let couponToApply = null
      let totalDiscountAmount = 0
      let platformDiscountType: "percentage" | "fixed" | null = null
      let platformDiscountValue = 0

      // Calculate total subtotal across all vendors
      const totalSubtotal = items.reduce((sum, item) => {
        const product = productMap.get(item.id)!
        return sum + parseFloat(product.price) * item.quantity
      }, 0)

      if (couponCode) {
        const cleanedCode = couponCode.trim().toUpperCase()
        const couponResult = await tx
          .select()
          .from(couponsTable)
          .where(eq(couponsTable.code, cleanedCode))
          .limit(1)

        if (!couponResult[0]) {
          throw new Error("Invalid coupon code")
        }

        const coupon = couponResult[0]

        // Validate expiry
        if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
          throw new Error("This coupon has expired")
        }

        // Validate global usage limit
        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
          throw new Error("This coupon usage limit has been reached")
        }

        // Validate per-user usage limit
        const userUsage = await tx
          .select()
          .from(ordersTable)
          .where(
            and(
              eq(ordersTable.userId, userId),
              eq(ordersTable.appliedCoupon, cleanedCode),
              ne(ordersTable.status, "cancelled")
            )
          )

        if (userUsage.length > 0) {
          throw new Error("You have already used this coupon")
        }

        // Vendor-specific checks
        let applicableSubtotal = totalSubtotal
        if (coupon.couponType === "vendor" && coupon.vendorId) {
          const vendorItems = items.filter(item => {
            const product = productMap.get(item.id)!
            return product.vendorId === coupon.vendorId
          })
          applicableSubtotal = vendorItems.reduce((sum, item) => {
            const product = productMap.get(item.id)!
            return sum + parseFloat(product.price) * item.quantity
          }, 0)

          if (applicableSubtotal <= 0) {
            throw new Error("This coupon is only valid for items from a specific vendor")
          }
        }

        // Validate minimum order value
        const minOrderVal = parseFloat(coupon.minOrderValue)
        if (applicableSubtotal < minOrderVal) {
          throw new Error(`Minimum purchase of $${minOrderVal.toFixed(2)} is required for this coupon`)
        }

        // Calculate total discount
        const val = parseFloat(coupon.discountValue.toString())
        if (coupon.discountType === "percentage") {
          totalDiscountAmount = applicableSubtotal * (val / 100)
        } else if (coupon.discountType === "fixed") {
          totalDiscountAmount = val
        }

        if (totalDiscountAmount > applicableSubtotal) {
          totalDiscountAmount = applicableSubtotal
        }

        couponToApply = coupon
        platformDiscountType = coupon.discountType as "percentage" | "fixed"
        platformDiscountValue = val

        // Update usage count atomically
        await tx
          .update(couponsTable)
          .set({
            usageCount: sql`${couponsTable.usageCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(couponsTable.code, cleanedCode))
      }

      const orderIds: string[] = []
      const timestamp = Date.now()
      let index = 0

      // 3. Create separate orders for each vendor
      for (const [vendorId, vendorCartItems] of vendorItemsMap.entries()) {
        index++
        let subtotal = 0
        const itemsToInsert = []

        for (const item of vendorCartItems) {
          const product = productMap.get(item.id)!
          const price = parseFloat(product.price)
          subtotal += price * item.quantity

          itemsToInsert.push({
            productId: product.id,
            vendorId: product.vendorId,
            productName: product.name,
            productImage: product.images?.[0] || null,
            productSku: product.sku,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: (price * item.quantity).toFixed(2),
            status: "placed" as const,
          })
        }

        // Calculate discount for this vendor order
        let orderDiscount = 0
        let isCouponAppliedToThisOrder = false

        if (couponToApply) {
          if (couponToApply.couponType === "platform") {
            isCouponAppliedToThisOrder = true
            if (platformDiscountType === "percentage") {
              orderDiscount = subtotal * (platformDiscountValue / 100)
            } else {
              // proportional fixed discount
              orderDiscount = totalDiscountAmount * (subtotal / totalSubtotal)
            }
          } else if (couponToApply.couponType === "vendor" && couponToApply.vendorId === vendorId) {
            isCouponAppliedToThisOrder = true
            if (platformDiscountType === "percentage") {
              orderDiscount = subtotal * (platformDiscountValue / 100)
            } else {
              orderDiscount = totalDiscountAmount
            }
          }
        }

        if (orderDiscount > subtotal) {
          orderDiscount = subtotal
        }

        // Apply shipping cost per vendor order: $10, free if subtotal >= 150
        const shippingCost = subtotal >= 150 ? 0 : 10
        const totalAmount = subtotal + shippingCost - orderDiscount
        const orderId = `ORD-${timestamp}-${Math.floor(1000 + Math.random() * 9000)}-${index}`
        orderIds.push(orderId)

        // Insert Order record (paymentStatus is pending initially for online orders)
        await tx.insert(ordersTable).values({
          id: orderId,
          userId,
          subtotal: subtotal.toFixed(2),
          shippingCost: shippingCost.toFixed(2),
          taxAmount: "0.00",
          totalAmount: totalAmount.toFixed(2),
          status: "placed",
          shippingName: address.name,
          shippingPhone: address.phone,
          shippingAddress: address.address,
          shippingCity: address.city,
          shippingState: address.state,
          shippingPincode: address.pincode,
          paymentStatus: paymentMethod === "Cash on Delivery" ? "pending" : "pending",
          paymentMethod,
          appliedCoupon: isCouponAppliedToThisOrder ? couponToApply.code : null,
          discountAmount: orderDiscount.toFixed(2),
        })

        // Insert Order Items and Update Stock Levels
        for (const item of itemsToInsert) {
          await tx.insert(orderItemsTable).values({
            orderId,
            ...item,
          })

          await tx
            .update(productsTable)
            .set({
              stock: sql`${productsTable.stock} - ${item.quantity}`,
            })
            .where(eq(productsTable.id, item.productId))
        }
      }

      // If COD, dispatch welcome notifications immediately in the background
      if (paymentMethod === "Cash on Delivery") {
        const userEmail = session?.user?.email || email
        if (userEmail) {
          import("@/lib/email").then(({ sendOrderConfirmationEmail }) => {
            for (const id of orderIds) {
              sendOrderConfirmationEmail(id, userEmail).catch((err) => {
                console.error(`Failed to send COD order confirmation email for ${id}:`, err)
              })
            }
          })
        }
      }

      return { success: true, orderId: orderIds.join(",") }
    })
  } catch (error: any) {
    console.error("Order placement failed:", error)
    return { success: false, error: error.message || "Failed to place order" }
  }
}

export async function getOrderDetails(orderId: string) {
  try {
    // 1. Fetch order
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1)

    if (!orders[0]) return null

    // 2. Fetch order items
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId))

    return {
      order: orders[0],
      items: items.map((i) => ({
        ...i,
        unitPrice: parseFloat(i.unitPrice),
        totalPrice: parseFloat(i.totalPrice),
      })),
    }
  } catch (error) {
    console.error("Failed to fetch order details:", error)
    return null
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: "placed" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned",
  trackingNumber?: string
) {
  try {
    const updated = await db
      .update(ordersTable)
      .set({
        status,
        trackingNumber: trackingNumber || null,
        updatedAt: new Date(),
        ...(status === "delivered" ? { deliveredAt: new Date() } : {}),
        ...(status === "cancelled" ? { cancelledAt: new Date() } : {}),
      })
      .where(eq(ordersTable.id, orderId))
      .returning()

    if (updated[0] && status === "shipped") {
      // Fetch user email to trigger shipping notification
      const userResult = await db
        .select({ email: userTable.email })
        .from(userTable)
        .where(eq(userTable.id, updated[0].userId))
        .limit(1)
      
      const email = userResult[0]?.email
      if (email) {
        import("@/lib/email").then(({ sendOrderShippedEmail }) => {
          sendOrderShippedEmail(orderId, email, trackingNumber).catch((err) => {
            console.error("Failed to send order shipped email:", err)
          })
        }).catch((err) => {
          console.error("Failed to import email module for shipping email:", err)
        })
      }
    }
    return { success: true }
  } catch (error: any) {
    console.error("Failed to update order status:", error)
    return { success: false, error: error.message || "Failed to update order status" }
  }
}
