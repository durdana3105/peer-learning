# Profile Data Protection

## Vulnerability Summary

The profiles table had RLS enabled but with an overly permissive SELECT policy (`USING (true)`) that allowed:
1. Anonymous users to read ALL user profiles
2. Email addresses to be exposed without authentication
3. Complete enumeration of all platform users
4. Potential data harvesting attacks

## Root Cause

The original SELECT policy allowed unrestricted access:

```sql
-- VULNERABLE: Allows ANYONE (authenticated or anonymous) to read all profiles
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);
```

While RLS was enabled, the policy itself was ineffective because `USING (true)` grants access to everyone.

## Solution

### 1. Restrict to Authenticated Users

**Before (Vulnerable):**
```sql
USING (true)  -- Anonymous users can read ALL profiles
```

**After (Secure):**
```sql
-- Only authenticated users can view profiles
CREATE POLICY "authenticated_users_can_view_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Explicitly block anonymous users
CREATE POLICY "anonymous_cannot_view_profiles" ON public.profiles
  FOR SELECT TO anon
  USING (false);
```

### 2. Email Address Protection

**Data Exposed:**
- user_id (UUID)
- name (usually public)
- **email (PII - should not be public)**
- bio (usually public)
- avatar_url (usually public)
- skills (usually public)
- interests (usually public)

**Protection Level:**
- Email addresses require authentication to view
- Anonymous API keys cannot access profile data

### 3. Update/Delete Access

Users can only modify their own profile:

```sql
CREATE POLICY "users_can_update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_delete_own_profile" ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);
```

## Attack Vectors Prevented

### 1. User Enumeration
**Before:** Attacker could: `SELECT COUNT(*) FROM profiles` (with anon key)
**After:** Anonymous access denied, enumeration blocked

### 2. Email Harvesting
**Before:** Attacker could download all emails: `SELECT email FROM profiles` (with anon key)
**After:** Email addresses protected, authentication required

### 3. User Information Scraping
**Before:** Attacker could scrape all user data including skills, interests
**After:** Bulk access requires authentication

### 4. Privacy Leakage
**Before:** Profile data visible to unauthenticated requests
**After:** Only authenticated users can view user data

## Database Security Model

### Supabase Key Types

| Key Type | Can Read Profiles | Requires Auth |
|----------|------------------|---------------|
| `anon` | ❌ No | - |
| `service_role` | ✅ Yes | Bypass RLS |
| `user_token` | ✅ Yes | Required |
| `jwt` (authenticated) | ✅ Yes | Required |

### RLS Policy Evaluation

```
Anonymous User (using anon key):
├─ Request: SELECT * FROM profiles
├─ Check Policy: "anonymous_cannot_view_profiles"
│  └─ USING (false) → Access Denied ✅
└─ Result: 403 Forbidden

Authenticated User (with JWT):
├─ Request: SELECT * FROM profiles
├─ Check Policy: "authenticated_users_can_view_profiles"
│  └─ USING (true) → Access Allowed ✅
└─ Result: Returns all profiles
```

## Testing

### Test 1: Anonymous Users Cannot Access Profiles
```javascript
// Using anon key
const { data, error } = await supabaseAnon
  .from('profiles')
  .select('*');
  
// Should fail with 403 Forbidden
expect(error?.code).toBe('PGRST301');
expect(data).toBeNull();
```

### Test 2: Authenticated Users Can Access Profiles
```javascript
// Using authenticated key/JWT
const { data, error } = await supabaseAuth
  .from('profiles')
  .select('*');
  
// Should succeed and return profiles
expect(error).toBeNull();
expect(data?.length).toBeGreaterThan(0);
```

### Test 3: Users Cannot Read Other's Private Fields
```javascript
// Can read public profile info
const { data } = await supabase
  .from('profiles')
  .select('name, bio, avatar_url')
  .eq('id', otherUserId)
  .single();

// Email is visible but should be marked as sensitive
// Consider masking in API layer for non-owners
const { email } = data;
expect(email).toBeDefined();  // Currently visible to authenticated users
```

### Test 4: Anonymous Requests Fail
```javascript
// Direct Supabase API call with anon key
const response = await fetch(
  'https://[project].supabase.co/rest/v1/profiles',
  {
    headers: {
      'Authorization': 'Bearer [ANON_KEY]'
    }
  }
);

// Should return 403
expect(response.status).toBe(403);
```

## Best Practices

### API Endpoint Layer (Recommended)

For better control, consider masking sensitive fields at the API level:

```typescript
// Backend endpoint
export async function GET(request: Request) {
  const userId = request.auth?.sub;
  
  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .single();
  
  // Mask email if not viewing own profile
  if (profile.id !== userId) {
    profile.email = undefined;  // Hide email from others
  }
  
  return Response.json(profile);
}
```

### Public Profile Views

For public user profiles, consider a separate `public_profiles` table:

```sql
CREATE TABLE public.public_profiles AS
SELECT 
  id,
  name,
  bio,
  avatar_url,
  skills,
  interests,
  rating,
  sessions_completed,
  badges,
  created_at
FROM profiles
WHERE profile_public = true;

-- Enable RLS and allow public access
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_profiles_readable" 
  ON public.public_profiles FOR SELECT USING (true);
```

## Monitoring

### Audit Suspicious Access

```sql
-- Log all profile queries from anonymous sessions (should be 0)
SELECT 
  COUNT(*) as denied_anon_requests,
  TO_CHAR(NOW(), 'YYYY-MM-DD HH:MI') as checked_at
FROM audit_log
WHERE resource = 'profiles'
AND session_user IS NULL  -- Anonymous
AND to_timestamp(timestamp) > NOW() - INTERVAL '1 hour';
```

## Migration Path

If you need to expose some profile data publicly:

1. Create a separate `public_profiles` table with non-sensitive fields
2. Use triggers to sync from `profiles`
3. Enable public SELECT RLS on `public_profiles`
4. Keep `profiles` table restricted to authenticated users

## Related Issues

- #1870: Profiles table missing RLS policy, all user emails readable via anon Supabase key

## References

- [OWASP: Sensitive Data Exposure](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)
- [Supabase: Authentication](https://supabase.com/docs/guides/auth)
- [Supabase: RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [CWE-552: Files and Directories Accessible to External Parties](https://cwe.mitre.org/data/definitions/552.html)
