
-- Create a table to store the custom assignment count for display
CREATE TABLE public.assignment_display_count (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_count INTEGER NOT NULL DEFAULT 0,
  use_actual_count BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by TEXT
);

-- Insert initial record
INSERT INTO public.assignment_display_count (display_count, use_actual_count) 
VALUES (0, true);

-- Add Row Level Security
ALTER TABLE public.assignment_display_count ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading the display count
CREATE POLICY "Anyone can view display count" 
  ON public.assignment_display_count 
  FOR SELECT 
  USING (true);

-- Create policy to allow authorized users to update (you can modify this based on your auth setup)
CREATE POLICY "Authorized users can update display count" 
  ON public.assignment_display_count 
  FOR UPDATE 
  USING (true);
