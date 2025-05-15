
-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Writers can view all submitted assignments" ON public.assignments;
DROP POLICY IF EXISTS "Writers can update assigned assignments" ON public.assignments;
DROP POLICY IF EXISTS "Writers can update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students can view own assignments only" ON public.assignments;
DROP POLICY IF EXISTS "Students can view own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students can create assignments" ON public.assignments;
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

-- Create comprehensive policies with clear descriptions

-- Writers: View all assignments (both available and assigned to them)
CREATE POLICY "Writers can view all assignments" 
ON public.assignments 
FOR SELECT 
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'writer')
);

-- Students: View only their own assignments
CREATE POLICY "Students can view own assignments" 
ON public.assignments 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id
);

-- Students: Create their own assignments
CREATE POLICY "Students can create own assignments" 
ON public.assignments 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Writers: Update assignments (they can only update ones they're assigned to or take available ones)
CREATE POLICY "Writers can update assignments" 
ON public.assignments 
FOR UPDATE 
TO authenticated
USING (
  -- Writers can only update if they are a writer AND either:
  -- 1. They're assigned to this assignment already OR
  -- 2. The assignment is submitted and available to take (no writer assigned yet)
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'writer') AND
  (
    writer_id = auth.uid() OR 
    (status = 'submitted' AND writer_id IS NULL)
  )
);

-- Create index to speed up queries
CREATE INDEX IF NOT EXISTS idx_assignments_status_writer ON public.assignments(status, writer_id);
