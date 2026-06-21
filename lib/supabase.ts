import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable')
}

// Create Supabase client for general use
export const supabase = createClient(supabaseUrl, supabaseKey)

// For server-side operations, we'll continue using the direct PostgreSQL connection
// via Drizzle since Better Auth is already configured that way
export { supabaseUrl, supabaseKey }