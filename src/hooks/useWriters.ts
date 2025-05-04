
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export type Writer = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

export const useWriters = () => {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWriters = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: writersError } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
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
      // Check all assignments in the system
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*');
      
      console.log('All assignments in system:', allAssignments);
      
      // Check available assignments
      const { data: availableAssignments, error: availableError } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'submitted')
        .is('writer_id', null);
      
      console.log('Available assignments:', availableAssignments);
      
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
