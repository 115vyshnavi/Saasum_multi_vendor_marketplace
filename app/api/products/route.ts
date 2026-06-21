import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products, categories, user } from '@/lib/db/schema'
import { eq, and, gte, lte, like, desc, asc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const category = searchParams.get('category')
    const search = searchParams.get('search') 
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const rating = searchParams.get('rating')
    const vendor = searchParams.get('vendor')
    const availability = searchParams.get('availability')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

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
    const query = db
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

    const productResults = await query

    // Get total count for pagination
    const totalQuery = db
      .select({ count: products.id })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...whereConditions))

    const totalResults = await totalQuery
    const totalCount = totalResults.length

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      success: true,
      data: {
        products: productResults,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext,
          hasPrev,
          limit,
        },
        filters: {
          category,
          search,
          minPrice,
          maxPrice,
          rating,
          vendor,
          availability,
          sortBy,
          sortOrder,
        },
      },
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}