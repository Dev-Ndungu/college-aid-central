
-- This migration adds a function to ensure writer fields exist in profiles table

CREATE OR REPLACE FUNCTION public.add_writer_fields()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  writer_bio_exists boolean;
  writer_skills_exists boolean;
BEGIN
  -- Check if columns already exist
  SELECT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
      AND column_name = 'writer_bio'
  ) INTO writer_bio_exists;

  SELECT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
      AND column_name = 'writer_skills'
  ) INTO writer_skills_exists;
  
  -- Add writer_bio if it doesn't exist
  IF NOT writer_bio_exists THEN
    ALTER TABLE public.profiles ADD COLUMN writer_bio TEXT;
  END IF;
  
  -- Add writer_skills if it doesn't exist
  IF NOT writer_skills_exists THEN
    ALTER TABLE public.profiles ADD COLUMN writer_skills TEXT[];
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Execute the function to ensure these fields exist
SELECT public.add_writer_fields();
