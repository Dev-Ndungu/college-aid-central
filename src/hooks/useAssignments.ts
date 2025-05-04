
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

  const fetchAssignments = async () => {
    if (!isAuthenticated || !userEmail) return;
    
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
      console.log('User ID:', userId);
      console.log('User role:', userRole);

      // For students - only show their own assignments
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
      // For writers - show all available assignments and their own assigned ones
      else if (userRole === 'writer') {
        console.log('Fetching assignments for writer');
        
        // Get available assignments (status='submitted' AND writer_id IS NULL)
        const { data: availableAssignments, error: availableError } = await supabase
          .from('assignments')
          .select('*')
          .eq('status', 'submitted')
          .is('writer_id', null);
          
        if (availableError) {
          console.error('Error fetching available assignments:', availableError);
          throw availableError;
        }
        
        console.log('Available assignments found:', availableAssignments?.length || 0);
        
        // Get assignments assigned to this specific writer
        const { data: assignedToWriter, error: assignedError } = await supabase
          .from('assignments')
          .select('*')
          .eq('writer_id', userId)
          .neq('status', 'completed');
          
        if (assignedError) {
          console.error('Error fetching writer\'s assignments:', assignedError);
          throw assignedError;
        }
        
        console.log('Writer\'s assignments found:', assignedToWriter?.length || 0);
        
        // Combine the results
        const combinedActive = [
          ...(availableAssignments || []), 
          ...(assignedToWriter || [])
        ];
        
        console.log('Combined active assignments for writer:', combinedActive.length);
        setActiveAssignments(combinedActive);
        
        // Get completed assignments for this writer
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

  useEffect(() => {
    fetchAssignments();
    
    // Set up real-time subscription for assignments
    const assignmentsSubscription = supabase
      .channel('assignments-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'assignments' }, 
        () => {
          console.log('Assignments change detected - fetching updated assignments');
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

  return {
    activeAssignments,
    completedAssignments,
    isLoading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    fetchAssignments // Export this to allow manual refresh
  };
};
