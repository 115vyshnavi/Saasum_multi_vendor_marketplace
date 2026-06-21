'use server'

import { db } from '@/lib/db'
import { products, categories, user } from '@/lib/db/schema'
import { eq, and, gte, lte, like, desc, asc, count } from 'drizzle-orm'

export type ProductFilter = {
  category?: string
  search?: string
  minPrice?: string
  maxPrice?: string
  rating?: string
  vendor?: string
  availability?: string
  sortBy?: string
  sortOrder?: string
  page?: number
  limit?: number
}

export type ProductWithDetails = {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  price: string
  compareAtPrice: string | null
  stock: number
  rating: string
  reviewCount: number
  images: string[] | null
  category: {
    id: number
    name: string
    slug: string
  } | null
  vendor: {
    id: string
    name: string
  } | null
}

export async function getMarketplaceProducts(filters: ProductFilter = {}) {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      rating,
      vendor,
      availability,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 12,
    } = filters

    // Build where conditions
    const whereConditions = []
    
    // Only show active products
    whereConditions.push(eq(products.isActive, true))
    whereConditions.push(eq(products.status, 'active'))

    // Category filter
    if (category && category !== 'all') {
      const categoryRecord = await db.select().from(categories).where(eq(categories.slug, category))
      if (categoryRecord.length > 0) {
        whereConditions.push(eq(products.categoryId, categoryRecord[0].id))
      }
    }

    // Search filter
    if (search) {
      whereConditions.push(like(products.name, `%${search}%`))
    }

    // Price range filter
    if (minPrice) {
      whereConditions.push(gte(products.price, minPrice))
    }
    if (maxPrice) {
      whereConditions.push(lte(products.price, maxPrice))
    }

    // Rating filter
    if (rating) {
      whereConditions.push(gte(products.rating, rating))
    }

    // Vendor filter
    if (vendor) {
      whereConditions.push(eq(products.vendorId, vendor))
    }

    // Availability filter
    if (availability === 'in-stock') {
      whereConditions.push(gte(products.stock, 1))
    } else if (availability === 'out-of-stock') {
      whereConditions.push(eq(products.stock, 0))
    }

    // Build sort condition
    let orderBy
    switch (sortBy) {
      case 'price':
        orderBy = sortOrder === 'desc' ? desc(products.price) : asc(products.price)
        break
      case 'rating':
        orderBy = sortOrder === 'desc' ? desc(products.rating) : asc(products.rating)
        break
      case 'newest':
        orderBy = desc(products.createdAt)
        break
      case 'popularity':
        orderBy = desc(products.reviewCount)
        break
      default:
        orderBy = sortOrder === 'desc' ? desc(products.name) : asc(products.name)
    }

    // Calculate offset
    const offset = (page - 1) * limit

    // Execute query with joins
    const productResults = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        shortDescription: products.shortDescription,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        stock: products.stock,
        sku: products.sku,
        rating: products.rating,
        reviewCount: products.reviewCount,
        images: products.images,
        status: products.status,
        isActive: products.isActive,
        createdAt: products.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
        vendor: {
          id: user.id,
          name: user.name,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(user, eq(products.vendorId, user.id))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalResults = await db
      .select({ count: count() })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...whereConditions))

    const totalCount = totalResults[0]?.count || 0

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return {
      products: productResults,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext,
        hasPrev,
        limit,
      },
    }

  } catch (error) {
    console.error('Error fetching marketplace products:', error)
    throw new Error('Failed to fetch products')
  }
}

export async function getMarketplaceCategories() {
  try {
    const categoriesWithCounts = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(
        products,
        and(
          eq(categories.id, products.categoryId),
          eq(products.isActive, true),
          eq(products.status, 'active')
        )
      )
      .where(eq(categories.isActive, true))
      .groupBy(categories.id)
      .orderBy(categories.name)

    return categoriesWithCounts
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw new Error('Failed to fetch categories')
  }
}

export async function getVendorsForFilter() {
  try {
    const vendors = await db
      .select({
        id: user.id,
        name: user.name,
        productCount: count(products.id),
      })
      .from(user)
      .leftJoin(
        products,
        and(
          eq(user.id, products.vendorId),
          eq(products.isActive, true),
          eq(products.status, 'active')
        )
      )
      .where(eq(user.role, 'vendor'))
      .groupBy(user.id, user.name)
      .having(gte(count(products.id), 1))
      .orderBy(user.name)

    return vendors
  } catch (error) {
    console.error('Error fetching vendors:', error)
    throw new Error('Failed to fetch vendors')
  }
}

export async function getMarketplaceStats() {
  try {
    const stats = await db
      .select({
        totalProducts: count(products.id),
      })
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.status, 'active')))

    const categoryStats = await db
      .select({
        categoryName: categories.name,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(
        products,
        and(
          eq(categories.id, products.categoryId),
          eq(products.isActive, true),
          eq(products.status, 'active')
        )
      )
      .where(eq(categories.isActive, true))
      .groupBy(categories.id, categories.name)
      .orderBy(desc(count(products.id)))

    return {
      totalProducts: stats[0]?.totalProducts || 0,
      categoryStats,
    }
  } catch (error) {
    console.error('Error fetching marketplace stats:', error)
    throw new Error('Failed to fetch marketplace stats')
  }
}