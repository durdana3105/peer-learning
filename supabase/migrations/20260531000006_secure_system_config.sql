-- Enable Row-Level Security on the system_config table
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- No policies are added because we want to completely deny all client access 
-- (both authenticated and anonymous) to this internal configuration table.
-- The postgres/service_role users bypass RLS automatically and will still be able
-- to access and modify this table (e.g. for the tick_session_statuses job).
