
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

// Custom types for the messages table (until Supabase types are regenerated)
export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  assignment_id: string | null;
  created_at: string;
  read: boolean;
};

// Helper function for anonymous submissions with proper types
export const submitAnonymousAssignment = async (assignmentData: Omit<Database['public']['Tables']['assignments']['Insert'], 'user_id'>) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        ...assignmentData,
        user_id: null // Using null for anonymous submissions following our migration
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit assignment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting anonymous assignment:', error);
    throw error;
  }
};
