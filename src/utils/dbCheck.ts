
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
    
    // Check for ALL assignments in the database, ignoring RLS
    const { data: allAssignments, error: allAssignmentsError } = await supabase
      .rpc('get_assignment_policies');
      
    if (allAssignmentsError) {
      console.error("Error checking assignment policies:", allAssignmentsError);
      return {
        success: false,
        message: `Error checking assignment policies: ${allAssignmentsError.message}`
      };
    }

    // Direct fetch to test writer access to assignments with status 'submitted'
    const { data: submittedAssignments, error: submittedError } = await supabase
      .from('assignments')
      .select('count')
      .eq('status', 'submitted');

    if (submittedError) {
      console.error("Error checking submitted assignments:", submittedError);
      return {
        success: false,
        message: `Error checking submitted assignments: ${submittedError.message}`
      };
    }
    
    const submittedCount = submittedAssignments?.length || 0;

    // Direct fetch to test writer access to assignments
    const { data: writerAccess, error: writerAccessError } = await supabase
      .from('assignments')
      .select('id, title, status')
      .eq('status', 'submitted')
      .limit(10);

    if (writerAccessError) {
      console.error("Error testing writer access:", writerAccessError);
      return {
        success: false,
        message: `Writer access test failed: ${writerAccessError.message}`
      };
    }

    const accessSummary = `Writer can access ${writerAccess?.length || 0} submitted assignments directly`;
    
    return {
      success: true,
      message: `Database configuration looks good. Found ${assignmentCount?.count || 0} total assignments, with ${submittedCount} in 'submitted' status. ${accessSummary}`
    };
  } catch (err: any) {
    console.error("Database check failed:", err);
    return {
      success: false,
      message: `Database check failed: ${err.message}`
    };
  }
};
