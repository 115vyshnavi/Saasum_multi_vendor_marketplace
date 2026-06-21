import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { products, categories, user } from '../lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:saasum-marketplace@db.cnuklbvuumkvbkorjwbu.supabase.co:5432/postgres'

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 10,
})

const db = drizzle(pool, {
  schema: { products, categories, user }
})

// CSV Product interface matching Flipkart CSV headers
interface FlipkartCSVRow {
  'Uniq Id': string
  'Bb Category': string
  'Product Title': string
  'Product Description': string
  'Brand': string
  'Mrp': string
  'Price': string
  'Stock Availibility': string
  'Image Url': string
}

// Database Product interface
interface DBProduct {
  name: string
  slug: string
  description: string
  shortDescription: string
  price: string
  compareAtPrice: string | null
  stock: number
  sku: string
  rating: string
  reviewCount: number
  images: string[]
  brand: string | null
  categoryId: number
  vendorId: string
  status: 'active'
  isActive: true
  metaTitle: string
  metaDescription: string
}

// Generate slug from product name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Generate short description from full description
function generateShortDescription(description: string): string {
  if (!description) return 'No description available.'
  if (description.length <= 120) return description
  return description.substring(0, 120).trim() + '...'
}

// Main import function
async function importProducts() {
  try {
    console.log('🚀 Starting product import from Flipkart CSV...')

    const csvPath = 'D:\\New folder\\home\\sdf\\marketing_sample_for_flipkart_com-ecommerce__20191101_20191130__15k_data.csv'
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`Flipkart CSV file not found at: ${csvPath}`)
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const csvProducts: FlipkartCSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      skip_records_with_error: true,
    })

    console.log(`📊 Found ${csvProducts.length} raw products in CSV`)

    // Fetch categories and create mapping
    console.log('📁 Fetching categories from database...')
    const dbCategories = await db.select().from(categories)
    const categoryMap = new Map<string, number>()
    dbCategories.forEach(cat => {
      categoryMap.set(cat.name, cat.id)
    })

    console.log(`✅ Found ${dbCategories.length} existing categories`)

    // Fetch vendors for rotation, create one if not exists
    console.log('👥 Fetching vendors from database...')
    let vendors = await db.select().from(user).where(eq(user.role, 'vendor'))
    
    if (vendors.length === 0) {
      console.log('⚠️ No vendors found. Creating a default Flipkart Vendor...')
      const defaultVendorId = 'default_vendor_flipkart'
      await db.insert(user).values({
        id: defaultVendorId,
        name: 'Flipkart Vendor Hub',
        email: 'vendor@flipkart.com',
        role: 'vendor',
        profileComplete: true,
      })
      vendors = await db.select().from(user).where(eq(user.role, 'vendor'))
    }

    console.log(`✅ Found ${vendors.length} vendors for rotation`)

    // Transform products (filtering out invalid titles/prices)
    console.log('🔄 Transforming products (taking first 1500 high-quality products)...')
    const dbProducts: DBProduct[] = []
    const categoryCache = new Map(categoryMap)

    for (let i = 0; i < csvProducts.length; i++) {
      if (dbProducts.length >= 1500) break // limit to exactly 1500 products

      const row = csvProducts[i]
      const name = row['Product Title']
      const rawPrice = row['Price']
      const categoryPath = row['Bb Category']

      if (!name || !rawPrice || !categoryPath) continue

      try {
        // Clean category: split by >> and get top-level category name
        let categoryName = categoryPath.split('>>')[0].trim() || 'General'
        if (categoryName.length > 50) {
          categoryName = categoryName.substring(0, 50)
        }

        // Get or create category
        let categoryId = categoryCache.get(categoryName)
        if (!categoryId) {
          const catSlug = `${generateSlug(categoryName)}-${Math.floor(100 + Math.random() * 900)}`
          const [insertedCat] = await db
            .insert(categories)
            .values({
              name: categoryName,
              slug: catSlug,
              isActive: true,
            })
            .returning()
          
          categoryId = insertedCat.id
          categoryCache.set(categoryName, categoryId)
          console.log(`🆕 Created category: "${categoryName}"`)
        }

        // Clean prices
        const priceVal = parseFloat(rawPrice.replace(/[^0-9.]/g, ''))
        const mrpVal = parseFloat(row['Mrp'].replace(/[^0-9.]/g, ''))
        if (isNaN(priceVal) || priceVal <= 0) continue

        const price = priceVal.toFixed(2)
        const compareAtPrice = !isNaN(mrpVal) && mrpVal > priceVal ? mrpVal.toFixed(2) : null

        // Clean stock
        let stock = 20
        const stockStr = row['Stock Availibility'].toLowerCase()
        if (stockStr.includes('true') || stockStr.includes('in stock')) {
          stock = Math.floor(Math.random() * 80) + 20
        } else if (stockStr.includes('false') || stockStr.includes('out of stock')) {
          stock = 0
        } else {
          const parsedStock = parseInt(stockStr.replace(/[^0-9]/g, ''))
          if (!isNaN(parsedStock)) {
            stock = parsedStock
          }
        }

        // Clean brand
        const brand = row['Brand'] || 'Generic'

        // Clean images
        let images = row['Image Url']
          ? row['Image Url'].split('|').map((img: string) => img.trim()).filter((img: string) => img.startsWith('http'))
          : []
        if (images.length === 0) {
          images = ['/placeholder.svg']
        }

        // Rotate vendor
        const vendor = vendors[dbProducts.length % vendors.length]

        // Slug with unique ID suffix
        const slug = `${generateSlug(name).substring(0, 50)}-${dbProducts.length + 1}`

        // SKU code
        const brandCode = brand.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN'
        const sku = `FLIP-${brandCode}-${dbProducts.length + 1}-${Math.floor(100 + Math.random() * 900)}`

        // Random rating and review count
        const rating = (Math.random() * 1.5 + 3.5).toFixed(1)
        const reviewCount = Math.floor(Math.random() * 480) + 20

        const dbProduct: DBProduct = {
          name,
          slug,
          description: row['Product Description'] || name,
          shortDescription: generateShortDescription(row['Product Description']),
          price,
          compareAtPrice,
          stock,
          sku,
          rating,
          reviewCount,
          images,
          brand,
          categoryId,
          vendorId: vendor.id,
          status: 'active',
          isActive: true,
          metaTitle: `${name} - Buy Online | Saasum IQMart`,
          metaDescription: `${name}. Best deals. Fast shipping across India.`,
        }

        dbProducts.push(dbProduct)
      } catch (err) {
        // Skip individual error records silently
      }
    }

    console.log(`✅ Successfully transformed ${dbProducts.length} products`)

    // Clear cart items first to avoid foreign key references from carts
    console.log('🧹 Clearing cart items from database...')
    await db.execute(sql`DELETE FROM cart_items`)
    
    // Clear only unreferenced products to prevent foreign key errors with order_items
    console.log('🧹 Clearing unreferenced products from database...')
    await db.execute(sql`
      DELETE FROM products 
      WHERE id NOT IN (
        SELECT DISTINCT "productId" FROM order_items WHERE "productId" IS NOT NULL
      )
    `)
    console.log('✅ Unreferenced products cleared')

    // Batch insert transformed products
    console.log('💾 Starting batch insert...')
    const batchSize = 100
    let totalInserted = 0
    let batchNum = 1

    for (let i = 0; i < dbProducts.length; i += batchSize) {
      const batch = dbProducts.slice(i, i + batchSize)
      console.log(`📦 Inserting batch ${batchNum} (${batch.length} products)...`)
      await db.insert(products).values(batch).onConflictDoNothing()
      totalInserted += batch.length
      console.log(`✅ Completed: ${totalInserted}/${dbProducts.length} processed`)
      batchNum++
    }

    console.log(`\n🎉 Seed Successful! Total products in database: ${totalInserted}`)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Execute import if run directly
if (require.main === module) {
  importProducts()
    .then(() => {
      console.log('✅ Seed runner completed.')
      process.exit(0)
    })
    .catch((err) => {
      console.error('❌ Seed runner failed:', err)
      process.exit(1)
    })
}

export { importProducts }