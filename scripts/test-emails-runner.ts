import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  console.log("=== Importing Modules ===")
  const { sendWelcomeEmail, sendOrderConfirmationEmail } = await import("../lib/email")
  const { db } = await import("../lib/db")
  const {
    orders: ordersTable,
    orderItems: orderItemsTable,
    user: userTable,
    products: productsTable,
  } = await import("../lib/db/schema")
  const { desc } = await import("drizzle-orm")

  console.log("\n=== Testing Welcome Email ===")
  const welcomeResult = await sendWelcomeEmail({
    email: "buyer-test@saasum.com",
    name: "Aria Sterling",
    role: "buyer",
  })
  console.log("Welcome Email Result:", welcomeResult)

  console.log("\n=== Testing Order Confirmation Email ===")
  
  // 1. Get or create a user in the database
  let usersList = await db.select().from(userTable).limit(1)
  let userId = usersList[0]?.id

  if (!userId) {
    console.log("No users found. Creating a test user...")
    userId = `test_user_${Date.now()}`
    await db.insert(userTable).values({
      id: userId,
      name: "Aria Sterling",
      email: "buyer-test@saasum.com",
      role: "buyer",
      profileComplete: true,
    })
    console.log(`Test user created: ${userId}`)
  } else {
    console.log(`Using existing user: ${userId} (${usersList[0].email})`)
  }

  // 2. Get a product from the database
  let productsList = await db.select().from(productsTable).limit(1)
  let product = productsList[0]

  if (!product) {
    console.log("❌ No products found in DB. Please run seed script first.")
    return
  }
  console.log(`Using product: ${product.name} (ID: ${product.id})`)

  // 3. Create a test order
  const orderId = `ORD-TEST-${Date.now()}`
  console.log(`Creating test order: ${orderId}`)

  await db.insert(ordersTable).values({
    id: orderId,
    userId,
    subtotal: product.price,
    shippingCost: "10.00",
    taxAmount: "0.00",
    totalAmount: (parseFloat(product.price) + 10).toFixed(2),
    status: "placed",
    shippingName: "Aria Sterling",
    shippingPhone: "555-0199",
    shippingAddress: "123 Infinite Loop, Cupertino",
    shippingCity: "San Jose",
    shippingState: "California",
    shippingPincode: "95123",
    paymentStatus: "paid",
    paymentMethod: "Credit Card",
  })

  // 4. Create test order item
  await db.insert(orderItemsTable).values({
    orderId,
    productId: product.id,
    vendorId: product.vendorId,
    productName: product.name,
    productSku: product.sku,
    quantity: 1,
    unitPrice: product.price,
    totalPrice: product.price,
    status: "placed",
  })
  console.log("Test order and items inserted successfully.")

  // 5. Dispatch email
  const confirmResult = await sendOrderConfirmationEmail(orderId, "customer-test@saasum.com")
  console.log("Order Confirmation Result:", confirmResult)

  console.log("\n=== Dispatch Tests Complete ===")
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err)
    process.exit(1)
  })
