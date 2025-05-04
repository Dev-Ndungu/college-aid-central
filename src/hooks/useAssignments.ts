import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';

export type Assignment = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  status: string;
  progress: number | null;
  due_date: string | null;
  completed_date: string | null;
  grade: string | null;
  created_at: string | null;
  updated_at: string | null;
  writer_id?: string | null;
  user_id: string;
};

export const useAssignments = () => {
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, userRole, userEmail } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !userEmail) return;

    const fetchAssignments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // First, get the user's ID from the profiles table using their email
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          throw new Error('Unable to fetch your profile information.');
        }

        if (!profileData?.id) {
          throw new Error('User profile not found.');
        }

        const userId = profileData.id;

        // For students
        if (userRole === 'student') {
          // Fetch active assignments
          const { data: active, error: activeError } = await supabase
            .from('assignments')
            .select('*')
            .eq('user_id', userId)
            .neq('status', 'completed')
            .order('due_date', { ascending: true });

          if (activeError) throw activeError;
          setActiveAssignments(active || []);

          // Fetch completed assignments
          const { data: completed, error: completedError } = await supabase
            .from('assignments')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('completed_date', { ascending: false });

          if (completedError) throw completedError;
          setCompletedAssignments(completed || []);
        }
        // For writers
        else if (userRole === 'writer') {
          console.log('Fetching assignments for writer');
          
          // 1. Fetch all submitted assignments (available to take)
          const { data: submitted, error: submittedError } = await supabase
            .from('assignments')
            .select('*')
            .eq('status', 'submitted')
            .is('writer_id', null) // This ensures we only get assignments not assigned to any writer
            .order('due_date', { ascending: true });

          if (submittedError) {
            console.error('Error fetching submitted assignments:', submittedError);
            throw submittedError;
          }
          
          console.log('Available assignments:', submitted);

          // 2. Fetch assignments assigned to this writer
          const { data: assigned, error: assignedError } = await supabase
            .from('assignments')
            .select('*')
            .eq('writer_id', userId)
            .neq('status', 'completed')
            .order('due_date', { ascending: true });

          if (assignedError) {
            console.error('Error fetching assigned assignments:', assignedError);
            throw assignedError;
          }
          
          console.log('Assigned assignments:', assigned);

          // Combine the results
          setActiveAssignments([...(submitted || []), ...(assigned || [])]);
          
          // 3. Fetch completed assignments for this writer
          const { data: completed, error: completedError } = await supabase
            .from('assignments')
            .select('*')
            .eq('writer_id', userId)
            .eq('status', 'completed')
            .order('completed_date', { ascending: false });

          if (completedError) throw completedError;
          setCompletedAssignments(completed || []);
        }

      } catch (err: any) {
        console.error('Error fetching assignments:', err);
        setError(err.message || 'Failed to fetch assignments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
    
    // Set up real-time subscription for assignments
    const assignmentsSubscription = supabase
      .channel('assignments-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'assignments' }, 
        () => {
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentsSubscription);
    };
  }, [isAuthenticated, userEmail, userRole]);

  const createAssignment = async (assignmentData: {
    title: string;
    subject: string;
    description?: string | null;
    status?: string;
    progress?: number | null;
    due_date?: string | null;
    user_id: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert([assignmentData])
        .select();

      if (error) throw error;
      
      return data[0];
    } catch (err: any) {
      console.error('Error creating assignment:', err);
      throw err;
    }
  };

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      return data[0];
    } catch (err: any) {
      console.error('Error updating assignment:', err);
      throw err;
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return true;
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      throw err;
    }
  };

  // Add function to delete profile
  const deleteProfile = async () => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userEmail!);
      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      throw err;
    }
  };

  return {
    activeAssignments,
    completedAssignments,
    isLoading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    deleteProfile
  };
};
