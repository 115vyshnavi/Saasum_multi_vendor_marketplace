import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  console.log("=== Importing DB ===")
  const { db } = await import("../lib/db")
  const { orders: ordersTable, user: userTable } = await import("../lib/db/schema")
  const { eq } = await import("drizzle-orm")

  console.log("=== Querying User ===")
  const users = await db.select().from(userTable).limit(1)
  if (users.length === 0) {
    console.log("No users found. Run seed script first.")
    return
  }
  const user = users[0]
  console.log(`Using user: ${user.id} (${user.email})`)

  console.log("=== Creating Test Order ===")
  const orderId = `ORD-PAY-${Date.now()}`
  await db.insert(ordersTable).values({
    id: orderId,
    userId: user.id,
    subtotal: "15.00",
    shippingCost: "10.00",
    taxAmount: "0.00",
    totalAmount: "25.00",
    status: "placed",
    shippingName: "Aria Sterling",
    shippingPhone: "555-0199",
    shippingAddress: "123 Main St",
    shippingCity: "San Jose",
    shippingState: "California",
    shippingPincode: "95112",
    paymentStatus: "pending",
    paymentMethod: "Card",
  })
  console.log(`Order ${orderId} created as pending.`)

  console.log("=== Simulating Paid Transition ===")
  await db
    .update(ordersTable)
    .set({
      paymentStatus: "paid",
      paymentId: `pay_sandbox_test_${Date.now()}`,
      status: "confirmed",
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.id, orderId))
  
  const updated = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1)
  console.log(`Updated Order Status: ${updated[0].status}, Payment Status: ${updated[0].paymentStatus}, Transaction ID: ${updated[0].paymentId}`)
  
  console.log("=== Test Complete ===")
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
