
-- Function to check assignment update permissions
CREATE OR REPLACE FUNCTION public.check_assignment_permissions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid := auth.uid();
  user_role text;
  can_view boolean;
  can_update boolean;
  result jsonb;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  
  -- Check view permissions
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'assignments' 
    AND cmd = 'SELECT'
    AND qualifier = '(EXISTS ( SELECT 1
       FROM profiles
      WHERE ((profiles.id = auth.uid()) AND (profiles.role = ''writer''::text))))'
  ) INTO can_view;
  
  -- Check update permissions
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'assignments' 
    AND cmd = 'UPDATE'
  ) INTO can_update;
  
  -- Build result
  result := jsonb_build_object(
    'user_id', user_id,
    'user_role', user_role,
    'can_view', can_view,
    'can_update', can_update,
    'policies', (
      SELECT jsonb_agg(jsonb_build_object(
        'name', policyname,
        'command', cmd,
        'using', qual
      ))
      FROM pg_policies
      WHERE tablename = 'assignments'
    )
  );
  
  RETURN result;
END;
$$;

-- TRIGGER for preventing race conditions in assignment taking
CREATE OR REPLACE FUNCTION public.prevent_double_assignment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If trying to assign a writer_id but the assignment already has one
  IF NEW.writer_id IS NOT NULL AND 
     OLD.writer_id IS NULL AND 
     EXISTS (
       SELECT 1 
       FROM assignments 
       WHERE id = NEW.id AND writer_id IS NOT NULL
     ) 
  THEN
    RAISE EXCEPTION 'This assignment has already been taken by another writer';
  END IF;
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists 
DROP TRIGGER IF EXISTS check_double_assignment ON public.assignments;

-- Create the trigger
CREATE TRIGGER check_double_assignment
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.prevent_double_assignment();
