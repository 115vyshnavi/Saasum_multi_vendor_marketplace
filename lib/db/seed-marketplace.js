import { db } from './index.js'
import { categories, products, vendorProfiles, user } from './schema.js'
import { eq } from 'drizzle-orm'

// Categories with rich subcategories
const seedCategories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest smartphones, laptops, headphones, smartwatches and electronic accessories',
    isActive: true,
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Trendy clothing, footwear, accessories for men, women and kids',
    isActive: true,
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Essential cookware, appliances, utensils, storage solutions and cleaning supplies',
    isActive: true,
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    description: 'Sports equipment, fitness gear, outdoor activities and sportswear',
    isActive: true,
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    description: 'Premium skincare, makeup, hair care, perfumes and beauty essentials',
    isActive: true,
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Self-help, novels, kids books, educational content and entertainment reading',
    isActive: true,
  },
]

// Sample vendor users data
const sampleVendors = [
  {
    id: 'vendor_1',
    name: 'TechWorld Store',
    email: 'admin@techworld.com',
    role: 'vendor',
    profileComplete: true,
  },
  {
    id: 'vendor_2', 
    name: 'StyleHub Fashion',
    email: 'admin@stylehub.com',
    role: 'vendor',
    profileComplete: true,
  },
  {
    id: 'vendor_3',
    name: 'HomeEssentials',
    email: 'admin@homeessentials.com', 
    role: 'vendor',
    profileComplete: true,
  },
  {
    id: 'vendor_4',
    name: 'FitLife Sports',
    email: 'admin@fitlife.com',
    role: 'vendor', 
    profileComplete: true,
  },
  {
    id: 'vendor_5',
    name: 'BeautyPro',
    email: 'admin@beautypro.com',
    role: 'vendor',
    profileComplete: true,
  },
  {
    id: 'vendor_6',
    name: 'BookHub',
    email: 'admin@bookhub.com',
    role: 'vendor',
    profileComplete: true,
  },
]

// Generate comprehensive product data
function generateProducts(categories, vendors) {
  const products = []

  // Electronics - 100 products
  const electronicsProducts = [
    // Mobiles (25)
    ...Array.from({ length: 25 }, (_, i) => ({
      name: `${['iPhone 15', 'Samsung Galaxy S24', 'OnePlus 12', 'Google Pixel 8', 'Xiaomi 14'][i % 5]} ${['Pro', 'Ultra', 'Plus', ''][i % 4]}`.trim(),
      price: (599 + Math.random() * 800).toFixed(2),
      compareAtPrice: (799 + Math.random() * 600).toFixed(2),
      stock: Math.floor(Math.random() * 50) + 10,
      rating: (4.0 + Math.random() * 1).toFixed(1),
      reviewCount: Math.floor(Math.random() * 5000) + 100,
      subcategory: 'Smartphones',
      description: 'Latest flagship smartphone with advanced camera system, powerful processor and premium design',
    })),
    // Laptops (25)
    ...Array.from({ length: 25 }, (_, i) => ({
      name: `${['MacBook Pro', 'Dell XPS', 'HP Spectre', 'Lenovo ThinkPad', 'ASUS ZenBook'][i % 5]} ${['13"', '14"', '15"', '16"'][i % 4]}`,
      price: (899 + Math.random() * 1500).toFixed(2),
      compareAtPrice: (1199 + Math.random() * 1000).toFixed(2),
      stock: Math.floor(Math.random() * 30) + 5,
      rating: (4.2 + Math.random() * 0.8).toFixed(1),
      reviewCount: Math.floor(Math.random() * 3000) + 150,
      subcategory: 'Laptops',
      description: 'High-performance laptop with premium build quality, excellent display and long battery life',
    })),
    // Headphones (25)
    ...Array.from({ length: 25 }, (_, i) => ({
      name: `${['Sony WH-1000XM5', 'Bose QuietComfort', 'Apple AirPods', 'Sennheiser HD', 'Audio-Technica ATH'][i % 5]} ${['Pro', 'Max', 'Ultra', ''][i % 4]}`.trim(),
      price: (99 + Math.random() * 300).toFixed(2),
      compareAtPrice: (149 + Math.random() * 200).toFixed(2),
      stock: Math.floor(Math.random() * 100) + 20,
      rating: (4.3 + Math.random() * 0.7).toFixed(1),
      reviewCount: Math.floor(Math.random() * 8000) + 200,
      subcategory: 'Audio',
      description: 'Premium wireless headphones with noise cancellation and superior sound quality',
    })),
    // Smartwatches (25)
    ...Array.from({ length: 25 }, (_, i) => ({
      name: `${['Apple Watch', 'Samsung Galaxy Watch', 'Fitbit Sense', 'Garmin Forerunner', 'Amazfit GTR'][i % 5]} ${['Series 9', 'Ultra', 'Pro', ''][i % 4]}`.trim(),
      price: (199 + Math.random() * 500).toFixed(2),
      compareAtPrice: (299 + Math.random() * 300).toFixed(2),
      stock: Math.floor(Math.random() * 80) + 15,
      rating: (4.1 + Math.random() * 0.9).toFixed(1),
      reviewCount: Math.floor(Math.random() * 4000) + 180,
      subcategory: 'Wearables',
      description: 'Advanced smartwatch with fitness tracking, health monitoring and smart notifications',
    })),
  ]

  // Fashion - 150 products  
  const fashionProducts = [
    // Men's Clothing (50)
    ...Array.from({ length: 50 }, (_, i) => {
      const items = ['T-Shirt', 'Jeans', 'Hoodie', 'Shirt', 'Jacket', 'Polo', 'Chinos', 'Sweater']
      const brands = ['Nike', 'Adidas', 'Zara', 'H&M', 'Levis', 'Tommy', 'Ralph Lauren', 'Puma']
      return {
        name: `${brands[i % brands.length]} Men's ${items[i % items.length]}`,
        price: (25 + Math.random() * 150).toFixed(2),
        compareAtPrice: (35 + Math.random() * 100).toFixed(2),
        stock: Math.floor(Math.random() * 200) + 50,
        rating: (3.8 + Math.random() * 1.2).toFixed(1),
        reviewCount: Math.floor(Math.random() * 2000) + 50,
        subcategory: 'Men\'s Clothing',
        description: 'Comfortable and stylish men\'s clothing made from premium materials',
      }
    }),
    // Women's Clothing (50)
    ...Array.from({ length: 50 }, (_, i) => {
      const items = ['Dress', 'Top', 'Jeans', 'Blouse', 'Skirt', 'Jacket', 'Leggings', 'Cardigan']
      const brands = ['Zara', 'H&M', 'Forever 21', 'Mango', 'Uniqlo', 'Gap', 'Vero Moda', 'Only']
      return {
        name: `${brands[i % brands.length]} Women's ${items[i % items.length]}`,
        price: (30 + Math.random() * 200).toFixed(2),
        compareAtPrice: (45 + Math.random() * 150).toFixed(2),
        stock: Math.floor(Math.random() * 180) + 40,
        rating: (4.0 + Math.random() * 1.0).toFixed(1),
        reviewCount: Math.floor(Math.random() * 2500) + 80,
        subcategory: 'Women\'s Clothing',
        description: 'Trendy and elegant women\'s fashion with modern cuts and premium fabrics',
      }
    }),
    // Footwear (50)
    ...Array.from({ length: 50 }, (_, i) => {
      const items = ['Running Shoes', 'Sneakers', 'Boots', 'Sandals', 'Heels', 'Flats', 'Loafers', 'Sports Shoes']
      const brands = ['Nike', 'Adidas', 'Puma', 'Reebok', 'Converse', 'Vans', 'New Balance', 'Skechers']
      return {
        name: `${brands[i % brands.length]} ${items[i % items.length]}`,
        price: (50 + Math.random() * 250).toFixed(2),
        compareAtPrice: (75 + Math.random() * 200).toFixed(2),
        stock: Math.floor(Math.random() * 120) + 30,
        rating: (4.1 + Math.random() * 0.9).toFixed(1),
        reviewCount: Math.floor(Math.random() * 3000) + 100,
        subcategory: 'Footwear',
        description: 'Comfortable and durable footwear designed for style and performance',
      }
    }),
  ]

  // Home & Kitchen - 100 products
  const homeKitchenProducts = [
    // Cookware (35)
    ...Array.from({ length: 35 }, (_, i) => {
      const items = ['Non-Stick Pan', 'Pressure Cooker', 'Cookware Set', 'Wok', 'Dutch Oven', 'Saucepan', 'Stockpot']
      const brands = ['Tefal', 'Prestige', 'Hawkins', 'Pigeon', 'Meyer', 'Calphalon', 'Cuisinart']
      return {
        name: `${brands[i % brands.length]} ${items[i % items.length]}`,
        price: (25 + Math.random() * 200).toFixed(2),
        compareAtPrice: (40 + Math.random() * 150).toFixed(2),
        stock: Math.floor(Math.random() * 150) + 25,
        rating: (4.0 + Math.random() * 1.0).toFixed(1),
        reviewCount: Math.floor(Math.random() * 1500) + 75,
        subcategory: 'Cookware',
        description: 'High-quality cookware for efficient and healthy cooking',
      }
    }),
    // Appliances (35)
    ...Array.from({ length: 35 }, (_, i) => {
      const items = ['Air Fryer', 'Microwave', 'Blender', 'Coffee Maker', 'Toaster', 'Rice Cooker', 'Food Processor']
      const brands = ['Philips', 'Bajaj', 'Morphy Richards', 'Bosch', 'Panasonic', 'LG', 'Samsung']
      return {
        name: `${brands[i % brands.length]} ${items[i % items.length]}`,
        price: (50 + Math.random() * 400).toFixed(2),
        compareAtPrice: (80 + Math.random() * 300).toFixed(2),
        stock: Math.floor(Math.random() * 80) + 15,
        rating: (4.2 + Math.random() * 0.8).toFixed(1),
        reviewCount: Math.floor(Math.random() * 2000) + 120,
        subcategory: 'Appliances',
        description: 'Modern kitchen appliances to make cooking easier and more efficient',
      }
    }),
    // Storage & Organization (30)
    ...Array.from({ length: 30 }, (_, i) => {
      const items = ['Storage Container', 'Spice Rack', 'Organizer', 'Food Storage', 'Kitchen Rack', 'Basket']
      const brands = ['IKEA', 'Tupperware', 'Lock&Lock', 'Borosil', 'Milton', 'Signoraware']
      return {
        name: `${brands[i % brands.length]} ${items[i % items.length]} Set`,
        price: (15 + Math.random() * 100).toFixed(2),
        compareAtPrice: (25 + Math.random() * 75).toFixed(2),
        stock: Math.floor(Math.random() * 200) + 50,
        rating: (3.9 + Math.random() * 1.1).toFixed(1),
        reviewCount: Math.floor(Math.random() * 1000) + 60,
        subcategory: 'Storage',
        description: 'Smart storage solutions to keep your kitchen organized and clutter-free',
      }
    }),
  ]

  // Sports & Outdoors - 60 products
  const sportsProducts = [
    // Fitness Equipment (25)
    ...Array.from({ length: 25 }, (_, i) => {
      const items = ['Yoga Mat', 'Dumbbells', 'Resistance Bands', 'Foam Roller', 'Exercise Ball', 'Jump Rope']
      const brands = ['Reebok', 'Adidas', 'Nike', 'Strauss', 'Cockatoo', 'Fitkit']
      return {
        name: `${brands[i % brands.length]} ${items[i % items.length]}`,
        price: (20 + Math.random() * 150).toFixed(2),
        compareAtPrice: (30 + Math.random() * 100).toFixed(2),
        stock: Math.floor(Math.random() * 100) + 20,
        rating: (4.0 + Math.random() * 1.0).toFixed(1),
        reviewCount: Math.floor(Math.random() * 1200) + 40,
        subcategory: 'Fitness Equipment',
        description: 'Professional fitness equipment for home workouts and gym training',
      }
    }),
    // Sports Gear (35)
    ...Array.from({ length: 35 }, (_, i) => {
      const items = ['Cricket Bat', 'Football', 'Tennis Racket', 'Badminton Set', 'Basketball', 'Sports Jersey', 'Track Pants']
      const brands = ['Nike', 'Adidas', 'Puma', 'Yonex', 'Nivia', 'Cosco', 'Wilson']
      return {
        name: `${brands[i % brands.length]} ${items[i % items.length]}`,
        price: (25 + Math.random() * 200).toFixed(2),
        compareAtPrice: (40 + Math.random() * 150).toFixed(2),
        stock: Math.floor(Math.random() * 80) + 15,
        rating: (4.1 + Math.random() * 0.9).toFixed(1),
        reviewCount: Math.floor(Math.random() * 800) + 30,
        subcategory: 'Sports Gear',
        description: 'High-quality sports equipment for professional and recreational play',
      }
    }),
  ]

  // Beauty - 80 products  
  const beautyProducts = [
    // Skincare (30)
    ...Array.from({ length: 30 }, (_, i) => {
      const items = ['Face Serum', 'Moisturizer', 'Sunscreen', 'Face Wash', 'Night Cream', 'Eye Cream', 'Toner']
      const brands = ['Olay', 'Neutrogena', 'Cetaphil', 'The Ordinary', 'Nykaa', 'Lakme', 'Biotique']
      return {
        name: `${brands[i % brands.length]} ${items[i % items.length]}`,
        price: (15 + Math.random() * 100).toFixed(2),
        compareAtPrice: (25 + Math.random() * 75).toFixed(2),
        stock: Math.floor(Math.random() * 150) + 30,
        rating: (4.0 + Math.random() * 1.0).toFixed(1),
        reviewCount: Math.floor(Math.random() * 2000) + 100,
        subcategory: 'Skincare',
        description: 'Advanced skincare products for healthy and glowing skin',
      }
    }),
    // Hair Care (25)
    ...Array.from({ length: 25 }, (_, i) => {
      const items = ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Serum', 'Hair Mask', 'Hair Spray']
      const brands = ['LOreal', 'Pantene', 'Head & Shoulders', 'Tresemme', 'Garnier', 'Schwarzkopf', 'Matrix']
      return {
        name: `${brands[i % brands.length]} ${items[i % items.length]}`,
        price: (10 + Math.random() * 80).toFixed(2),
        compareAtPrice: (18 + Math.random() * 60).toFixed(2),
        stock: Math.floor(Math.random() * 200) + 40,
        rating: (3.9 + Math.random() * 1.1).toFixed(1),
        reviewCount: Math.floor(Math.random() * 1500) + 80,
        subcategory: 'Hair Care',
        description: 'Premium hair care products for all hair types and concerns',
      }
    }),
    // Makeup (25)
    ...Array.from({ length: 25 }, (_, i) => {
      const items = ['Lipstick', 'Foundation', 'Mascara', 'Eyeliner', 'Blush', 'Concealer', 'Nail Polish']
      const brands = ['Maybelline', 'Revlon', 'MAC', 'Lakme', 'Nykaa', 'Colorbar', 'Sugar Cosmetics']
      return {
        name: `${brands[i % brands.length]} ${items[i % items.length]}`,
        price: (8 + Math.random() * 120).toFixed(2),
        compareAtPrice: (15 + Math.random() * 90).toFixed(2),
        stock: Math.floor(Math.random() * 180) + 25,
        rating: (4.1 + Math.random() * 0.9).toFixed(1),
        reviewCount: Math.floor(Math.random() * 1800) + 90,
        subcategory: 'Makeup',
        description: 'High-quality makeup products for a flawless and radiant look',
      }
    }),
  ]

  // Books - 60 products
  const bookProducts = [
    // Self-help (20)
    ...Array.from({ length: 20 }, (_, i) => {
      const titles = ['Atomic Habits', 'Deep Work', 'The Power of Now', 'Think and Grow Rich', 'Rich Dad Poor Dad', 'The 7 Habits', 'Mindset', 'Grit']
      const authors = ['James Clear', 'Cal Newport', 'Eckhart Tolle', 'Napoleon Hill', 'Robert Kiyosaki', 'Stephen Covey', 'Carol Dweck', 'Angela Duckworth']
      return {
        name: `${titles[i % titles.length]} by ${authors[i % authors.length]}`,
        price: (10 + Math.random() * 30).toFixed(2),
        compareAtPrice: (15 + Math.random() * 25).toFixed(2),
        stock: Math.floor(Math.random() * 500) + 100,
        rating: (4.3 + Math.random() * 0.7).toFixed(1),
        reviewCount: Math.floor(Math.random() * 5000) + 200,
        subcategory: 'Self-Help',
        description: 'Life-changing self-help book with practical strategies for personal growth',
      }
    }),
    // Fiction (20)
    ...Array.from({ length: 20 }, (_, i) => {
      const titles = ['The Alchemist', 'Harry Potter', 'The Great Gatsby', 'Pride and Prejudice', 'To Kill a Mockingbird', '1984', 'The Catcher in the Rye', 'Lord of the Rings']
      const authors = ['Paulo Coelho', 'J.K. Rowling', 'F. Scott Fitzgerald', 'Jane Austen', 'Harper Lee', 'George Orwell', 'J.D. Salinger', 'J.R.R. Tolkien']
      return {
        name: `${titles[i % titles.length]} by ${authors[i % authors.length]}`,
        price: (8 + Math.random() * 25).toFixed(2),
        compareAtPrice: (12 + Math.random() * 20).toFixed(2),
        stock: Math.floor(Math.random() * 300) + 80,
        rating: (4.4 + Math.random() * 0.6).toFixed(1),
        reviewCount: Math.floor(Math.random() * 8000) + 500,
        subcategory: 'Fiction',
        description: 'Captivating fiction novel that takes you on an unforgettable journey',
      }
    }),
    // Children's Books (20)
    ...Array.from({ length: 20 }, (_, i) => {
      const titles = ['The Very Hungry Caterpillar', 'Where the Wild Things Are', 'Goodnight Moon', 'The Cat in the Hat', 'Green Eggs and Ham', 'Charlotte\'s Web', 'Matilda', 'The Lion King']
      return {
        name: `${titles[i % titles.length]} - Children's Book`,
        price: (5 + Math.random() * 20).toFixed(2),
        compareAtPrice: (8 + Math.random() * 15).toFixed(2),
        stock: Math.floor(Math.random() * 200) + 50,
        rating: (4.5 + Math.random() * 0.5).toFixed(1),
        reviewCount: Math.floor(Math.random() * 2000) + 150,
        subcategory: 'Children\'s Books',
        description: 'Delightful children\'s book with engaging stories and beautiful illustrations',
      }
    }),
  ]

  // Combine all products with category assignment
  const allProducts = [
    ...electronicsProducts.map(p => ({ ...p, categoryName: 'Electronics' })),
    ...fashionProducts.map(p => ({ ...p, categoryName: 'Fashion' })),
    ...homeKitchenProducts.map(p => ({ ...p, categoryName: 'Home & Kitchen' })),
    ...sportsProducts.map(p => ({ ...p, categoryName: 'Sports & Outdoors' })),
    ...beautyProducts.map(p => ({ ...p, categoryName: 'Beauty' })),
    ...bookProducts.map(p => ({ ...p, categoryName: 'Books' })),
  ]

  // Generate full product objects
  return allProducts.map((product, index) => {
    const slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    
    const category = categories.find(c => c.name === product.categoryName)
    const vendor = vendors[index % vendors.length]

    return {
      name: product.name,
      slug: `${slug}-${index}`,
      description: product.description,
      shortDescription: product.description.substring(0, 100) + '...',
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      sku: `SKU-${Date.now()}-${index}`.substring(0, 20),
      rating: product.rating,
      reviewCount: product.reviewCount,
      images: [`/products/${product.categoryName.toLowerCase().replace(/\s/g, '-')}-${index % 10 + 1}.jpg`],
      categoryId: category?.id || 1,
      vendorId: vendor.id,
      status: 'active',
      isActive: true,
      metaTitle: `${product.name} - Best Price Online`,
      metaDescription: `Buy ${product.name} at best price. ${product.description.substring(0, 120)}`,
    }
  })
}

/**
 * Main seeding function
 */
export async function seedMarketplaceData() {
  try {
    console.log('🌱 Starting comprehensive marketplace data seeding...')

    // Step 1: Insert categories
    console.log('📁 Inserting categories...')
    const insertedCategories = await db.insert(categories).values(seedCategories).returning()
    console.log(`✅ Inserted ${insertedCategories.length} categories`)

    // Step 2: Check for existing vendor users or create them
    console.log('👥 Checking vendor users...')
    const existingVendors = await db.select().from(user).where(eq(user.role, 'vendor'))
    
    let vendorUsers = []
    if (existingVendors.length === 0) {
      console.log('📝 Creating sample vendor users...')
      vendorUsers = await db.insert(user).values(sampleVendors).returning()
      console.log(`✅ Created ${vendorUsers.length} vendor users`)
    } else {
      vendorUsers = existingVendors.slice(0, 6) // Use first 6 existing vendors
      console.log(`✅ Using ${vendorUsers.length} existing vendor users`)
    }

    // Step 3: Create vendor profiles
    console.log('🏪 Creating vendor profiles...')
    const vendorProfilesData = vendorUsers.map((vendor, index) => ({
      userId: vendor.id,
      businessName: `${vendor.name} Business`,
      storeName: vendor.name,
      storeDescription: `Premium quality products from ${vendor.name}`,
      businessAddress: `${100 + index} Business Street`,
      businessCity: 'Mumbai',
      businessState: 'Maharashtra', 
      businessPincode: `400${(index + 1).toString().padStart(3, '0')}`,
      approvalStatus: 'approved',
      approvedAt: new Date(),
    }))
    
    const insertedProfiles = await db.insert(vendorProfiles).values(vendorProfilesData).returning()
    console.log(`✅ Created ${insertedProfiles.length} vendor profiles`)

    // Step 4: Generate and insert products
    console.log('📦 Generating comprehensive product catalog...')
    const productsData = generateProducts(insertedCategories, vendorUsers)
    console.log(`📊 Generated ${productsData.length} products across all categories`)
    
    // Insert products in batches to avoid memory issues
    const batchSize = 50
    let totalInserted = 0
    
    for (let i = 0; i < productsData.length; i += batchSize) {
      const batch = productsData.slice(i, i + batchSize)
      await db.insert(products).values(batch)
      totalInserted += batch.length
      console.log(`📦 Inserted batch ${Math.ceil((i + batchSize) / batchSize)}: ${totalInserted}/${productsData.length} products`)
    }

    // Step 5: Verification
    console.log('\n🔍 Verifying inserted data...')
    
    const categoryCount = await db.select().from(categories)
    const productCount = await db.select().from(products)
    const vendorCount = await db.select().from(vendorProfiles)
    
    console.log('\n📊 SEEDING SUMMARY:')
    console.log(`✅ Categories: ${categoryCount.length}`)
    console.log(`✅ Vendor Profiles: ${vendorCount.length}`)
    console.log(`✅ Products: ${productCount.length}`)
    
    console.log('\n📈 PRODUCTS BY CATEGORY:')
    for (const category of insertedCategories) {
      const count = await db.select().from(products).where(eq(products.categoryId, category.id))
      console.log(`   ${category.name}: ${count.length} products`)
    }
    
    console.log('\n🎉 Marketplace data seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding marketplace data:', error)
    throw error
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMarketplaceData()
    .then(() => {
      console.log('\n✅ Marketplace seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Marketplace seeding failed:', error)
      process.exit(1)
    })
}