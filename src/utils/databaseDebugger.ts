
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Utility to test database permissions for assignments
 * This helps diagnose RLS policy issues
 */
export const testAssignmentPermissions = async (userId: string, userRole: string) => {
  try {
    console.log(`Testing DB permissions for user ${userId} with role ${userRole}`);
    
    // Test assignment viewing
    const { data: viewTest, error: viewError } = await supabase
      .from('assignments')
      .select('count')
      .limit(1);
      
    if (viewError) {
      console.error('View permission test failed:', viewError);
      return {
        success: false,
        message: `View permission error: ${viewError.message}`,
        details: viewError
      };
    }
    
    // For writers, test taking an assignment by getting policies
    if (userRole === 'writer') {
      const { data: updateTest, error: updateError } = await supabase
        .rpc('get_assignment_policies');
      
      if (updateError) {
        console.error('Update permission test failed:', updateError);
        return {
          success: false,
          message: `Update permission error: ${updateError.message}`,
          details: updateError
        };
      }
      
      console.log('DB permission test results:', updateTest);
    }
    
    return {
      success: true,
      message: 'All permission tests passed successfully'
    };
  } catch (error: any) {
    console.error('Error testing permissions:', error);
    return {
      success: false,
      message: `Error testing permissions: ${error.message}`
    };
  }
};

/**
 * Debug assignment taking issues
 */
export const debugAssignmentTaking = async (assignmentId: string, userId: string) => {
  try {
    console.log(`Debugging assignment taking for assignment ${assignmentId} by user ${userId}`);
    
    // Check if assignment exists
    const { data: assignment, error: checkError } = await supabase
      .from('assignments')
      .select('id, title, status, writer_id')
      .eq('id', assignmentId)
      .single();
    
    if (checkError) {
      return {
        success: false,
        message: `Assignment check error: ${checkError.message}`,
        error: checkError
      };
    }
    
    if (!assignment) {
      return {
        success: false,
        message: `Assignment ${assignmentId} not found`
      };
    }
    
    if (assignment.writer_id) {
      return {
        success: false,
        message: `Assignment already taken by writer ${assignment.writer_id}`,
        assignment
      };
    }
    
    console.log('Assignment details:', assignment);
    
    return {
      success: true,
      message: 'Assignment is available to take',
      assignment
    };
  } catch (error: any) {
    console.error('Error in debug assignment taking:', error);
    return {
      success: false,
      message: `Debug error: ${error.message}`
    };
  }
};
