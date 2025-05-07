
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility to check database configuration and column existence
 */
export const checkDatabaseConfig = async () => {
  try {
    console.log("Checking database configuration...");
    
    // Check profiles table structure
    const { data: profileColumns, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (profileError) {
      console.error("Error fetching profile columns:", profileError);
      return {
        success: false,
        message: `Error checking profiles table: ${profileError.message}`
      };
    }
    
    // Check if writer_bio and writer_skills exist
    const profileColumnNames = profileColumns && profileColumns[0] ? 
      Object.keys(profileColumns[0]) : [];
    
    const missingColumns = [];
    if (!profileColumnNames.includes('writer_bio')) missingColumns.push('writer_bio');
    if (!profileColumnNames.includes('writer_skills')) missingColumns.push('writer_skills');
    
    if (missingColumns.length > 0) {
      console.warn(`Missing columns in profiles table: ${missingColumns.join(', ')}`);
      return {
        success: false,
        message: `Missing columns in profiles table: ${missingColumns.join(', ')}. This will affect writer functionality.`
      };
    }
    
    // Check assignments table and RLS policies
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('count')
      .single();
      
    if (assignmentsError) {
      console.error("Error checking assignments table:", assignmentsError);
      return {
        success: false,
        message: `Error checking assignments table: ${assignmentsError.message}`
      };
    }
    
    return {
      success: true,
      message: `Database configuration looks good. Found ${assignments?.count || 0} assignments.`
    };
  } catch (err: any) {
    console.error("Database check failed:", err);
    return {
      success: false,
      message: `Database check failed: ${err.message}`
    };
  }
};
