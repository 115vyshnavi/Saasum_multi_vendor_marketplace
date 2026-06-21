import { db } from './lib/db/index'
import { categories, products, vendorProfiles, user } from './lib/db/schema'
import { eq } from 'drizzle-orm'

// Categories data
const seedCategories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest smartphones, laptops, headphones, smartwatches and electronic accessories',
    image: '/categories/electronics.png',
    isActive: true,
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Trendy clothing, footwear, accessories for men, women and kids',
    image: '/categories/fashion.png',
    isActive: true,
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Essential cookware, appliances, utensils, storage solutions and cleaning supplies',
    image: '/categories/home.png',
    isActive: true,
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    description: 'Sports equipment, fitness gear, outdoor activities and sportswear',
    image: '/categories/sports.png',
    isActive: true,
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    description: 'Premium skincare, makeup, hair care, perfumes and beauty essentials',
    image: '/categories/beauty.png',
    isActive: true,
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Self-help, novels, kids books, educational content and entertainment reading',
    image: '/categories/books.png',
    isActive: true,
  },
]

// Sample vendor users
const sampleVendors = [
  { id: 'vendor_1', name: 'TechWorld Store', email: 'admin@techworld.com', role: 'vendor' as const, profileComplete: true },
  { id: 'vendor_2', name: 'StyleHub Fashion', email: 'admin@stylehub.com', role: 'vendor' as const, profileComplete: true },
  { id: 'vendor_3', name: 'HomeEssentials', email: 'admin@homeessentials.com', role: 'vendor' as const, profileComplete: true },
]

// Sample products data
function generateSampleProducts(categoryId: number, vendorId: string, categoryName: string) {
  const productsByCategory: Record<string, any[]> = {
    'Electronics': [
      { name: 'iPhone 15 Pro Max 256GB', price: '1199.99', compareAtPrice: '1399.99', subcategory: 'Smartphones' },
      { name: 'Samsung Galaxy S24 Ultra', price: '1099.99', compareAtPrice: '1299.99', subcategory: 'Smartphones' },
      { name: 'MacBook Pro 14" M3', price: '1999.99', compareAtPrice: '2299.99', subcategory: 'Laptops' },
      { name: 'Sony WH-1000XM5 Headphones', price: '299.99', compareAtPrice: '399.99', subcategory: 'Audio' },
      { name: 'Apple Watch Series 9', price: '399.99', compareAtPrice: '499.99', subcategory: 'Wearables' },
    ],
    'Fashion': [
      { name: 'Nike Air Max 270 Running Shoes', price: '129.99', compareAtPrice: '159.99', subcategory: 'Footwear' },
      { name: 'Levis 501 Original Jeans', price: '69.99', compareAtPrice: '89.99', subcategory: 'Men\'s Clothing' },
      { name: 'Adidas Essentials Hoodie', price: '49.99', compareAtPrice: '69.99', subcategory: 'Men\'s Clothing' },
      { name: 'Zara Women\'s Blazer', price: '79.99', compareAtPrice: '99.99', subcategory: 'Women\'s Clothing' },
      { name: 'Tommy Hilfiger Polo Shirt', price: '39.99', compareAtPrice: '59.99', subcategory: 'Men\'s Clothing' },
    ],
    'Home & Kitchen': [
      { name: 'Philips Air Fryer XXL', price: '199.99', compareAtPrice: '249.99', subcategory: 'Appliances' },
      { name: 'Ninja Professional Blender', price: '89.99', compareAtPrice: '119.99', subcategory: 'Appliances' },
      { name: 'Tefal Non-Stick Cookware Set', price: '149.99', compareAtPrice: '199.99', subcategory: 'Cookware' },
      { name: 'OXO Food Storage Container Set', price: '49.99', compareAtPrice: '69.99', subcategory: 'Storage' },
      { name: 'Breville Espresso Machine', price: '299.99', compareAtPrice: '399.99', subcategory: 'Appliances' },
    ],
    'Sports & Outdoors': [
      { name: 'Yoga Mat Premium 6mm', price: '29.99', compareAtPrice: '39.99', subcategory: 'Fitness' },
      { name: 'Adjustable Dumbbell Set 20kg', price: '149.99', compareAtPrice: '199.99', subcategory: 'Fitness' },
      { name: 'Nike Dri-FIT Running T-Shirt', price: '24.99', compareAtPrice: '34.99', subcategory: 'Sportswear' },
      { name: 'Wilson Tennis Racket Pro', price: '89.99', compareAtPrice: '119.99', subcategory: 'Sports Equipment' },
      { name: 'Adidas Football Size 5', price: '19.99', compareAtPrice: '29.99', subcategory: 'Sports Equipment' },
    ],
    'Beauty': [
      { name: 'The Ordinary Hyaluronic Acid Serum', price: '12.99', compareAtPrice: '18.99', subcategory: 'Skincare' },
      { name: 'CeraVe Daily Moisturizer SPF 30', price: '16.99', compareAtPrice: '24.99', subcategory: 'Skincare' },
      { name: 'LOreal Paris Shampoo & Conditioner', price: '8.99', compareAtPrice: '12.99', subcategory: 'Hair Care' },
      { name: 'Maybelline Mascara Waterproof', price: '9.99', compareAtPrice: '14.99', subcategory: 'Makeup' },
      { name: 'Neutrogena Face Wash Gentle', price: '6.99', compareAtPrice: '9.99', subcategory: 'Skincare' },
    ],
    'Books': [
      { name: 'Atomic Habits by James Clear', price: '14.99', compareAtPrice: '19.99', subcategory: 'Self-Help' },
      { name: 'Deep Work by Cal Newport', price: '13.99', compareAtPrice: '18.99', subcategory: 'Self-Help' },
      { name: 'The Alchemist by Paulo Coelho', price: '11.99', compareAtPrice: '15.99', subcategory: 'Fiction' },
      { name: 'Harry Potter Complete Collection', price: '49.99', compareAtPrice: '69.99', subcategory: 'Fiction' },
      { name: 'Where the Crawdads Sing', price: '12.99', compareAtPrice: '16.99', subcategory: 'Fiction' },
    ],
  }

  const categoryProducts = productsByCategory[categoryName] || []
  
  return categoryProducts.map((product, index) => {
    const slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)

    return {
      name: product.name,
      slug: `${slug}-${categoryId}-${index}`,
      description: `Premium quality ${product.name.toLowerCase()} with advanced features and excellent build quality. Perfect for ${categoryName.toLowerCase()} enthusiasts.`,
      shortDescription: `High-quality ${product.name.toLowerCase()} at best price`,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: Math.floor(Math.random() * 100) + 20,
      sku: `SKU-${categoryName.substring(0, 3).toUpperCase()}-${Date.now()}-${index}`.substring(0, 20),
      rating: (4.0 + Math.random() * 1).toFixed(1),
      reviewCount: Math.floor(Math.random() * 500) + 50,
      images: [`/products/${categoryName.toLowerCase().replace(/\s/g, '-')}-${index + 1}.jpg`],
      categoryId,
      vendorId,
      status: 'active' as const,
      isActive: true,
      metaTitle: `${product.name} - Best Price Online`,
      metaDescription: `Buy ${product.name} at best price with fast delivery and warranty`,
    }
  })
}

async function seedMarketplaceData() {
  try {
    console.log('🌱 Starting marketplace data seeding...')

    // Insert categories
    console.log('📁 Inserting categories...')
    const insertedCategories = await db.insert(categories).values(seedCategories).returning()
    console.log(`✅ Inserted ${insertedCategories.length} categories`)

    // Check for existing vendor users
    console.log('👥 Checking vendor users...')
    const existingVendors = await db.select().from(user).where(eq(user.role, 'vendor'))
    
    let vendorUsers = []
    if (existingVendors.length === 0) {
      console.log('📝 Creating sample vendor users...')
      vendorUsers = await db.insert(user).values(sampleVendors).returning()
      console.log(`✅ Created ${vendorUsers.length} vendor users`)
    } else {
      vendorUsers = existingVendors.slice(0, 3)
      console.log(`✅ Using ${vendorUsers.length} existing vendor users`)
    }

    // Create vendor profiles
    console.log('🏪 Creating vendor profiles...')
    const vendorProfilesData = vendorUsers.map((vendor, index) => ({
      userId: vendor.id,
      businessName: `${vendor.name} Business Ltd`,
      storeName: vendor.name,
      storeDescription: `Premium quality products from ${vendor.name}`,
      businessAddress: `${100 + index} Business Street`,
      businessCity: 'Mumbai',
      businessState: 'Maharashtra',
      businessPincode: `400${(index + 1).toString().padStart(3, '0')}`,
      approvalStatus: 'approved' as const,
      approvedAt: new Date(),
    }))
    
    const insertedProfiles = await db.insert(vendorProfiles).values(vendorProfilesData).returning()
    console.log(`✅ Created ${insertedProfiles.length} vendor profiles`)

    // Generate and insert products
    console.log('📦 Generating products...')
    let allProducts: any[] = []
    
    for (let i = 0; i < insertedCategories.length; i++) {
      const category = insertedCategories[i]
      const vendor = vendorUsers[i % vendorUsers.length]
      
      const categoryProducts = generateSampleProducts(category.id, vendor.id, category.name)
      allProducts = [...allProducts, ...categoryProducts]
    }

    console.log(`📊 Generated ${allProducts.length} products`)
    
    // Insert products
    const insertedProducts = await db.insert(products).values(allProducts).returning()
    console.log(`✅ Inserted ${insertedProducts.length} products`)

    // Verification
    console.log('\\n🔍 Verifying data...')
    const categoryCount = await db.select().from(categories)
    const productCount = await db.select().from(products)
    const vendorCount = await db.select().from(vendorProfiles)
    
    console.log('\\n📊 SEEDING SUMMARY:')
    console.log(`✅ Categories: ${categoryCount.length}`)
    console.log(`✅ Vendor Profiles: ${vendorCount.length}`)
    console.log(`✅ Products: ${productCount.length}`)
    
    console.log('\\n🎉 Marketplace seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  }
}

// Execute seeding
seedMarketplaceData()
  .then(() => {
    console.log('✅ Seeding process completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })