import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories, products } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'

export async function GET() {
  try {
    // Get all active categories with product counts
    const categoriesWithCounts = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
        isActive: categories.isActive,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(
        products, 
        eq(categories.id, products.categoryId)
      )
      .where(eq(categories.isActive, true))
      .groupBy(categories.id)
      .orderBy(categories.name)

    return NextResponse.json({
      success: true,
      data: categoriesWithCounts,
    })

  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}