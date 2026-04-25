// api/_supabase.js - Shared Supabase client
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vgyklddspgvtbwvegsob.supabase.co';
const SUPABASE_KEY = 'sb_publishable_n9gfFPMnLr8ZiuAJdyT0WQ_ywxZWMnq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
