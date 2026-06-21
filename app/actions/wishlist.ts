"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { wishlist, cart, cartItems, products } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { headers } from "next/headers"

export async function getWishlist() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const items = await db
      .select({
        id: wishlist.id,
        productId: wishlist.productId,
        createdAt: wishlist.createdAt,
        product: {
          id: sql`products.id`,
          name: sql`products.name`,
          price: sql`products.price`,
          images: sql`products.images`,
          slug: sql`products.slug`,
          stock: sql`products.stock`,
        }
      })
      .from(wishlist)
      .where(eq(wishlist.userId, session.user.id))
      .leftJoin(sql`products`, sql`${wishlist.productId} = products.id`)
      .orderBy(sql`${wishlist.createdAt} DESC`)

    return { success: true, items }
  } catch (error: any) {
    console.error("Failed to fetch wishlist:", error)
    return { success: false, error: error.message || "Failed to fetch wishlist" }
  }
}

export async function isInWishlist(productId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, inWishlist: false }
  }

  try {
    const item = await db
      .select()
      .from(wishlist)
      .where(and(
        eq(wishlist.userId, session.user.id),
        eq(wishlist.productId, productId)
      ))
      .limit(1)

    return { success: true, inWishlist: item.length > 0 }
  } catch (error: any) {
    console.error("Failed to check wishlist:", error)
    return { success: false, inWishlist: false }
  }
}

export async function addToWishlist(productId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await db.insert(wishlist).values({
      userId: session.user.id,
      productId,
    })

    return { success: true }
  } catch (error: any) {
    console.error("Failed to add to wishlist:", error)
    return { success: false, error: error.message || "Failed to add to wishlist" }
  }
}

export async function removeFromWishlist(productId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await db
      .delete(wishlist)
      .where(and(
        eq(wishlist.userId, session.user.id),
        eq(wishlist.productId, productId)
      ))

    return { success: true }
  } catch (error: any) {
    console.error("Failed to remove from wishlist:", error)
    return { success: false, error: error.message || "Failed to remove from wishlist" }
  }
}

export async function toggleWishlist(productId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const existing = await db
      .select()
      .from(wishlist)
      .where(and(
        eq(wishlist.userId, session.user.id),
        eq(wishlist.productId, productId)
      ))
      .limit(1)

    if (existing.length > 0) {
      await db
        .delete(wishlist)
        .where(and(
          eq(wishlist.userId, session.user.id),
          eq(wishlist.productId, productId)
        ))
      return { success: true, inWishlist: false }
    } else {
      await db.insert(wishlist).values({
        userId: session.user.id,
        productId,
      })
      return { success: true, inWishlist: true }
    }
  } catch (error: any) {
    console.error("Failed to toggle wishlist:", error)
    return { success: false, error: error.message || "Failed to toggle wishlist" }
  }
}

export async function moveToCart(productId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get or create cart
    const userCart = await db
      .select()
      .from(cart)
      .where(eq(cart.userId, session.user.id))
      .limit(1)

    let cartId: number
    if (userCart.length === 0) {
      const newCart = await db.insert(cart).values({
        userId: session.user.id,
      }).returning()
      cartId = newCart[0].id
    } else {
      cartId = userCart[0].id
    }

    // Get product price
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1)

    if (product.length === 0) {
      return { success: false, error: "Product not found" }
    }

    const price = parseFloat(product[0].price)

    // Check if already in cart
    const existingCartItem = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.productId, productId)
      ))
      .limit(1)

    if (existingCartItem.length > 0) {
      return { success: false, error: "Product already in cart" }
    }

    // Add to cart
    await db.insert(cartItems).values({
      cartId,
      productId,
      quantity: 1,
      unitPrice: price.toString(),
      totalPrice: price.toString(),
    })

    // Remove from wishlist
    await db
      .delete(wishlist)
      .where(and(
        eq(wishlist.userId, session.user.id),
        eq(wishlist.productId, productId)
      ))

    return { success: true }
  } catch (error: any) {
    console.error("Failed to move to cart:", error)
    return { success: false, error: error.message || "Failed to move to cart" }
  }
}