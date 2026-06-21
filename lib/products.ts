import { db } from '@/lib/db'
import { products, categories, user } from '@/lib/db/schema'
import { eq, and, desc, asc, inArray } from 'drizzle-orm'
import { type DatabaseProduct, type Product, type ProductStatus } from './products-shared'

export * from './products-shared'

// Get all active products from database
export async function getActiveProducts() {
  try {
    const results = await db
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
      .where(and(eq(products.isActive, true), eq(products.status, 'active')))
      .orderBy(desc(products.createdAt))
      .limit(50)

    return results as DatabaseProduct[]
  } catch (error) {
    console.error('Error fetching active products:', error)
    return []
  }
}

// Get products by category
export async function getProductsByCategory(categorySlug: string) {
  try {
    const results = await db
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
      .where(
        and(
          eq(products.isActive, true),
          eq(products.status, 'active'),
          eq(categories.slug, categorySlug)
        )
      )
      .orderBy(desc(products.createdAt))

    return results as DatabaseProduct[]
  } catch (error) {
    console.error('Error fetching products by category:', error)
    return []
  }
}

// Get single product by ID
export async function getProduct(id: string) {
  try {
    const result = await db
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
      .where(eq(products.id, id))
      .limit(1)

    return result[0] as DatabaseProduct | undefined
  } catch (error) {
    console.error('Error fetching product:', error)
    return undefined
  }
}

// Get vendor products (for vendor dashboard)
export async function getVendorProducts(vendorId: string) {
  try {
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        image: products.images,
        category: categories.name,
        price: products.price,
        compareAt: products.compareAtPrice,
        stock: products.stock,
        status: products.status,
        rating: products.rating,
        reviews: products.reviewCount,
        sku: products.sku,
        vendor: user.name,
        submitted: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(user, eq(products.vendorId, user.id))
      .where(eq(products.vendorId, vendorId))
      .orderBy(desc(products.createdAt))

    return results.map(p => ({
      id: p.id,
      name: p.name,
      image: (p.image && p.image[0]) || '/placeholder.svg',
      category: p.category || '',
      price: parseFloat(p.price as string),
      compareAt: p.compareAt ? parseFloat(p.compareAt as string) : undefined,
      stock: p.stock,
      status: p.status,
      rating: parseFloat(p.rating as string),
      reviews: p.reviews,
      sales: 0,
      sku: p.sku,
      vendor: p.vendor || '',
      submitted: typeof p.submitted === 'string' ? p.submitted : new Date(p.submitted).toISOString(),
    })) as Product[]
  } catch (error) {
    console.error('Error fetching vendor products:', error)
    return []
  }
}

// Get pending products for admin approval
export async function getPendingProducts() {
  try {
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        image: products.images,
        category: categories.name,
        price: products.price,
        compareAt: products.compareAtPrice,
        stock: products.stock,
        status: products.status,
        rating: products.rating,
        reviews: products.reviewCount,
        sku: products.sku,
        vendor: user.name,
        submitted: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(user, eq(products.vendorId, user.id))
      .where(eq(products.status, 'pending'))
      .orderBy(desc(products.createdAt))

    return results.map(p => ({
      id: p.id,
      name: p.name,
      image: (p.image && p.image[0]) || '/placeholder.svg',
      category: p.category || '',
      price: parseFloat(p.price as string),
      compareAt: p.compareAt ? parseFloat(p.compareAt as string) : undefined,
      stock: p.stock,
      status: p.status,
      rating: parseFloat(p.rating as string),
      reviews: p.reviews,
      sales: 0,
      sku: p.sku,
      vendor: p.vendor || '',
      submitted: typeof p.submitted === 'string' ? p.submitted : new Date(p.submitted).toISOString(),
    })) as Product[]
  } catch (error) {
    console.error('Error fetching pending products:', error)
    return []
  }
}

// Get main categories from database (homepage only shows top-level categories)
export async function getCategories() {
  try {
    const mainCategorySlugs = [
      'electronics',
      'fashion', 
      'home-kitchen',
      'sports-outdoors',
      'beauty',
      'books'
    ]

    const results = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
      })
      .from(categories)
      .where(
        and(
          eq(categories.isActive, true),
          inArray(categories.slug, mainCategorySlugs)
        )
      )
      .orderBy(asc(categories.name))

    return results
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// stockTone is now exported from products-shared.ts
