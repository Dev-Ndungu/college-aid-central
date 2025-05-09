
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useAssignmentDebug = () => {
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { userId } = useAuth();

  const runDebugCheck = async () => {
    try {
      setIsChecking(true);
      setDebugInfo("Running comprehensive debug check...");
      
      // Get user profile and role information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId || '')
        .single();
        
      if (profileError) {
        setDebugInfo("Error fetching profile: " + profileError.message);
        return;
      }
      
      // Check if the current user has the writer role
      if (profile?.role !== 'writer') {
        setDebugInfo(`User has role '${profile?.role}' instead of 'writer'. This may affect assignment visibility.`);
      }
      
      // Check if there are any RLS policies for assignments
      // Use RPC for system table query instead of direct access
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_assignment_policies')
        .select('*');
        
      if (policiesError) {
        console.error("Error checking policies:", policiesError);
      }
      
      // Check if there are assignments in the database
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*');
      
      if (assignmentsError) {
        setDebugInfo("Error fetching assignments: " + assignmentsError.message);
        return;
      }
      
      if (!allAssignments || allAssignments.length === 0) {
        setDebugInfo("No assignments found in database. Please create some assignments first.");
        return;
      }
      
      // ENHANCED: Check specifically for submitted assignments with no writer
      const { data: availableAssignments, error: availableError } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'submitted')
        .is('writer_id', null);
      
      if (availableError) {
        setDebugInfo("Error fetching submitted assignments: " + availableError.message);
        return;
      }
      
      // ENHANCED: Direct query for all assignments with writer_id = current user
      const { data: myAssignments, error: myAssignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('writer_id', userId || '');
        
      if (myAssignmentsError) {
        setDebugInfo("Error fetching my assignments: " + myAssignmentsError.message);
        return;
      }

      // ENHANCED: Detailed check of all assignments
      let statuses = allAssignments.reduce((acc: any, curr: any) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, {});
      
      // ENHANCED: Add more detailed info about the assignments
      const submittedCount = allAssignments.filter(a => a.status === 'submitted').length;
      const submittedWithNoWriterCount = allAssignments.filter(a => a.status === 'submitted' && !a.writer_id).length;
      const assignmentsAssignedToMe = allAssignments.filter(a => a.writer_id === userId).length;
      
      // Check policies
      let policiesInfo = "No RLS policies found";
      if (policies && policies.length > 0) {
        policiesInfo = `Found ${policies.length} RLS policies for assignments table: ` + 
          policies.map((p: any) => p.policy_name || p.policyname).join(", ");
      }
      
      // COMPREHENSIVE DEBUG INFO
      setDebugInfo(`
        === Assignment Statistics ===
        Found ${allAssignments.length} total assignments in database. 
        Status breakdown: ${JSON.stringify(statuses)}
        
        === For Writers ===
        ${submittedCount} assignments have status='submitted'
        ${submittedWithNoWriterCount} assignments have status='submitted' AND writer_id=null (available for taking)
        ${assignmentsAssignedToMe} assignments assigned to current writer
        ${availableAssignments?.length || 0} assignments showing as available from direct query
        
        === User Info ===
        User role: ${profile?.role}
        User ID: ${userId}
        
        === RLS Policies ===
        ${policiesInfo}
        
        === Example Assignments ===
        Available assignments from direct query:
        ${JSON.stringify(availableAssignments?.slice(0, 2) || [], null, 2)}
        
        Assignments assigned to me:
        ${JSON.stringify(myAssignments?.slice(0, 2) || [], null, 2)}
      `);
      
      toast("Debug Information", {
        description: `Found ${allAssignments.length} total assignments. ${availableAssignments?.length || 0} available for writers.`
      });
    } catch (err: any) {
      setDebugInfo(`Error during debug: ${err.message}`);
    } finally {
      setIsChecking(false);
    }
  };
  
  // Test creating an assignment if needed
  const createTestAssignment = async () => {
    try {
      setIsChecking(true);
      
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student')
        .limit(1);
        
      if (studentsError || !students || students.length === 0) {
        toast("Error", {
          variant: "destructive",
          description: "No student accounts found to create test assignment"
        });
        return;
      }
      
      const studentId = students[0].id;
      
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          title: "Test Assignment " + new Date().toISOString(),
          subject: "Test Subject",
          description: "This is a test assignment created via the debug tool",
          status: "submitted",
          user_id: studentId
        })
        .select();
        
      if (error) {
        toast("Error", {
          variant: "destructive",
          description: "Failed to create test assignment: " + error.message
        });
      } else {
        toast("Success", {
          description: "Test assignment created successfully"
        });
        setDebugInfo(prev => prev + "\n\n=== Created Test Assignment ===\n" + JSON.stringify(data[0], null, 2));
      }
    } catch (err: any) {
      toast("Error", {
        variant: "destructive",
        description: "Error creating test assignment: " + err.message
      });
    } finally {
      setIsChecking(false);
    }
  };

  return {
    debugInfo,
    isChecking,
    runDebugCheck,
    createTestAssignment,
    setDebugInfo
  };
};
