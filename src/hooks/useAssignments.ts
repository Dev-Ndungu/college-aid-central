import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description?: string;
  status: string;
  progress: number;
  due_date?: string;
  completed_date?: string;
  grade?: string;
  user_id?: string;
  writer_id?: string;
  created_at?: string;
  updated_at?: string;
  file_urls?: string[];
  student_name?: string;
  student_email?: string;
  student_phone?: string;
  assignment_type?: string;
}

export const useAssignments = () => {
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { userRole, userId } = useAuth();

  // Helper function to send email notification when a writer takes an assignment
  const sendAssignmentNotification = async (
    assignmentId: string,
    type: string,
    writerData: any = null,
    status: string | null = null
  ) => {
    try {
      // Get assignment details
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (assignmentError) {
        console.error('Error fetching assignment for notification:', assignmentError);
        return;
      }

      console.log(`Sending ${type} notification for assignment:`, assignment.title);

      // Use the full URL with the correct project reference
      const projectRef = "ihvgtaxvrqdnrgdddhdx";
      
      const payload: any = {
        type,
        assignment
      };

      // Add writer data if available
      if (writerData) {
        payload.writer = writerData;
      }
      
      // Add status if available
      if (status) {
        payload.status = status;
      }

      const response = await fetch(`https://${projectRef}.supabase.co/functions/v1/notify-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Error sending ${type} notification:`, errorData);
        return false;
      }

      console.log(`${type} notification sent successfully`);
      return true;
    } catch (error) {
      console.error(`Error sending ${type} notification:`, error);
      return false;
    }
  };

  // Fetch assignments based on user role
  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      let query;
      
      if (userRole === 'student') {
        // Get active (non-completed) assignments for student
        query = supabase
          .from('assignments')
          .select('*')
          .eq('user_id', userId)
          .not('status', 'eq', 'completed')
          .order('created_at', { ascending: false });
          
        const { data: active, error: activeError } = await query;
        
        if (activeError) {
          console.error('Error fetching active assignments:', activeError);
          toast.error('Failed to fetch assignments');
          return;
        }
        
        // Get completed assignments for student
        const { data: completed, error: completedError } = await supabase
          .from('assignments')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('completed_date', { ascending: false });
        
        if (completedError) {
          console.error('Error fetching completed assignments:', completedError);
          toast.error('Failed to fetch completed assignments');
          return;
        }
        
        setActiveAssignments(active || []);
        setCompletedAssignments(completed || []);
      } else if (userRole === 'writer') {
        // Get all available assignments (not taken by any writer)
        const { data: available, error: availableError } = await supabase
          .from('assignments')
          .select('*')
          .is('writer_id', null)
          .eq('status', 'submitted')
          .order('created_at', { ascending: false });
          
        if (availableError) {
          console.error('Error fetching available assignments:', availableError);
          toast.error('Failed to fetch assignments');
          return;
        }
        
        // Get active assignments for this writer
        const { data: active, error: activeError } = await supabase
          .from('assignments')
          .select('*')
          .eq('writer_id', userId)
          .not('status', 'eq', 'completed')
          .order('updated_at', { ascending: false });
          
        if (activeError) {
          console.error('Error fetching writer assignments:', activeError);
          toast.error('Failed to fetch your assignments');
          return;
        }
        
        // Get completed assignments for this writer
        const { data: completed, error: completedError } = await supabase
          .from('assignments')
          .select('*')
          .eq('writer_id', userId)
          .eq('status', 'completed')
          .order('completed_date', { ascending: false });
          
        if (completedError) {
          console.error('Error fetching completed assignments:', completedError);
          toast.error('Failed to fetch completed assignments');
          return;
        }
        
        // Combine available assignments with active ones
        setActiveAssignments([...(available || []), ...(active || [])]);
        setCompletedAssignments(completed || []);
      }
    } catch (error) {
      console.error('Error in fetchAssignments:', error);
      toast.error('Failed to fetch assignments');
    } finally {
      setIsLoading(false);
    }
  }, [userRole, userId]);

  useEffect(() => {
    if (userId) {
      fetchAssignments();
      
      // Subscribe to changes in assignments table
      const assignmentsSubscription = supabase
        .channel('assignments-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'assignments'
          }, 
          () => {
            fetchAssignments();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(assignmentsSubscription);
      };
    }
  }, [userId, fetchAssignments]);

  // Function to take an assignment
  const takeAssignment = async (assignmentId: string, writerData: any = null) => {
    try {
      const updates = {
        writer_id: userId,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', assignmentId);
        
      if (error) {
        console.error('Error taking assignment:', error);
        toast.error('Failed to take assignment');
        return false;
      }
      
      // Send notification email to the student
      await sendAssignmentNotification(assignmentId, 'assignment_taken', writerData);
      
      await fetchAssignments();
      return true;
    } catch (error) {
      console.error('Error in takeAssignment:', error);
      toast.error('Failed to take assignment');
      return false;
    }
  };

  // Function to update an assignment
  const updateAssignment = async (assignmentId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', assignmentId);
        
      if (error) {
        console.error('Error updating assignment:', error);
        toast.error('Failed to update assignment');
        return false;
      }
      
      // If the status or progress was updated, send a notification
      if (updates.status || updates.progress) {
        // Get assignment details to check who should receive the notification
        const { data: assignment, error: assignmentError } = await supabase
          .from('assignments')
          .select('*')
          .eq('id', assignmentId)
          .single();
          
        if (assignmentError) {
          console.error('Error fetching assignment data:', assignmentError);
        } else if (assignment && assignment.user_id) {
          // Get writer details for the notification
          const { data: writerData, error: writerError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', userId)
            .single();
            
          if (writerError) {
            console.error('Error fetching writer data:', writerError);
          }
          
          // Send notification to the student about the update
          await sendAssignmentNotification(
            assignmentId, 
            'assignment_status_update', 
            writerData,
            updates.status
          );
        }
      }
      
      await fetchAssignments();
      return true;
    } catch (error) {
      console.error('Error in updateAssignment:', error);
      toast.error('Failed to update assignment');
      return false;
    }
  };

  // Function to delete an assignment
  const deleteAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);
        
      if (error) {
        console.error('Error deleting assignment:', error);
        toast.error('Failed to delete assignment');
        return false;
      }
      
      await fetchAssignments();
      return true;
    } catch (error) {
      console.error('Error in deleteAssignment:', error);
      toast.error('Failed to delete assignment');
      return false;
    }
  };

  // Function to submit a new assignment
  const submitAssignment = async (assignmentData: any) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          ...assignmentData,
          user_id: userId,
          status: 'submitted',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (error) {
        console.error('Error submitting assignment:', error);
        toast.error('Failed to submit assignment');
        return null;
      }
      
      // Send notification to all writers about new assignment
      if (data && data.length > 0) {
        await sendAssignmentNotification(data[0].id, 'assignment_submitted');
      }
      
      await fetchAssignments();
      return data?.[0] || null;
    } catch (error) {
      console.error('Error in submitAssignment:', error);
      toast.error('Failed to submit assignment');
      return null;
    }
  };

  return {
    activeAssignments,
    completedAssignments,
    isLoading,
    takeAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    refreshAssignments: fetchAssignments
  };
};
