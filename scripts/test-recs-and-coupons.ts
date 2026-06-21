import * as dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

async function run() {
  console.log("🧪 Starting Automated Verification for Recommendations and Coupons...\n")

  // Dynamically import database and actions
  const { db } = await import("../lib/db")
  const { products: productsTable } = await import("../lib/db/schema")
  const { getRelatedProducts, getCustomersAlsoBought } = await import("../app/actions/recommendations")
  const { validateCouponAction } = await import("../app/actions/coupons")

  try {
    // 1. Validate Product Seeding Count
    const dbProducts = await db.select().from(productsTable)
    console.log(`✅ 1. Product Seed Verification:`)
    console.log(`   - Total products in database: ${dbProducts.length}`)
    if (dbProducts.length >= 1500) {
      console.log(`   - Status: SUCCESS (1500 products seeded successfully)`)
    } else {
      console.log(`   - Status: WARNING (Expected 1500, found ${dbProducts.length})`)
    }

    if (dbProducts.length === 0) {
      throw new Error("No products found in database to perform recommendations verification.")
    }

    const testProduct = dbProducts[0]
    console.log(`\n✅ 2. Target Product for Recommendations:`)
    console.log(`   - Name: "${testProduct.name}"`)
    console.log(`   - Category ID: ${testProduct.categoryId}`)
    console.log(`   - Brand: "${testProduct.brand}"`)
    console.log(`   - Price: $${testProduct.price}`)
    console.log(`   - Rating: ${testProduct.rating}`)

    // 2. Validate Related Products Scoring
    console.log(`\n✅ 3. Testing getRelatedProducts:`)
    const related = await getRelatedProducts(testProduct.id, 8)
    console.log(`   - Returned: ${related.length} products`)
    related.slice(0, 3).forEach((p, idx) => {
      console.log(`     [#${idx + 1}] "${p.name}"`)
      console.log(`          Category ID: ${p.categoryId} (Match: ${p.categoryId === testProduct.categoryId ? "YES (+50)" : "NO"})`)
      console.log(`          Brand: "${p.brand}" (Match: ${p.brand?.toLowerCase() === testProduct.brand?.toLowerCase() ? "YES (+20)" : "NO"})`)
      console.log(`          Price: $${p.price} vs $${testProduct.price}`)
      console.log(`          Rating: ${p.rating}`)
    })
    if (related.length > 0) {
      console.log(`   - Status: SUCCESS`)
    } else {
      throw new Error("Related products returned empty list")
    }

    // 3. Validate Customers Also Bought
    console.log(`\n✅ 4. Testing getCustomersAlsoBought:`)
    const coBought = await getCustomersAlsoBought(testProduct.id, 8)
    console.log(`   - Returned: ${coBought.length} products`)
    if (coBought.length > 0) {
      console.log(`   - Status: SUCCESS`)
    } else {
      throw new Error("Customers also bought returned empty list")
    }

    // 4. Validate Coupon Application
    console.log(`\n✅ 5. Testing Coupon Engine Validation:`)
    
    // Test SAVE20 (20% off)
    const cartItems = [
      { productId: testProduct.id, quantity: 2 }
    ]
    const subtotal = parseFloat(testProduct.price) * 2

    console.log(`   - Applying "SAVE20" on cart subtotal $${subtotal.toFixed(2)}:`)
    const resSave20 = await validateCouponAction("SAVE20", cartItems, "test@example.com")
    if (resSave20.success) {
      console.log(`     - Success: TRUE`)
      console.log(`     - Discount Type: ${resSave20.coupon?.discountType}`)
      console.log(`     - Calculated Discount: $${resSave20.discountAmount?.toFixed(2)}`)
      console.log(`     - Final Subtotal: $${resSave20.subtotal?.toFixed(2)}`)
      console.log(`     - Status: SUCCESS`)
    } else {
      console.log(`     - Failed: ${resSave20.error}`)
    }

    // Test FIRST100 ($100 off on $500 minimum purchase)
    console.log(`   - Applying "FIRST100" on cart subtotal $${subtotal.toFixed(2)}:`)
    const resFirst100 = await validateCouponAction("FIRST100", cartItems, "test@example.com")
    if (resFirst100.success) {
      console.log(`     - Success: TRUE`)
      console.log(`     - Discount: $${resFirst100.discountAmount?.toFixed(2)}`)
      console.log(`     - Status: SUCCESS`)
    } else {
      console.log(`     - Failed (Expected if subtotal < 500): "${resFirst100.error}"`)
    }

    console.log(`\n🎉 Verification Completed Successfully!`)
    process.exit(0)
  } catch (err: any) {
    console.error(`\n❌ Verification Failed:`, err)
    process.exit(1)
  }
}

run()
