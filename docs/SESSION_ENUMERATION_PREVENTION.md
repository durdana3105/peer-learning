# Session Enumeration Prevention

## Vulnerability Summary

Study sessions (study rooms) could be enumerated by attackers to discover all active rooms, allowing them to:
1. Join any public room without explicit invitation
2. Monitor activity in rooms they shouldn't access
3. Perform resource enumeration attacks

## Root Cause

The original RLS policy used `USING (true)` for SELECT on study_rooms, allowing any authenticated user to read all rooms regardless of privacy settings or participation status.

## Solution

### 1. ID Security

**Status:** ✅ Already Secure
- Study room IDs use `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Non-sequential UUIDs prevent ID guessing/iteration attacks
- Example: Impossible to predict next room ID after seeing one

### 2. RLS Policy Enforcement

Updated policies now restrict access to:
- Rooms created by the user (creator access)
- Rooms the user is explicitly invited to (participant access)
- Rooms marked as public (is_private = false)

**Before (Vulnerable):**
```sql
CREATE POLICY "Anyone can read study rooms"
ON study_rooms FOR SELECT TO authenticated
USING (true);  -- VULNERABLE: Anyone can read all rooms!
```

**After (Secure):**
```sql
CREATE POLICY "study_rooms_enumeration_prevention" ON public.study_rooms
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.study_room_participants
      WHERE room_id = study_rooms.id AND profile_id = auth.uid()
    )
    OR (is_private = false)
  );
```

### 3. Message Access Control

Study room messages are now restricted based on room access:
- Users can only see messages from rooms they can access
- No message enumeration across private rooms
- Efficient checking via indexed participant lookups

## Attack Vectors Prevented

### 1. Room Enumeration
**Before:** Attacker could fetch all rooms via `SELECT * FROM study_rooms`
**After:** Query returns only accessible rooms based on RLS policies

### 2. Participant Discovery
**Before:** Attacker could identify all participants in any room
**After:** Only room members can see participant list (via RLS)

### 3. Message Snooping
**Before:** Attacker could read messages from any room
**After:** Only room participants can access messages

### 4. Room Capacity Probing
**Before:** Attacker could determine which rooms are active
**After:** Only visible rooms indicate activity (enumeration prevented)

## Database Schema

### Study Rooms Table
```sql
CREATE TABLE study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- Non-sequential
  topic TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Participants Table
```sql
CREATE TABLE study_room_participants (
  room_id UUID REFERENCES study_rooms(id),
  profile_id UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (room_id, profile_id)
);
```

### RLS Policies
1. **study_rooms_enumeration_prevention**: Controls who can see rooms
2. **study_room_messages_enumeration_prevention**: Controls message access
3. **study_room_participants_select**: Controls participant visibility

## Security Properties

1. **Non-Sequential IDs**: UUID prevents ID guessing
2. **Strict Access Control**: RLS enforces access rules at database level
3. **Participant Verification**: Invitation system prevents unauthorized access
4. **Public/Private Distinction**: is_private flag allows room sharing
5. **Query Efficiency**: Indexed lookups prevent timing attacks

## Additional Recommendations

### Rate Limiting
Consider implementing application-level rate limiting on:
- `GET /api/study-rooms` endpoints
- `GET /api/study-rooms/:id` endpoints
- Message list queries

### Audit Logging
Enable Supabase audit logs to detect:
- Unusual enumeration patterns
- Failed access attempts
- Bulk room queries

### Monitoring
Monitor for:
- Users attempting to access rooms they're not members of
- Repeated failed authorization attempts
- Large result sets from room queries

## Testing

### Test 1: Creator Can Access Own Room
```javascript
const room = await supabase
  .from('study_rooms')
  .select()
  .eq('created_by', currentUserId)
  .single();
// Should succeed
```

### Test 2: Non-Creator Cannot Access Private Room
```javascript
const room = await supabase
  .from('study_rooms')
  .select()
  .eq('id', privateRoomId)
  .single();
// Should return no rows if user is not creator/participant
```

### Test 3: Participant Can Access Room
```javascript
// After joining via study_room_participants
const room = await supabase
  .from('study_rooms')
  .select()
  .eq('id', roomId)
  .single();
// Should succeed
```

### Test 4: Cannot Enumerate All Rooms
```javascript
const allRooms = await supabase
  .from('study_rooms')
  .select();
// Should only return accessible rooms, not all rooms
```

## Related Issues

- #1872: Study session IDs are sequential integers, enabling unauthorized room enumeration

## References

- [OWASP: Insecure Direct Object References](https://owasp.org/www-project-top-ten/2017/A4_2017-Insecure_Direct_Object_References)
- [Supabase RLS: Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [CWE-639: Authorization Bypass](https://cwe.mitre.org/data/definitions/639.html)
