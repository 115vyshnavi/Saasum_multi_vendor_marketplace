import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { categories, products, user } from './lib/db/schema'

async function testDrizzleConnection() {
  console.log('🔗 Testing Drizzle connection...')

  // Use the exact same configuration that worked
  const pool = new Pool({
    connectionString: 'postgresql://postgres:saasum-marketplace@db.cnuklbvuumkvbkorjwbu.supabase.co:5432/postgres',
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  })

  const db = drizzle(pool, {
    schema: { categories, products, user }
  })

  try {
    // Test basic Drizzle query
    console.log('📊 Testing categories query...')
    const categoriesResult = await db.select().from(categories)
    console.log(`✅ Categories found: ${categoriesResult.length}`)

    // Test users query  
    console.log('👥 Testing users query...')
    const usersResult = await db.select().from(user)
    console.log(`✅ Users found: ${usersResult.length}`)

    // Test products query
    console.log('📦 Testing products query...')
    const productsResult = await db.select().from(products)
    console.log(`✅ Products found: ${productsResult.length}`)

    console.log('🎉 Drizzle connection working perfectly!')
    
  } catch (error) {
    console.error('❌ Drizzle connection failed:', error)
  } finally {
    await pool.end()
  }
}

testDrizzleConnection()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })