# Fix Plan for Issue #407

## Issue: Study Room Participant Retention Lock (Missing DELETE Policy)

## Approach
Created a DELETE Row-Level Security (RLS) policy for the `study_room_participants` table to allow participants to leave, and creators to remove participants.

## Changes Made
1. Created migration `20260601000003_fix_study_room_participant_delete.sql`.
2. Created a new `DELETE` policy that allows deleting a participant row if `profile_id = auth.uid()` (the user themselves) or if the authenticated user is the `created_by` owner of the `study_room`.

*This file was auto-generated for GSSoC 2026 compliance.*
