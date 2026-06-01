# Fix Plan for Issue #404

## Issue: IDOR: Force-Accepting Peer Connections

## Approach
Updated the INSERT Row-Level Security (RLS) policy on the `peer_connections` table to strictly enforce that the initial `status` of any new connection request must be `'pending'`.

## Changes Made
1. Created migration `20260531000010_fix_peer_connections_insert_status.sql`.
2. Modified the "Users can insert own connection requests" policy. 
3. Appended `AND status = 'pending'` to the `WITH CHECK` clause to prevent malicious users from forcibly establishing connections by injecting `status = 'accepted'` during creation.

*This file was auto-generated for GSSoC 2026 compliance.*
