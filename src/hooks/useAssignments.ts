
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
};

export const useAssignments = () => {
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAssignments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch active assignments
        const { data: active, error: activeError } = await supabase
          .from('assignments')
          .select('*')
          .neq('status', 'completed')
          .order('due_date', { ascending: true });

        if (activeError) throw activeError;
        setActiveAssignments(active || []);

        // Fetch completed assignments
        const { data: completed, error: completedError } = await supabase
          .from('assignments')
          .select('*')
          .eq('status', 'completed')
          .order('completed_date', { ascending: false });

        if (completedError) throw completedError;
        setCompletedAssignments(completed || []);

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
  }, [isAuthenticated]);

  const createAssignment = async (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => {
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
    deleteAssignment
  };
};
