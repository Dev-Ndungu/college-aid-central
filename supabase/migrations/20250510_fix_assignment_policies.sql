
-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Writers can view all submitted assignments" ON public.assignments;
DROP POLICY IF EXISTS "Writers can update assigned assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students can view own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students can create own assignments" ON public.assignments;

-- Enable RLS if not already enabled
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Add writer_id foreign key if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'assignments' 
    AND column_name = 'writer_id'
    AND constraint_name LIKE '%fkey'
  ) THEN
    ALTER TABLE public.assignments 
    ADD CONSTRAINT assignments_writer_id_fkey 
    FOREIGN KEY (writer_id) 
    REFERENCES public.profiles(id);
  END IF;
END
$$;

-- Clear policy for writers to see ALL assignments (not just submitted ones)
CREATE POLICY "Writers can view all assignments" 
ON public.assignments 
FOR SELECT 
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'writer')
);

-- Policy for students: can only see their own assignments
CREATE POLICY "Students can view own assignments only" 
ON public.assignments 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Policy for students: can create their own assignments
CREATE POLICY "Students can create assignments" 
ON public.assignments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for writers: can update assignments they are assigned to
CREATE POLICY "Writers can update assignments" 
ON public.assignments 
FOR UPDATE 
TO authenticated
USING (
  -- Writers can update if they're assigned or if it's available to take
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'writer')) AND
  (
    (writer_id = auth.uid()) OR 
    (status = 'submitted' AND writer_id IS NULL)
  )
);

-- Create index to speed up queries on status and writer_id
CREATE INDEX IF NOT EXISTS idx_assignments_status_writer ON public.assignments(status, writer_id);
