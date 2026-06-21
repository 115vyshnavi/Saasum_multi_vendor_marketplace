"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { coupons as couponsTable, orders as ordersTable, products as productsTable, user as userTable } from "@/lib/db/schema"
import { eq, and, ne, inArray } from "drizzle-orm"
import { headers } from "next/headers"

async function getUserId() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    return session?.user?.id || null
  } catch (e) {
    // Graceful fallback for non-request environments (e.g. scripts/E2E runner)
    return null
  }
}

export interface CartItemInput {
  productId: string
  quantity: number
}

export async function validateCouponAction(
  code: string,
  items: CartItemInput[],
  email?: string
) {
  const userId = await getUserId()
  if (!userId && !email) {
    return { success: false, error: "You must be logged in or enter your email to apply a coupon." }
  }

  const cleanedCode = code.trim().toUpperCase()

  try {
    // 1. Fetch coupon
    const couponResult = await db
      .select()
      .from(couponsTable)
      .where(eq(couponsTable.code, cleanedCode))
      .limit(1)

    if (!couponResult[0]) {
      return { success: false, error: "Invalid coupon code." }
    }

    const coupon = couponResult[0]

    // 2. Validate expiry
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return { success: false, error: "This coupon has expired." }
    }

    // 3. Validate global usage limit
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return { success: false, error: "This coupon usage limit has been reached." }
    }

    // 4. Validate per-user usage limit (maximum 1 use per user)
    let userUsage: any[] = []
    if (userId) {
      userUsage = await db
        .select()
        .from(ordersTable)
        .where(
          and(
            eq(ordersTable.userId, userId),
            eq(ordersTable.appliedCoupon, cleanedCode),
            ne(ordersTable.status, "cancelled")
          )
        )
    } else if (email) {
      const normalizedEmail = email.trim().toLowerCase()
      const usersWithEmail = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, normalizedEmail))

      const userIds = usersWithEmail.map((u) => u.id)
      if (userIds.length > 0) {
        userUsage = await db
          .select()
          .from(ordersTable)
          .where(
            and(
              inArray(ordersTable.userId, userIds),
              eq(ordersTable.appliedCoupon, cleanedCode),
              ne(ordersTable.status, "cancelled")
            )
          )
      }
    }

    if (userUsage.length > 0) {
      return { success: false, error: "You have already used this coupon." }
    }

    // 5. Fetch product info from DB to check vendor details
    const productIds = items.map(item => item.productId)
    if (productIds.length === 0) {
      return { success: false, error: "Cart is empty." }
    }
    const dbProducts = await db
      .select()
      .from(productsTable)
      .where(inArray(productsTable.id, productIds))

    const productMap = new Map(dbProducts.map(p => [p.id, p]))

    let subtotal = 0
    let applicableSubtotal = 0

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) continue
      const price = parseFloat(product.price)
      subtotal += price * item.quantity
      
      // If platform coupon, all items are applicable
      if (coupon.couponType === "platform") {
        applicableSubtotal += price * item.quantity
      } else if (coupon.couponType === "vendor" && coupon.vendorId === product.vendorId) {
        // If vendor coupon, only items from that vendor are applicable
        applicableSubtotal += price * item.quantity
      }
    }

    if (coupon.couponType === "vendor" && applicableSubtotal <= 0) {
      return { 
        success: false, 
        error: "This coupon is only valid for items from a specific vendor." 
      }
    }

    // 6. Validate minimum order value
    const minOrderVal = parseFloat(coupon.minOrderValue)
    if (applicableSubtotal < minOrderVal) {
      return { 
        success: false, 
        error: `Minimum purchase of $${minOrderVal.toFixed(2)} is required for this coupon.` 
      }
    }

    // 7. Calculate discount
    let discountAmount = 0
    const val = parseFloat(coupon.discountValue.toString())

    if (coupon.discountType === "percentage") {
      discountAmount = applicableSubtotal * (val / 100)
    } else if (coupon.discountType === "fixed") {
      discountAmount = val
    }

    // Cap discount amount at the applicable subtotal
    if (discountAmount > applicableSubtotal) {
      discountAmount = applicableSubtotal
    }

    return {
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: val,
        couponType: coupon.couponType,
        vendorId: coupon.vendorId,
      },
      discountAmount,
      subtotal,
    }
  } catch (error) {
    console.error("Error validating coupon:", error)
    return { success: false, error: "An error occurred while validating the coupon." }
  }
}

export async function seedCoupons() {
  try {
    const defaultCoupons = [
      {
        code: "FIRST100",
        discountType: "fixed",
        discountValue: "100.00",
        minOrderValue: "500.00",
        expiryDate: new Date("2030-12-31"),
        usageLimit: 1000,
        couponType: "platform",
      },
      {
        code: "SAVE20",
        discountType: "percentage",
        discountValue: "20.00",
        minOrderValue: "0.00",
        expiryDate: new Date("2030-12-31"),
        usageLimit: 500,
        couponType: "platform",
      },
      {
        code: "ELECTRO10",
        discountType: "percentage",
        discountValue: "10.00",
        minOrderValue: "1000.00",
        expiryDate: new Date("2030-12-31"),
        usageLimit: 200,
        couponType: "platform",
      },
      {
        code: "FASHION15",
        discountType: "percentage",
        discountValue: "15.00",
        minOrderValue: "300.00",
        expiryDate: new Date("2030-12-31"),
        usageLimit: 300,
        couponType: "platform",
      },
    ]

    for (const c of defaultCoupons) {
      // Check if coupon exists
      const existing = await db
        .select()
        .from(couponsTable)
        .where(eq(couponsTable.code, c.code))
        .limit(1)

      if (existing.length === 0) {
        await db.insert(couponsTable).values(c)
        console.log(`🆕 Seeded coupon: ${c.code}`)
      }
    }
    return { success: true }
  } catch (error) {
    console.error("Error seeding coupons:", error)
    return { success: false, error: String(error) }
  }
}
