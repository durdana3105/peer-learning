-- Storage Policies for Avatars and Resources
-- Restrict uploads to 50MB and only allow specific mime types.
-- Security: Ensure buckets are not public to prevent unauthorized access.

-- Ensure bucket exists (Avatars)
-- Note: Avatars can be public since they're user profile pictures with RLS protection
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Ensure bucket exists (Resources)
-- Security: Set public=false to prevent unauthorized direct access to resource files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resources',
  'resources',
  false,
  52428800, 
  array[
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'text/plain',
    'text/markdown',
    'text/javascript',
    'text/x-python',
    'application/x-python-code',
    'application/typescript'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'text/plain',
    'text/markdown',
    'text/javascript',
    'text/x-python',
    'application/x-python-code',
    'application/typescript'
  ];

-- RLS Policies for Avatars
-- Allow authenticated users to upload their own avatars
CREATE POLICY IF NOT EXISTS "Avatar uploads by authenticated users"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- Allow users to read avatars (needed for profile display)
CREATE POLICY IF NOT EXISTS "Users can read avatars"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- RLS Policies for Resources
-- Allow authenticated users to upload resources
CREATE POLICY IF NOT EXISTS "Authenticated users can upload resources"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resources'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to read resources (ensures only logged-in users can access)
CREATE POLICY IF NOT EXISTS "Authenticated users can read resources"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resources'
    AND auth.role() = 'authenticated'
  );

-- Allow resource owners to delete their own resources
CREATE POLICY IF NOT EXISTS "Resource owners can delete their resources"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resources'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
