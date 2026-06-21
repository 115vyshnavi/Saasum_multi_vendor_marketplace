import * as dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

async function run() {
  console.log("Seeding coupons...")
  const { seedCoupons } = await import("../app/actions/coupons")
  const result = await seedCoupons()
  if (result.success) {
    console.log("Coupons seeded successfully!")
  } else {
    console.error("Failed to seed coupons:", result.error)
  }
  process.exit(0)
}

run()
