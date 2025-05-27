
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Assignment } from '@/types/assignment';

export { type Assignment } from '@/types/assignment';

export const useAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, userRole } = useAuth();

  useEffect(() => {
    fetchAssignments();
  }, [userId, userRole]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('assignments')
        .select('*');

      if (userRole === 'student') {
        query = query.eq('user_id', userId);
      } else if (userRole === 'writer') {
        query = query.or(`writer_id.eq.${userId},status.eq.submitted`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching assignments:', error);
      } else {
        setAssignments(data || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const takeAssignment = async (assignmentId: string, writerData: any) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update({ writer_id: userId, status: 'in_progress' })
        .eq('id', assignmentId)
        .single();
        
      if (error) {
        console.error('Error taking assignment:', error);
        return false;
      }
      
      // Send assignment taken notification to student
      try {
        const response = await fetch(`https://ihvgtaxvrqdnrgdddhdx.supabase.co/functions/v1/notify-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'assignment_taken',
            assignment_id: assignmentId,
            writer_name: writerData?.full_name || 'Writer',
            writer_email: writerData?.email || 'writer@example.com'
          }),
        });

        if (!response.ok) {
          console.error('Failed to send assignment taken notification');
        }
      } catch (notificationError) {
        console.error('Error sending assignment taken notification:', notificationError);
      }

      fetchAssignments();
      return true;
    } catch (error) {
      console.error('Error taking assignment:', error);
      return false;
    }
  };

  const updateAssignment = async (assignmentId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', assignmentId)
        .single();

      if (error) {
        console.error('Error updating assignment:', error);
        throw error;
      }

      fetchAssignments();
      return data;
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        console.error('Error deleting assignment:', error);
        return false;
      }

      fetchAssignments();
      return true;
    } catch (error) {
      console.error('Error deleting assignment:', error);
      return false;
    }
  };

  const activeAssignments = assignments.filter(
    (assignment) => assignment.status !== 'completed'
  );

  const completedAssignments = assignments.filter(
    (assignment) => assignment.status === 'completed'
  );

  return {
    assignments,
    activeAssignments,
    completedAssignments,
    isLoading,
    fetchAssignments,
    takeAssignment,
    updateAssignment,
    deleteAssignment
  };
};
