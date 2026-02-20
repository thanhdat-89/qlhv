import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase URL or Key is missing. Check your .env setup.');
}

// Only create client if URL is present to prevent crashing the entire app
export const supabase = supabaseUrl
    ? createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: { 'x-app-secret': 'cqt263' }
        }
    })
    : null;
