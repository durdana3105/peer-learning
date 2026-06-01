# Fix Plan for Issue #408

## Issue: Public Study Rooms Unjoinable via API

## Approach
Added an INSERT Row-Level Security (RLS) policy to the `study_room_participants` table so users can voluntarily join public study rooms.

## Changes Made
1. Created migration `20260601000004_fix_study_room_participant_insert.sql`.
2. Added an `INSERT` policy ensuring the user is inserting their own `profile_id` into a `room_id` that belongs to a public study room (`not is_private`).

*This file was auto-generated for GSSoC 2026 compliance.*
