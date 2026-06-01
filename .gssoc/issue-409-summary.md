# Fix Plan for Issue #409

## Issue: Missing Admin and Update Policies on mentors Table

## Approach
Introduced necessary UPDATE policies for regular users, and comprehensive SELECT/UPDATE policies for administrators using the `has_role('admin')` function.

## Changes Made
1. Created migration `20260601000005_fix_mentors_admin_update.sql`.
2. Added "Users can update own mentor applications" policy for regular users.
3. Added "Admins can view all mentor applications" and "Admins can update all mentor applications" policies utilizing the `public.has_role()` RPC to properly authorize administrators.

*This file was auto-generated for GSSoC 2026 compliance.*
