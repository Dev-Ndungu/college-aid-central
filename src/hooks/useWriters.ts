
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';

export type Writer = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  writer_bio: string | null;
  writer_skills: string[] | null;
};

export const useWriters = () => {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useAuth();

  useEffect(() => {
    const fetchWriters = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: writersError } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url, writer_bio, writer_skills')
          .eq('role', 'writer');

        if (writersError) throw writersError;
        setWriters(data || []);

      } catch (err: any) {
        console.error('Error fetching writers:', err);
        setError(err.message || 'Failed to fetch writers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWriters();
  }, []);

  // Add debug function to check assignments
  const checkAssignments = async () => {
    try {
      console.log('Running assignment check...');
      
      // Check all assignments in the system
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*');
      
      console.log('All assignments in system:', allAssignments?.length);
      
      // Check available assignments for writers
      const { data: availableAssignments, error: availableError } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'submitted')
        .is('writer_id', null);
      
      console.log('Available assignments for writers:', availableAssignments?.length);
      
      // Check assignments assigned to current writer
      if (userId) {
        const { data: myAssignments, error: myAssignmentsError } = await supabase
          .from('assignments')
          .select('*')
          .eq('writer_id', userId);
        
        console.log('Assignments assigned to current writer:', myAssignments?.length);
      }
      
      if (assignmentsError || availableError) {
        console.error('Error checking assignments:', assignmentsError || availableError);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error during assignment check:', err);
      return false;
    }
  };

  return {
    writers,
    isLoading,
    error,
    checkAssignments
  };
};
