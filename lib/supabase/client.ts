import { createClient } from '@supabase/supabase-js'

// These would normally be in .env.local
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
// If keys are missing, this might throw or return a limited client.
// For this MVP without .env, we'll try/catch or handle gracefully in usage.

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
