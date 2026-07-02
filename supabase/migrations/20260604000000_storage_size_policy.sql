-- Storage Policies for Avatars and Resources
-- Restrict uploads to 50MB and only allow specific mime types.

-- Ensure bucket exists (Avatars)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 
  'avatars', 
  true, 
  52428800, 
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set 
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Ensure bucket exists (Resources)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resources', 
  'resources', 
  true, 
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
CREATE POLICY "Avatar uploads are restricted by size and type"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

-- RLS Policies for Resources
CREATE POLICY "Resource uploads are restricted by size and type"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resources' 
    AND auth.role() = 'authenticated'
  );
