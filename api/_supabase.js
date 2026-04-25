// api/_supabase.js - Shared Supabase client
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[Supabase] Missing credentials, API will not work');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
