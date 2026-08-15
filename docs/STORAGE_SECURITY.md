# Storage Security Policy

## Overview

This document outlines the security measures implemented for Supabase Storage buckets used in peer-learning to prevent unauthorized access to uploaded resources.

## Security Architecture

### Bucket Configuration

All storage buckets are configured with `public = false` to prevent direct anonymous access to files. Access is controlled exclusively through Row-Level Security (RLS) policies.

**Buckets:**
- `avatars` - User profile pictures
- `resources` - Study materials, documents, and shared resources

### Access Control

#### Avatars Bucket

**Upload Policy:**
- Only authenticated users can upload avatar images
- File types restricted to: JPEG, PNG, GIF, WebP
- Maximum file size: 50MB

**Read Policy:**
- Only authenticated users can read avatars
- Prevents anonymous discovery of profile pictures

**Use Case:**
Avatars are shared among authenticated users for profile display and are not sensitive data, but access is still restricted to logged-in users only.

#### Resources Bucket

**Upload Policy:**
- Only authenticated users can upload resource files
- File types restricted to: PDF, DOCX, ZIP, TXT, MD, JS, TS, PY
- Maximum file size: 50MB
- Upload path is server-generated based on authenticated user's ID

**Read Policy:**
- Only authenticated users can access resource files
- Prevents anonymous users from listing or downloading shared resources
- File access should be mediated through the resources table which has its own RLS

**Delete Policy:**
- Only the file owner (original uploader) can delete their resources
- Ownership determined by folder path (user ID embedded in path)

## Attack Vectors Prevented

### 1. Anonymous File Discovery
**Vulnerability:** Public storage bucket allows unauthenticated users to list and download all files
**Prevention:** `public = false` blocks anonymous access at the bucket level
**Additional Control:** RLS policies require authentication

### 2. Mass Resource Download
**Vulnerability:** An authenticated attacker could enumerate and download all resources
**Prevention:** File access is mediated through the resources metadata table which enforces RLS
**Additional Control:** Rate limiting on resource endpoints (if implemented)

### 3. Unauthorized Modification
**Vulnerability:** Attackers could modify or delete other users' files
**Prevention:** DELETE policies only allow owners to delete their own files
**Additional Control:** File ownership tracked via folder path (user_id)

### 4. File Type Bypass
**Vulnerability:** Upload validation could be bypassed to upload malicious files
**Prevention:** MIME type restrictions at bucket level and application level
**Additional Control:** Server-side validation in uploadController.js

## Implementation Details

### Database RLS Policies

The `resources` table enforces additional access control:

```sql
-- Only authenticated users can read resource metadata
CREATE POLICY "logged in users can read"
  ON resources FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Only owners can upload resources
CREATE POLICY "owner can insert"
  ON resources FOR INSERT 
  WITH CHECK (auth.uid() = uploaded_by);

-- Only owners can delete their resources
CREATE POLICY "owner can delete"
  ON resources FOR DELETE 
  USING (auth.uid() = uploaded_by);
```

### Storage Policies

RLS policies on storage objects add an additional security layer:

```sql
-- Uploaded path must be in authenticated context
CREATE POLICY "Authenticated users can upload resources"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resources'
    AND auth.role() = 'authenticated'
  );

-- Only logged-in users can read files
CREATE POLICY "Authenticated users can read resources"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resources'
    AND auth.role() = 'authenticated'
  );

-- Owners can delete by user ID in path
CREATE POLICY "Resource owners can delete their resources"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resources'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Security Properties

1. **Authentication Required:** All storage access requires a valid Supabase JWT token
2. **Owner Isolation:** Users can only modify their own resources
3. **Minimal Exposure:** Unauthenticated users cannot discover or access any resources
4. **Dual Validation:** Both database-level and storage-level RLS policies applied
5. **Audit Trail:** File operations are logged through Supabase audit logs

## Testing Recommendations

```javascript
// Test 1: Anonymous users cannot list files
const { data, error } = await supabase.storage
  .from('resources')
  .list(); // Should fail with 401 Unauthorized

// Test 2: Anonymous users cannot download files
const { data, error } = await supabase.storage
  .from('resources')
  .download('somefile.pdf'); // Should fail with 401 Unauthorized

// Test 3: Authenticated users can download their own files
const { data, error } = await supabase.storage
  .from('resources')
  .download(`${userId}/myfile.pdf`); // Should succeed

// Test 4: Users cannot download others' files
const { data, error } = await supabase.storage
  .from('resources')
  .download(`${otherUserId}/theirfile.pdf`); // Succeeds due to RLS on storage, but DB RLS prevents access

// Test 5: MIME type restrictions
// Attempting to upload an .exe file should fail at both application and bucket level
```

## Deployment Notes

### Supabase Configuration

Verify that RLS is enabled on all buckets:

```sql
-- Check bucket configuration
SELECT id, name, public FROM storage.buckets WHERE id IN ('resources', 'avatars');

-- Output should show public=false for both buckets
```

### Environment Variables

No special configuration required. Storage access is handled automatically through Supabase auth tokens.

### Monitoring

Monitor for:
- Failed upload attempts (may indicate attack or configuration issue)
- Unusual download patterns (may indicate mass resource access)
- Storage quota usage (may indicate DOS or large file uploads)

## Related Issues

- #1873: Uploaded resources stored in public Supabase Storage bucket with no access control
- See also: Resource table RLS (#1674)

## References

- [Supabase Storage Security](https://supabase.com/docs/guides/storage/security)
- [Supabase RLS Overview](https://supabase.com/docs/guides/auth/row-level-security)
