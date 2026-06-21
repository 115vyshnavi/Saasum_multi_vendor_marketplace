"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { cart as cartTable, cartItems as cartItemsTable, products as productsTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id || null
}

async function getRequiredUserId() {
  const userId = await getUserId()
  if (!userId) throw new Error("Unauthorized")
  return userId
}

export async function syncCart(
  items: { productId: string; quantity: number; price: number }[]
) {
  const userId = await getRequiredUserId()

  try {
    return await db.transaction(async (tx) => {
      // 1. Get or create cart for user
      const userCart = await tx
        .select()
        .from(cartTable)
        .where(eq(cartTable.userId, userId))
        .limit(1)

      let cartId: number
      if (!userCart[0]) {
        const [inserted] = await tx.insert(cartTable).values({ userId }).returning()
        cartId = inserted.id
      } else {
        cartId = userCart[0].id
      }

      // 2. Delete existing cart items
      await tx.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cartId))

      // 3. Insert new cart items if any
      if (items.length > 0) {
        await tx.insert(cartItemsTable).values(
          items.map((item) => ({
            cartId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price.toString(),
            totalPrice: (item.price * item.quantity).toString(),
          }))
        )
      }

      return { success: true }
    })
  } catch (error) {
    console.error("Error syncing database cart:", error)
    return { success: false, error: String(error) }
  }
}

export async function fetchDbCart() {
  const userId = await getUserId()
  if (!userId) return []

  try {
    // 1. Get user cart
    const userCart = await db
      .select()
      .from(cartTable)
      .where(eq(cartTable.userId, userId))
      .limit(1)

    if (!userCart[0]) return []

    // 2. Fetch cart items joined with products Table
    const items = await db
      .select({
        id: cartItemsTable.productId,
        quantity: cartItemsTable.quantity,
        name: productsTable.name,
        price: productsTable.price,
        images: productsTable.images,
      })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
      .where(eq(cartItemsTable.cartId, userCart[0].id))

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      image: (item.images && item.images[0]) || "/placeholder.svg",
      quantity: item.quantity,
    }))
  } catch (error) {
    console.error("Error fetching database cart:", error)
    return []
  }
}
