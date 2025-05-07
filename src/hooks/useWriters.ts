
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

        // Check if writer_bio and writer_skills columns exist
        const { data: columnCheck, error: columnError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
          
        if (columnError) throw columnError;
        
        // Construct query based on available columns
        let query = 'id, email, full_name, avatar_url';
        
        // Only include columns if they exist in the profiles table
        const columns = columnCheck && columnCheck[0] ? Object.keys(columnCheck[0]) : [];
        if (columns.includes('writer_bio')) query += ', writer_bio';
        if (columns.includes('writer_skills')) query += ', writer_skills';
        
        const { data, error: writersError } = await supabase
          .from('profiles')
          .select(query)
          .eq('role', 'writer');

        if (writersError) throw writersError;
        
        // Make sure we cast the data to the Writer type and handle any missing fields
        const formattedWriters: Writer[] = (data || []).map(writer => ({
          id: writer.id,
          email: writer.email,
          full_name: writer.full_name,
          avatar_url: writer.avatar_url,
          writer_bio: writer.writer_bio || null,
          writer_skills: writer.writer_skills || null
        }));
        
        setWriters(formattedWriters);

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
      console.log('Available assignments details:', availableAssignments);
      
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
