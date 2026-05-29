-- Migration: Secure create_announcement_notification RPC
--
-- The previous create_announcement_notification function (20260518_notification_automation.sql)
-- was missing an admin authorization check and had default public execute privileges.
-- This allowed any unauthenticated or standard user to broadcast arbitrary notifications
-- to the entire auth.users table, exposing the platform to massive phishing/spam exploits.
--
-- Fix: Recreate the function with a strict has_role('admin') check, revoke PUBLIC
-- execute access, and grant execution strictly to authenticated users (who will then
-- be rejected if they lack the admin role).

CREATE OR REPLACE FUNCTION public.create_announcement_notification(
  announcement_title text,
  announcement_body text,
  announcement_action_url text default '/notifications'
)
RETURNS integer AS $$
DECLARE
  inserted_count integer;
BEGIN
  -- Strict authorization check: Only admins can invoke this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can broadcast announcements';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    action_url
  )
  SELECT
    id,
    'announcement',
    announcement_title,
    announcement_body,
    announcement_action_url
  FROM auth.users;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke default PUBLIC execution access to completely eliminate anonymous exploit vectors
REVOKE ALL ON FUNCTION public.create_announcement_notification(text, text, text) FROM PUBLIC;

-- Allow authenticated users to call it (the internal check prevents non-admins from succeeding)
GRANT EXECUTE ON FUNCTION public.create_announcement_notification(text, text, text) TO authenticated;
