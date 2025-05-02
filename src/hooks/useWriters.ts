
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

  return {
    writers,
    isLoading,
    error
  };
};
