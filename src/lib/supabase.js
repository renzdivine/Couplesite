import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use placeholder values if not configured (for development/testing)
// In production, these MUST be set in your deployment platform's environment variables
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseKey || 'placeholder-key';

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[LoveGift] ⚠️ Supabase environment variables not configured.\n' +
    'The app will not work properly without these:\n' +
    '• VITE_SUPABASE_URL\n' +
    '• VITE_SUPABASE_ANON_KEY\n\n' +
    'For deployment: Add these to your hosting platform environment variables.\n' +
    'For local dev: Copy .env.example to .env and fill in your values.'
  );
}

export const supabase = createClient(url, key);
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
