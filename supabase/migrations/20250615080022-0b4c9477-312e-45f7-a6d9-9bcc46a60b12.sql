
-- Add columns to support dynamic daily increments
ALTER TABLE public.assignment_display_count
  ADD COLUMN initial_assignments_value INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN initial_students_value INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN initial_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Optionally, initialize values if needed. Adjust numbers as preferred.
UPDATE public.assignment_display_count
  SET initial_assignments_value = 16,  -- or your current assignments count
      initial_students_value = 5,      -- or current students count
      initial_date = now();
