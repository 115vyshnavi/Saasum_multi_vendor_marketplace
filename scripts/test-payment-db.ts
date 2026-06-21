import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  console.log("=== Importing Modules ===")
  const { db } = await import("../lib/db")
  const { orders: ordersTable, user: userTable } = await import("../lib/db/schema")
  const { verifyAndCompletePayment, markPaymentFailed, getUserPaymentHistory } = await import("../app/actions/payment")
  const { placeOrder } = await import("../app/actions/order")
  const { eq } = await import("drizzle-orm")

  // 1. Get or create a user in the database
  let usersList = await db.select().from(userTable).limit(1)
  let userId = usersList[0]?.id
  let email = usersList[0]?.email

  if (!userId) {
    console.log("No users found. Creating a test user...")
    userId = `test_user_${Date.now()}`
    email = `buyer-test-${Date.now()}@saasum.com`
    await db.insert(userTable).values({
      id: userId,
      name: "Aria Sterling",
      email,
      role: "buyer",
      profileComplete: true,
    })
    console.log(`Test user created: ${userId}`)
  } else {
    console.log(`Using existing user: ${userId} (${email})`)
  }

  // 2. Create an order with placeOrder action (acting as online card payment)
  console.log("\n=== Placing Test Order for Payment Integration ===")
  const orderInput = {
    items: [], // empty items bypass transaction checks in placeOrder if no items? 
    // Wait! app/actions/order.ts returns "Cart is empty" if items.length === 0.
    // Let's find a product ID to place a valid order!
  }

  const { products: productsTable } = await import("../lib/db/schema")
  const productsList = await db.select().from(productsTable).limit(1)
  if (productsList.length === 0) {
    console.log("❌ No products found in database. Run seed script first.")
    return
  }

  const product = productsList[0]
  console.log(`Using product: ${product.name} (ID: ${product.id}, Price: $${product.price})`)

  const res = await placeOrder({
    items: [{ id: product.id, quantity: 1 }],
    address: {
      name: "Aria Sterling",
      phone: "555-0199",
      address: "123 Cupertino Way",
      city: "Cupertino",
      state: "California",
      pincode: "95014",
    },
    paymentMethod: "Card",
    email: email,
  })

  if (!res.success || !res.orderId) {
    console.error("❌ Failed to place test order:", res.error)
    return
  }

  const orderId = res.orderId
  console.log(`✅ Order placed successfully! Order ID: ${orderId}`)

  // Verify initial payment status is 'pending'
  let orderRow = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1)
  console.log(`Initial Payment Status in DB: ${orderRow[0]?.paymentStatus}`)

  // 3. Verify and complete payment (simulating Razorpay success callback)
  console.log("\n=== Simulating Razorpay Success Callback ===")
  const verifyRes = await verifyAndCompletePayment({
    orderId,
    razorpayPaymentId: `pay_sandbox_test_${Date.now()}`,
    razorpayOrderId: `order_sandbox_test_${Date.now()}`,
    razorpaySignature: "mock_sandbox_signature",
    paymentMethod: "Card",
  })

  if (verifyRes.success) {
    console.log("✅ verifyAndCompletePayment action succeeded!")
  } else {
    console.error("❌ verifyAndCompletePayment action failed:", verifyRes.error)
  }

  // Verify updated payment status in DB
  orderRow = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1)
  console.log(`Updated Payment Status in DB: ${orderRow[0]?.paymentStatus}`)
  console.log(`Recorded Transaction ID: ${orderRow[0]?.paymentId}`)
  console.log(`Order Status: ${orderRow[0]?.status}`)

  // 4. Test payment failure logging
  console.log("\n=== Testing Payment Failure Logging ===")
  const failOrderRes = await placeOrder({
    items: [{ id: product.id, quantity: 1 }],
    address: {
      name: "Aria Sterling",
      phone: "555-0199",
      address: "123 Cupertino Way",
      city: "Cupertino",
      state: "California",
      pincode: "95014",
    },
    paymentMethod: "UPI",
    email: email,
  })

  if (failOrderRes.success && failOrderRes.orderId) {
    const failedOrderId = failOrderRes.orderId
    console.log(`Order placed for failure testing: ${failedOrderId}`)
    
    await markPaymentFailed(failedOrderId)
    
    const failedOrderRow = await db.select().from(ordersTable).where(eq(ordersTable.id, failedOrderId)).limit(1)
    console.log(`Payment Status for failed order in DB: ${failedOrderRow[0]?.paymentStatus}`)
  }

  console.log("\n=== Verification Complete ===")
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err)
    process.exit(1)
  })
