import { createClient } from '@supabase/supabase-js'

// Anon key is public by design — RLS policies protect data access
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xibgetxijmdgfkojuyzx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpYmdldHhpam1kZ2Zrb2p1eXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTAwNjIsImV4cCI6MjA5MzY2NjA2Mn0.AGE57PIsewajcqPsPoEy_JVLMYhE1WBzpHQ7ERLptc8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseReady = true
