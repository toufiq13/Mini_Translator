import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://gxbgutztsjfkjiiibsnk.supabase.co').trim().replace(/\/$/, "");
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TYyoqqVEW7VwywO-zD-tBA_SZOA8u_2').trim();

// Note: Standard Supabase 'anon' keys usually start with 'eyJ...'. 
// If you encounter 'Invalid path' or 401 errors, please verify you are using 
// the 'anon / public' key from Settings > API in your dashboard.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
