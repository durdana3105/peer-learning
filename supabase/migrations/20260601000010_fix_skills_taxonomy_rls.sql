-- Fix Issue 446: Taxonomy Pollution (Broken RLS on skills_taxonomy)

DROP POLICY IF EXISTS "Authenticated users can insert skills" ON public.skills_taxonomy;

CREATE POLICY "Admins can insert skills"
ON public.skills_taxonomy
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);
