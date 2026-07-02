-- Enable Row-Level Security on system_config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Deny all access to system_config" ON public.system_config;
DROP POLICY IF EXISTS "Allow admin access to system_config" ON public.system_config;

-- Create policy for admin access
CREATE POLICY "Allow admin access to system_config"
ON public.system_config
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
