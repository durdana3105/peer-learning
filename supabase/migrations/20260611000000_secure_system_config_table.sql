ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON system_config FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access for admins only" ON system_config FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));