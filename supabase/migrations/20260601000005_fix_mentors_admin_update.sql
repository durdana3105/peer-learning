-- Fix Issue 409: Missing Admin and Update Policies on mentors Table

CREATE POLICY "Users can update own mentor applications"
ON public.mentors
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all mentor applications"
ON public.mentors
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all mentor applications"
ON public.mentors
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
