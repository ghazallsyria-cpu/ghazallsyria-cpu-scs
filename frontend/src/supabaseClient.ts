import { createClient } from '@supabase/supabase-js';

// In a real build environment (like Vite or Next.js), these would be populated from your .env file.
// e.g., const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// For this environment, we are using the provided hardcoded values.
const supabaseUrl = 'https://ghfkmnznnfbekjqytyty.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZmttbnpubmZiZWtqcXl0eXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTM5NTEsImV4cCI6MjA4NTY2OTk1MX0.zea3iG2KVGifpfTX3kvSFVvSNTvjqbrFVPh97f8aMnw';

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be provided in your environment file.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
