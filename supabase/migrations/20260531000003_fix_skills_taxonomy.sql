-- Fix Arbitrary Data Insertion in skills_taxonomy by adding backend format validation

-- Remove any existing invalid data to allow the constraint to be applied
DELETE FROM public.skills_taxonomy
WHERE length(name) > 50 
   OR length(name) < 1 
   OR name !~ '^[a-zA-Z0-9][a-zA-Z0-9\s\.\-\+\#\/]*$';

-- Add check constraint for format validation
ALTER TABLE public.skills_taxonomy
ADD CONSTRAINT skills_taxonomy_name_check
CHECK (
  length(name) >= 1 AND 
  length(name) <= 50 AND
  name ~ '^[a-zA-Z0-9][a-zA-Z0-9\s\.\-\+\#\/]*$'
);
