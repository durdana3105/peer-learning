-- Add is_pinned column to messages table for pinning important resources in Session Chat
alter table public.messages add column if not exists is_pinned boolean default false;
