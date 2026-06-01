# Fix Plan for Issue #402

## Issue: XP Forgery via Infinite RPC Calls (Missing Rate Limiting)

## Approach
Introduced rate limiting inside the `award_activity_xp` RPC to prevent users from spamming the function infinitely to farm XP.

## Changes Made
1. Created migration `20260531000008_fix_award_activity_xp_rate_limit.sql`.
2. Created a new table `public.user_activity_log` to track daily activities by user.
3. Updated `award_activity_xp` to check `user_activity_log` and enforce daily limits (e.g. 1 daily login, 3 session joins, 5 mentor helps) before awarding XP.

*This file was auto-generated for GSSoC 2026 compliance.*
