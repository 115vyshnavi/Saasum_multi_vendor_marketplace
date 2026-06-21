import { db } from './index'
import { categories, products, vendorProfiles } from './schema'

export const seedCategories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Smartphones, laptops, gadgets and electronic accessories',
    image: '/categories/electronics.png',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Clothing, footwear, accessories and fashion items',
    image: '/categories/fashion.png',
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Furniture, appliances, kitchenware and home decor',
    image: '/categories/home.png',
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    description: 'Sports equipment, outdoor gear and fitness products',
    image: '/categories/sports.png',
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    description: 'Cosmetics, skincare, hair care and beauty products',
    image: '/categories/beauty.png',
  },
  {
    name: 'Grocery',
    slug: 'grocery',
    description: 'Food items, beverages, snacks and daily essentials',
    image: '/categories/grocery.png',
  },
]

export const seedProducts = [
  {
    name: 'Aura Wireless Headphones',
    slug: 'aura-wireless-headphones',
    description: 'Premium wireless headphones with noise cancellation and 30-hour battery life.',
    shortDescription: 'Premium wireless headphones with noise cancellation.',
    price: '129.00',
    compareAtPrice: '199.00',
    stock: 184,
    sku: 'AUR-HP-01',
    images: ['/products/headphones.png'],
    rating: '4.8',
    reviewCount: 2143,
    status: 'active' as const,
    metaTitle: 'Aura Wireless Headphones - Premium Audio Experience',
    metaDescription: 'Experience premium sound quality with Aura Wireless Headphones. Noise cancellation, long battery life.',
  },
  {
    name: 'Pulse Fitness Smartwatch',
    slug: 'pulse-fitness-smartwatch',
    description: 'Advanced fitness tracking smartwatch with heart rate monitoring, GPS, and water resistance.',
    shortDescription: 'Advanced fitness tracking smartwatch with heart rate monitoring.',
    price: '89.00',
    compareAtPrice: '149.00',
    stock: 42,
    sku: 'PLS-SW-02',
    images: ['/products/smartwatch.png'],
    rating: '4.7',
    reviewCount: 1876,
    status: 'active' as const,
    metaTitle: 'Pulse Fitness Smartwatch - Track Your Health',
    metaDescription: 'Advanced fitness tracking with heart rate monitoring, GPS, and water resistance.',
  },
  {
    name: 'Stride Running Sneakers',
    slug: 'stride-running-sneakers',
    description: 'Lightweight running sneakers with advanced cushioning and breathable mesh upper.',
    shortDescription: 'Lightweight running sneakers with advanced cushioning.',
    price: '74.00',
    compareAtPrice: '99.00',
    stock: 9,
    sku: 'STR-SN-03',
    images: ['/products/sneakers.png'],
    rating: '4.9',
    reviewCount: 980,
    status: 'active' as const,
    metaTitle: 'Stride Running Sneakers - Ultimate Comfort',
    metaDescription: 'Lightweight running sneakers with advanced cushioning for ultimate comfort.',
  },
  {
    name: 'Trek Canvas Backpack',
    slug: 'trek-canvas-backpack',
    description: 'Durable canvas backpack with multiple compartments, perfect for travel and daily use.',
    shortDescription: 'Durable canvas backpack with multiple compartments.',
    price: '59.00',
    compareAtPrice: '79.00',
    stock: 67,
    sku: 'TRK-BP-05',
    images: ['/products/backpack.png'],
    rating: '4.8',
    reviewCount: 1340,
    status: 'pending' as const,
    metaTitle: 'Trek Canvas Backpack - Travel in Style',
    metaDescription: 'Durable canvas backpack perfect for travel and daily use with multiple compartments.',
  },
  {
    name: 'Brew Pro Espresso Maker',
    slug: 'brew-pro-espresso-maker',
    description: 'Professional-grade espresso maker with built-in grinder and milk frother.',
    shortDescription: 'Professional-grade espresso maker with built-in grinder.',
    price: '219.00',
    compareAtPrice: '289.00',
    stock: 23,
    sku: 'BRW-EM-06',
    images: ['/products/coffee-maker.png'],
    rating: '4.9',
    reviewCount: 754,
    status: 'pending' as const,
    metaTitle: 'Brew Pro Espresso Maker - Café Quality at Home',
    metaDescription: 'Professional-grade espresso maker with built-in grinder and milk frother.',
  },
  {
    name: 'Halo Tortoise Sunglasses',
    slug: 'halo-tortoise-sunglasses',
    description: 'Classic tortoise shell sunglasses with UV protection and polarized lenses.',
    shortDescription: 'Classic tortoise shell sunglasses with UV protection.',
    price: '45.00',
    stock: 0,
    sku: 'HAL-SG-04',
    images: ['/products/sunglasses.png'],
    rating: '4.6',
    reviewCount: 612,
    status: 'draft' as const,
    metaTitle: 'Halo Tortoise Sunglasses - Classic Style',
    metaDescription: 'Classic tortoise shell sunglasses with UV protection and polarized lenses.',
  },
]

/**
 * Seed the database with initial categories and sample products
 * Note: This should only be run once during initial setup
 */
export async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...')

    // Insert categories
    console.log('📁 Inserting categories...')
    const insertedCategories = await db.insert(categories).values(seedCategories).returning()
    console.log(`✅ Inserted ${insertedCategories.length} categories`)

    // Note: Products and vendor profiles will be seeded separately
    // after proper user accounts are created since they require foreign keys

    console.log('🎉 Database seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

/**
 * Seed products for a specific vendor
 * This should be called after vendor users are created
 */
export async function seedProductsForVendor(vendorId: string, categoryId: number) {
  try {
    const productsWithVendor = seedProducts.map((product) => ({
      ...product,
      vendorId,
      categoryId,
    }))

    const insertedProducts = await db.insert(products).values(productsWithVendor).returning()
    console.log(`✅ Inserted ${insertedProducts.length} products for vendor ${vendorId}`)
    return insertedProducts
  } catch (error) {
    console.error('❌ Error seeding products:', error)
    throw error
  }
}

// Export for manual execution
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Database seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Database seeding failed:', error)
      process.exit(1)
    })
}