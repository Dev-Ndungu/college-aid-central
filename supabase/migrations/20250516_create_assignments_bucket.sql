
-- Check if the bucket doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE name = 'assignments'
  ) THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('assignments', 'assignments', true);
    
    -- Set up RLS policies for the bucket
    CREATE POLICY "Anyone can view assignment files"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'assignments');
      
    CREATE POLICY "Authenticated users can upload assignment files"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'assignments');
      
    CREATE POLICY "Users can update their own assignment files"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'assignments' AND (storage.foldername(name))[1] = auth.uid()::text);
      
    CREATE POLICY "Users can delete their own assignment files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'assignments' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;
