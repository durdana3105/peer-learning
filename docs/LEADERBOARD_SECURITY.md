# Leaderboard Score Security

## Vulnerability Summary

Users could directly modify their leaderboard scores through client-side Supabase calls without server-side validation, allowing them to:
1. Arbitrarily increase their XP score
2. Add badges they haven't earned
3. Manipulate their ranking on the leaderboard
4. Undermine the gamification system's integrity

## Root Cause

The RLS policy "Users can update leaderboard entry" allowed users to update ANY field in their leaderboard row via client-side code, including sensitive fields like `xp`, `streak`, and `badges`.

```sql
-- VULNERABLE: Allows users to update any field
CREATE POLICY "Users can update leaderboard entry"
  ON public.leaderboard FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## Solution

### 1. Restrict Direct Updates

**Before (Vulnerable):**
```sql
-- Users could update ANY field
UPDATE leaderboard SET xp = 10000 WHERE user_id = my_id;
```

**After (Secure):**
```sql
-- Users can only update profile fields
CREATE POLICY "Users can update own profile fields" ON public.leaderboard
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND username = NEW.username
    AND avatar_url = NEW.avatar_url
    AND xp = OLD.xp  -- Cannot change
    AND streak = OLD.streak  -- Cannot change
    AND badges = OLD.badges  -- Cannot change
  );
```

### 2. Server-Side Score Updates

All score modifications now go through server-side functions:

**Atomic XP Increment:**
```sql
CREATE OR REPLACE FUNCTION public.increment_xp(
  target_user_id uuid,
  xp_amount integer
)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
AS $$
  UPDATE public.leaderboard
  SET xp = xp + xp_amount
  WHERE user_id = target_user_id;
$$;
```

**Secure Badge Award:**
```sql
CREATE OR REPLACE FUNCTION public.award_badge(
  target_user_id uuid,
  badge_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leaderboard
  SET badges = array_append(badges, badge_name)
  WHERE user_id = target_user_id
  AND NOT badges @> ARRAY[badge_name];
END;
$$;
```

### 3. Audit Logging

All score changes are logged for detection and investigation:

```sql
CREATE TABLE public.leaderboard_updates (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  updated_by text,  -- 'system', 'user', or function name
  updated_at timestamptz
);
```

**Audit Log Access:**
- Users cannot access the audit log (RLS prevents SELECT)
- Admins can review score changes to detect fraud

## Fields and Access Control

| Field | User Can Update | Method | Notes |
|-------|-----------------|--------|-------|
| `username` | ✅ Yes | Direct UPDATE | Profile information |
| `avatar_url` | ✅ Yes | Direct UPDATE | Profile picture |
| `xp` | ❌ No | Server function only | Must use increment_xp() |
| `streak` | ❌ No | Server function only | Updated by cron job |
| `sessions_joined` | ❌ No | Server function only | Incremented on join |
| `badges` | ❌ No | Server function only | Must use award_badge() |

## Attack Vectors Prevented

### 1. Direct Score Manipulation
**Before:** User could execute: `UPDATE leaderboard SET xp = 999999`
**After:** RLS policy prevents field update if value changes

### 2. Badge Spoofing
**Before:** User could add any badge: `UPDATE leaderboard SET badges = array_append(badges, 'rare_badge')`
**After:** Only award_badge() function can add badges, with SECURITY DEFINER

### 3. Ranking Manipulation
**Before:** User could artificially boost their ranking
**After:** XP only increments through validated server functions

### 4. Audit Evasion
**Before:** No logging of score changes
**After:** All updates logged, manual changes detectable

## Implementation

### On the Client

```typescript
// DO NOT do this (will be blocked by RLS):
await supabase
  .from('leaderboard')
  .update({ xp: 10000 })
  .eq('user_id', userId);

// Correct: Call server-side endpoint
const response = await fetch('/api/award-xp', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ xp_amount: 10 })
});
```

### On the Server

```typescript
// Backend endpoint must validate before calling RPC
export async function POST(request: Request) {
  const { xp_amount } = await request.json();
  
  // Validation
  if (xp_amount < 0 || xp_amount > 100) {
    return new Response('Invalid XP amount', { status: 400 });
  }
  
  // Call secure RPC
  const { error } = await supabase.rpc('increment_xp', {
    target_user_id: user.id,
    xp_amount: xp_amount
  });
  
  if (error) throw error;
  return new Response(JSON.stringify({ success: true }));
}
```

## Monitoring and Alerts

### Suspicious Patterns to Monitor

1. **Rapid Score Increases**
   - XP increase > 100 in one operation
   - Multiple XP increments in same minute

2. **Impossible Achievements**
   - Badges awarded without completing associated task
   - Streak increased without daily activity

3. **Audit Log Gaps**
   - Score changes without corresponding log entries
   - Timestamp inconsistencies

### Recommended Actions

```sql
-- Find users with suspicious XP changes
SELECT user_id, COUNT(*) as change_count
FROM leaderboard_updates
WHERE field_name = 'xp'
AND new_value::integer - old_value::integer > 500
GROUP BY user_id
HAVING COUNT(*) > 3;

-- Rollback scores if fraud detected
UPDATE leaderboard
SET xp = (
  SELECT xp FROM leaderboard_updates
  WHERE user_id = leaderboard.user_id
  AND field_name = 'xp'
  ORDER BY updated_at DESC LIMIT 1 OFFSET 1
)
WHERE user_id = 'suspicious_user_id';
```

## Testing

### Test 1: Users Cannot Directly Update XP
```javascript
const { data, error } = await supabase
  .from('leaderboard')
  .update({ xp: 99999 })
  .eq('user_id', userId);
// Should fail with authorization error
expect(error).toBeDefined();
```

### Test 2: Users Can Update Profile Fields
```javascript
const { data, error } = await supabase
  .from('leaderboard')
  .update({ username: 'NewName' })
  .eq('user_id', userId);
// Should succeed
expect(error).toBeNull();
```

### Test 3: RPC Can Update XP
```javascript
const { error } = await supabase.rpc('increment_xp', {
  target_user_id: userId,
  xp_amount: 50
});
// Should succeed
expect(error).toBeNull();
```

### Test 4: Badges Must Use Function
```javascript
// Direct update should fail
const { error: directError } = await supabase
  .from('leaderboard')
  .update({ badges: ['fake_badge'] })
  .eq('user_id', userId);
expect(directError).toBeDefined();

// Function update should work
const { error: funcError } = await supabase.rpc('award_badge', {
  target_user_id: userId,
  badge_name: 'real_badge'
});
expect(funcError).toBeNull();
```

## Related Issues

- #1871: Leaderboard scores writable directly via Supabase client with no server-side validation

## References

- [OWASP: A07 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [Supabase: RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [CWE-639: Authorization Bypass](https://cwe.mitre.org/data/definitions/639.html)
- [Time-of-Check to Time-of-Use (TOCTOU)](https://owasp.org/www-community/attacks/TOCTOU)
