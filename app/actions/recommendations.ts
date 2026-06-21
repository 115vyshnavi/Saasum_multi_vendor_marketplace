"use server"

import { db } from "@/lib/db"
import { products as productsTable, orderItems as orderItemsTable } from "@/lib/db/schema"
import { eq, ne, inArray, desc } from "drizzle-orm"

interface ScoredProduct {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  price: string
  compareAtPrice: string | null
  stock: number
  sku: string
  rating: string
  reviewCount: number
  images: string[] | null
  brand: string | null
  categoryId: number
  vendorId: string
  status: "draft" | "active" | "pending" | "rejected"
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
}

function calculateScore(target: any, candidate: any): number {
  let score = 0

  // 1. Same category = 50
  if (candidate.categoryId === target.categoryId) {
    score += 50
  }

  // 2. Same brand = 20
  if (target.brand && candidate.brand && target.brand.toLowerCase() === candidate.brand.toLowerCase()) {
    score += 20
  }

  // 3. Price similarity = 20
  const targetPrice = parseFloat(target.price)
  const candidatePrice = parseFloat(candidate.price)
  if (targetPrice > 0 && candidatePrice > 0) {
    const diff = Math.abs(targetPrice - candidatePrice)
    const maxPrice = Math.max(targetPrice, candidatePrice)
    const priceSimilarity = 1 - (diff / maxPrice)
    score += priceSimilarity * 20
  }

  // 4. Rating boost = 10 (scale 0-5 rating to 0-10 score)
  const candidateRating = parseFloat(candidate.rating || "0")
  score += (candidateRating / 5) * 10

  return score
}

export async function getTrendingProducts(limit: number = 8) {
  try {
    const trending = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.isActive, true))
      .orderBy(desc(productsTable.rating), desc(productsTable.reviewCount))
      .limit(limit)

    return trending
  } catch (error) {
    console.error("Error in getTrendingProducts:", error)
    return []
  }
}

export async function getRelatedProducts(productId: string, limit: number = 8) {
  try {
    // 1. Get target product
    const targetResult = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1)

    if (!targetResult[0]) {
      return getTrendingProducts(limit)
    }

    const target = targetResult[0]

    // 2. Fetch candidate products (limit to 500 to keep it performant)
    const candidates = await db
      .select()
      .from(productsTable)
      .where(ne(productsTable.id, productId))
      .limit(500)

    const scored = candidates.map(candidate => ({
      product: candidate,
      score: calculateScore(target, candidate)
    }))

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)

    let results = scored.slice(0, limit).map(s => s.product)

    // 3. Fallback: If we have fewer than limit products, fill with trending products
    if (results.length < limit) {
      const trending = await getTrendingProducts(limit)
      for (const p of trending) {
        if (results.length >= limit) break
        if (p.id !== productId && !results.some(r => r.id === p.id)) {
          results.push(p)
        }
      }
    }

    return results
  } catch (error) {
    console.error("Error in getRelatedProducts:", error)
    return getTrendingProducts(limit)
  }
}

export async function getCustomersAlsoBought(productId: string, limit: number = 8) {
  try {
    // 1. Find orders containing this product
    const ordersWithProduct = await db
      .select({ orderId: orderItemsTable.orderId })
      .from(orderItemsTable)
      .where(eq(orderItemsTable.productId, productId))

    const orderIds = ordersWithProduct.map(o => o.orderId)

    let coBoughtIds: string[] = []
    if (orderIds.length > 0) {
      // 2. Find other products in these orders
      const otherItems = await db
        .select({ productId: orderItemsTable.productId })
        .from(orderItemsTable)
        .where(inArray(orderItemsTable.orderId, orderIds))

      const counts: Record<string, number> = {}
      for (const item of otherItems) {
        if (item.productId !== productId) {
          counts[item.productId] = (counts[item.productId] || 0) + 1
        }
      }

      // Sort other product IDs by frequency descending
      coBoughtIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a])
    }

    let results: any[] = []
    if (coBoughtIds.length > 0) {
      // Fetch these products
      results = await db
        .select()
        .from(productsTable)
        .where(inArray(productsTable.id, coBoughtIds.slice(0, limit)))
    }

    // 3. Fallback: If we have fewer than limit products, fill with related products using weighted scoring
    if (results.length < limit) {
      const related = await getRelatedProducts(productId, limit)
      for (const p of related) {
        if (results.length >= limit) break
        if (p.id !== productId && !results.some(r => r.id === p.id)) {
          results.push(p)
        }
      }
    }

    return results
  } catch (error) {
    console.error("Error in getCustomersAlsoBought:", error)
    return getRelatedProducts(productId, limit)
  }
}

export async function getCartRecommendations(cartProductIds: string[], limit: number = 8) {
  try {
    if (cartProductIds.length === 0) {
      return getTrendingProducts(limit)
    }

    const primaryProductId = cartProductIds[0]
    const related = await getRelatedProducts(primaryProductId, limit + cartProductIds.length)

    // Filter out products that are already in the cart
    const filtered = related.filter(p => !cartProductIds.includes(p.id))

    return filtered.slice(0, limit)
  } catch (error) {
    console.error("Error in getCartRecommendations:", error)
    return getTrendingProducts(limit)
  }
}
