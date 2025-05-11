
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ihvgtaxvrqdnrgdddhdx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlodmd0YXh2cnFkbnJnZGRkaGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxOTAwMTQsImV4cCI6MjA2MTc2NjAxNH0.zwjvn4wy33o_nYHuwNXI6aHTQWLx1-XriImQxj4tPfg";

// Import the properly typed supabase client like this:
// import { supabaseTyped } from "@/integrations/supabase/client-with-types";

export const supabaseTyped = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Custom types for the user_presence table
export type UserPresence = {
  user_id: string;
  online: boolean;
  last_seen: string;
};

