# Fix Plan for Issue #447

## Issue: Broken Chat Initialization (Missing INSERT Policy on conversations)

## Approach
Added the missing `INSERT` policies to both `conversations` and `conversation_participants` tables, enabling users to create new chat sessions. The participant policy specifically ensures users can only add themselves or others to conversations they are actively a part of.

## Changes Made
1. Created migration `20260601000011_fix_chat_initialization.sql`.
2. Added `INSERT` policies for `conversations` and `conversation_participants`.

*This file was auto-generated for GSSoC 2026 compliance.*
