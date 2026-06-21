import { db } from './lib/db/index'

async function testConnection() {
  try {
    console.log('🔗 Testing database connection...')
    
    // Simple query to test connection
    const result = await db.execute('SELECT 1 as test')
    
    console.log('✅ Database connection successful!')
    console.log('Test result:', result)
    
    // Test if we can query existing tables (Better Auth should already exist)
    try {
      const users = await db.execute('SELECT COUNT(*) FROM "user"')
      console.log('✅ Better Auth tables exist. User count:', users.rows[0])
    } catch (error) {
      console.log('ℹ️ Better Auth tables not found (expected for fresh database)')
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:')
    console.error('Error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND')) {
        console.error('💡 Check if DATABASE_URL is correct in .env.local')
      }
      if (error.message.includes('authentication')) {
        console.error('💡 Check if database password is correct')
      }
      if (error.message.includes('timeout')) {
        console.error('💡 Check if database is accessible and not sleeping')
      }
    }
    
    process.exit(1)
  }
}

testConnection()