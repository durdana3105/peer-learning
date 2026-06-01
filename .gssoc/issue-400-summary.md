# Fix Plan for Issue #400

## Issue: Denial of Service via system_config (Missing RLS)

## Approach
Enable Row-Level Security on the `public.system_config` table to prevent any unauthorized modification (inserts/updates/deletes) by authenticated or anonymous clients.

## Changes to Make
1. Created a new migration file `20260531000006_secure_system_config.sql`.
2. Added `ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;`.
3. Added comments explaining why no policies are needed (default deny blocks all client access, while postgres bypasses RLS for background jobs).

*This file was auto-generated for GSSoC 2026 compliance.*
