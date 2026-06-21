"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { reviews, productQuestions, orders, orderItems, products } from "@/lib/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import { headers } from "next/headers"

export async function getReviews(productId: string) {
  try {
    const reviewList = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        reviewText: reviews.reviewText,
        images: reviews.images,
        verifiedPurchase: reviews.verifiedPurchase,
        helpfulCount: reviews.helpfulCount,
        createdAt: reviews.createdAt,
        userName: sql`${sql`user.name`}`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .leftJoin(sql`user`, sql`${reviews.userId} = user.id`)
      .orderBy(desc(reviews.createdAt))

    return { success: true, reviews: reviewList }
  } catch (error: any) {
    console.error("Failed to fetch reviews:", error)
    return { success: false, error: error.message || "Failed to fetch reviews" }
  }
}

export async function getProductQuestions(productId: string) {
  try {
    const questions = await db
      .select({
        id: productQuestions.id,
        question: productQuestions.question,
        answer: productQuestions.answer,
        answeredBy: productQuestions.answeredBy,
        answeredAt: productQuestions.answeredAt,
        createdAt: productQuestions.createdAt,
        userName: sql`${sql`user.name`}`,
        answererName: sql`${sql`answerer.name`}`,
      })
      .from(productQuestions)
      .where(eq(productQuestions.productId, productId))
      .leftJoin(sql`user`, sql`${productQuestions.userId} = user.id`)
      .leftJoin(sql`user answerer`, sql`${productQuestions.answeredBy} = answerer.id`)
      .orderBy(desc(productQuestions.createdAt))

    return { success: true, questions }
  } catch (error: any) {
    console.error("Failed to fetch questions:", error)
    return { success: false, error: error.message || "Failed to fetch questions" }
  }
}

export async function addReview(productId: string, data: {
  rating: number
  title: string
  reviewText: string
  images?: string[]
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (data.rating < 1 || data.rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5" }
  }

  try {
    // Check if user purchased this product
    const purchase = await db
      .select()
      .from(orderItems)
      .where(and(
        eq(orderItems.productId, productId),
        eq(orderItems.vendorId, session.user.id)
      ))
      .limit(1)

    const verifiedPurchase = purchase.length > 0

    await db.insert(reviews).values({
      productId,
      userId: session.user.id,
      rating: data.rating,
      title: data.title,
      reviewText: data.reviewText,
      images: data.images || [],
      verifiedPurchase,
    })

    // Update product rating
    await updateProductRating(productId)

    return { success: true }
  } catch (error: any) {
    console.error("Failed to add review:", error)
    return { success: false, error: error.message || "Failed to add review" }
  }
}

export async function addQuestion(productId: string, question: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!question || question.trim().length === 0) {
    return { success: false, error: "Question cannot be empty" }
  }

  try {
    await db.insert(productQuestions).values({
      productId,
      userId: session.user.id,
      question: question.trim(),
    })

    return { success: true }
  } catch (error: any) {
    console.error("Failed to add question:", error)
    return { success: false, error: error.message || "Failed to add question" }
  }
}

export async function answerQuestion(questionId: number, answer: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!answer || answer.trim().length === 0) {
    return { success: false, error: "Answer cannot be empty" }
  }

  try {
    await db
      .update(productQuestions)
      .set({
        answer: answer.trim(),
        answeredBy: session.user.id,
        answeredAt: new Date(),
      })
      .where(eq(productQuestions.id, questionId))

    return { success: true }
  } catch (error: any) {
    console.error("Failed to answer question:", error)
    return { success: false, error: error.message || "Failed to answer question" }
  }
}

async function updateProductRating(productId: string) {
  const result = await db
    .select({
      avgRating: sql<string>`AVG(${reviews.rating})`,
      reviewCount: sql<string>`COUNT(*)`,
    })
    .from(reviews)
    .where(eq(reviews.productId, productId))

  if (result.length > 0) {
    const avgRating = parseFloat(result[0].avgRating || "0")
    const reviewCount = parseInt(result[0].reviewCount || "0")

    await db
      .update(products)
      .set({
        rating: avgRating.toFixed(2),
        reviewCount,
      })
      .where(eq(products.id, productId))
  }
}
