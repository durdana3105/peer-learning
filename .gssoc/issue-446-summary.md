# Fix Plan for Issue #446

## Issue: Taxonomy Pollution (Broken RLS on skills_taxonomy)

## Approach
Replaced the overly permissive `INSERT` policy on `skills_taxonomy` with one that restricts insertion exclusively to admin users, utilizing the `public.has_role(auth.uid(), 'admin')` helper.

## Changes Made
1. Created migration `20260601000010_fix_skills_taxonomy_rls.sql`.
2. Added check `public.has_role(auth.uid(), 'admin')` for `skills_taxonomy` `INSERT`.

*This file was auto-generated for GSSoC 2026 compliance.*
