import { Pool } from 'pg'

// Test both connection strings
const connections = [
  {
    name: 'Direct Connection (Port 5432)',
    url: 'postgresql://postgres:saasum-marketplace@db.cnuklbvuumkvbkorjwbu.supabase.co:5432/postgres'
  },
  {
    name: 'Pooler Connection (Port 6543)',
    url: 'postgresql://postgres.cnuklbvuumkvbkorjwbu:saasum-marketplace@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
  },
  {
    name: 'Alternative Direct Format',
    url: 'postgresql://postgres.cnuklbvuumkvbkorjwbu:saasum-marketplace@db.cnuklbvuumkvbkorjwbu.supabase.co:5432/postgres'
  }
]

async function testConnection(name: string, connectionString: string) {
  console.log(`\n🔍 Testing ${name}...`)
  console.log(`URL: ${connectionString.replace(/:[^:@]+@/, ':****@')}`)

  const pool = new Pool({ 
    connectionString,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  })

  try {
    const client = await pool.connect()
    console.log('✅ Connection successful!')

    // Test basic query
    const result = await client.query('SELECT 1 as test')
    console.log('✅ Query test:', result.rows[0])

    // Test table existence
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    console.log(`✅ Found ${tablesResult.rows.length} tables:`, tablesResult.rows.slice(0, 5).map(r => r.table_name))

    client.release()
    await pool.end()
    return true

  } catch (error) {
    console.error('❌ Connection failed:', error)
    await pool.end()
    return false
  }
}

async function runConnectionTests() {
  console.log('🚀 Starting Supabase connection tests...\n')

  for (const conn of connections) {
    const success = await testConnection(conn.name, conn.url)
    if (success) {
      console.log(`\n🎉 WORKING CONNECTION FOUND: ${conn.name}`)
      console.log(`✅ Use this URL: ${conn.url.replace(/:[^:@]+@/, ':****@')}`)
      break
    }
  }

  console.log('\n🏁 Connection tests completed.')
}

runConnectionTests()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n💥 Test failed:', error)
    process.exit(1)
  })