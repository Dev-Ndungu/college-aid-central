
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility to check database configuration and RLS policies
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
    
    // Check assignments table structure and count
    const { data: assignmentCount, error: countError } = await supabase
      .from('assignments')
      .select('count')
      .single();
      
    if (countError) {
      console.error("Error checking assignments table count:", countError);
    }
    
    // Check RLS policies for assignments table
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_assignment_policies');
      
    if (policiesError) {
      console.error("Error checking assignment policies:", policiesError);
      return {
        success: false,
        message: `Error checking assignment policies: ${policiesError.message}`
      };
    }
    
    // Find writer access policy
    const writerPolicy = policies?.find((p: any) => 
      p.policyname === 'Writers can view all assignments' || 
      p.policyname?.includes('Writers can view')
    );
    
    return {
      success: true,
      message: `Database configuration looks good. Found ${assignmentCount?.count || 0} assignments. Writers policy: ${writerPolicy ? 'Present' : 'Missing'}`
    };
  } catch (err: any) {
    console.error("Database check failed:", err);
    return {
      success: false,
      message: `Database check failed: ${err.message}`
    };
  }
};
