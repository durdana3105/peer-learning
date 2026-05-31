# Fix Plan for Issue #403

## Issue: Race Condition in Streak Restoration (TOCTOU)

## Approach
Used row-level locking (`FOR UPDATE`) on the `profiles` table to prevent race conditions when checking and deducting points during streak restoration.

## Changes Made
1. Created migration `20260531000009_fix_restore_streak_race_condition.sql`.
2. Updated the `restore_user_streak` RPC to lock the profile row (`FOR UPDATE`) in the initial SELECT statement.
3. This ensures that concurrent requests will wait and read the properly decremented points balance, fully mitigating the TOCTOU vulnerability.

*This file was auto-generated for GSSoC 2026 compliance.*
