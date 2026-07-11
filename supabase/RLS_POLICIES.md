# Row-Level Security (RLS) Policies

This document describes the Row-Level Security policies enforced on all `public` schema tables, as consolidated by the security audit (#985) migration `20260617000000_consolidate_rls_policies.sql`, with subsequent refinements from later migrations layered in.

**All tables in the `public` schema have RLS enabled.** There is no default-allow table; every table's access is governed exclusively by the policies below.

> **Source of truth note:** Some policies were modified by migrations *after* the consolidation. Where that happened, this document reflects the **final, currently-effective** policy — not the version originally written in the consolidation file. Each such case is called out explicitly.

---

## 1. Core Profiles & Roles

### `profiles`
| Operation | Rule |
|---|---|
| SELECT | Public — anyone can view any profile. |
| INSERT | `auth.uid() = id` — users can only create their own profile row. |
| UPDATE | `auth.uid() = id`, **and** a `WITH CHECK` clause that pins gamification/streak columns (`is_mentor`, `points`, `rating`, `badges`, `sessions_completed`, `streak`, `previous_streak`, `last_active`, `restoration_used_today`, `restoration_date`) to their existing values. Users can edit their own profile but cannot self-modify any progression/reputation field through direct table access — those must go through a trusted server-side path. |
| DELETE | `auth.uid() = id` — users can delete only their own profile. |

### `user_roles`
| Operation | Rule |
|---|---|
| SELECT | Admins only (`has_role(auth.uid(), 'admin')`). |
| INSERT | Admins only. |
| UPDATE | Admins only. |
| DELETE | Admins only. |

### `system_config`
| Operation | Rule |
|---|---|
| SELECT | Any authenticated user (`auth.role() = 'authenticated'`). |
| ALL (write) | Admins only. |

---

## 2. Messaging & Conversations

### `conversations`
| Operation | Rule |
|---|---|
| SELECT | Caller must be a participant (row in `conversation_participants` for this conversation + `auth.uid()`). |
| INSERT | Open (`true`) — any authenticated client can create a conversation shell; membership is controlled separately via `conversation_participants`. |

### `conversation_participants`
| Operation | Rule |
|---|---|
| SELECT | Caller is the participant row's `user_id`, **or** caller is already a participant in that conversation. |
| INSERT | `user_id = auth.uid()` — you can only add yourself as a participant. |
| DELETE | `user_id = auth.uid()` — you can only remove yourself. |

### `messages`
| Operation | Rule |
|---|---|
| SELECT | For direct messages (`session_id IS NULL`): caller must be `sender_id` or `receiver_id`. For session messages (`session_id IS NOT NULL`): **open to all** — no participant check is applied at the row level. |
| INSERT (direct) | `session_id IS NULL AND sender_id = auth.uid()`. |
| INSERT (session) | `session_id IS NOT NULL AND user_id = auth.uid()`. |

> ⚠️ Note: session messages are readable by anyone, not just session participants — this mirrors the `sessions` table's open-SELECT design (see §3) but is worth flagging if session content is ever expected to be private.

### `chat_messages`
| Operation | Rule |
|---|---|
| SELECT | `user_id = auth.uid()` — strictly own bot-chat history. |
| INSERT | `user_id = auth.uid()`. |

---

## 3. Study Rooms

### `study_rooms`
| Operation | Rule |
|---|---|
| SELECT | `NOT is_private`, **or** caller is `created_by`, **or** caller is a participant. |
| INSERT | `auth.uid() = created_by`. |
| UPDATE | `auth.uid() = created_by` (enforced on both USING and WITH CHECK). |
| DELETE | `auth.uid() = created_by`. |

### `study_room_messages`
| Operation | Rule |
|---|---|
| SELECT | Room must satisfy the same visibility rule as `study_rooms` SELECT (public room, owner, or participant). |
| INSERT | `profile_id = auth.uid()` **and** the same room-visibility condition. |
| UPDATE | `profile_id = auth.uid()`. |
| DELETE | `profile_id = auth.uid()`. |

### `study_room_participants`
| Operation | Rule |
|---|---|
| SELECT | Same room-visibility condition as above (public room, owner, or existing participant). |
| INSERT | `profile_id = auth.uid()` — users add themselves. |
| DELETE | `profile_id = auth.uid()` — users remove themselves. |

---

## 4. Sessions & Mentorship

### `sessions`
| Operation | Rule |
|---|---|
| SELECT | Public (`true`). |
| INSERT | `mentor_id = auth.uid()` **and** caller's profile has `is_mentor = true`. |
| UPDATE | Same mentor + `is_mentor` check on USING, **and** a WITH CHECK that pins `id`, `participants`, `created_at`, `status` to their existing values — mentors can edit session content but cannot change status or participant list through direct table access. |

### `session_participants`
| Operation | Rule |
|---|---|
| SELECT | Public (`true`). |
| INSERT | `user_id = auth.uid()`. |
| DELETE | `user_id = auth.uid()`. |

### `session_summaries`
| Operation | Rule |
|---|---|
| SELECT | Public (`true`). |
| INSERT | `auth.uid() = user_id`, **and** caller must be either a participant in that session or its mentor. |

### `mentors`
| Operation | Rule |
|---|---|
| SELECT | `user_id = auth.uid()` or admin. |
| INSERT | `user_id = auth.uid()` — self-apply only. |
| UPDATE | `user_id = auth.uid()` (own application), **or** admin (any application) — two separate policies, combined with OR semantics. |

### `mentorship_paths`
| Operation | Rule |
|---|---|
| SELECT | Caller is `mentor_id`, `mentee_id`, or admin. |
| ALL (write) | `mentor_id = auth.uid()` — mentors fully manage their own paths. |

### `mentorship_milestones`
| Operation | Rule |
|---|---|
| SELECT | Caller is mentor, mentee, or admin on the parent `mentorship_paths` row. |
| ALL (write) | Caller is `mentor_id` on the parent path. |

---

## 5. Peer Connections & Reviews

### `peer_connections`
| Operation | Rule |
|---|---|
| SELECT | `auth.uid() = sender_id OR auth.uid() = receiver_id`. |
| INSERT | `auth.uid() = sender_id`. |
| UPDATE | `auth.uid() = receiver_id` — only the receiver can act on (accept/reject) a request. |
| DELETE | `auth.uid() = sender_id OR auth.uid() = receiver_id`. |

### `peer_submissions`
| Operation | Rule |
|---|---|
| SELECT | Public (`true`). |
| INSERT | `user_id = auth.uid()`. |
| UPDATE | `user_id = auth.uid()`, **with a WITH CHECK pinning `status` to its existing value** (fix #1675). Direct client updates can no longer change submission status at all — status transitions happen exclusively through the `submit_peer_review()` `SECURITY DEFINER` RPC (see `20260706000001_peer_review_status_rpc.sql`), which performs its own auth checks and bypasses RLS. |
| DELETE | `user_id = auth.uid()`. |

### `peer_reviews`
> **Superseded by `20260702000000_prevent_peer_review_self_reviews.sql`.** The table below reflects the final, currently-effective policy set — not the original consolidation version.

| Operation | Rule |
|---|---|
| SELECT | Public (`true`). |
| INSERT | `reviewer_id = auth.uid()`, **and** a submission-ownership check: the target `submission_id` must exist in `peer_submissions`, have a non-null `user_id`, and that `user_id` must differ from the reviewer. This closes the self-review loophole present in the original consolidation policy. |
| UPDATE | `reviewer_id = auth.uid()`. |
| DELETE | `reviewer_id = auth.uid()`. |

---

## 6. Gamification & Leaderboard

### `leaderboard`
| Operation | Rule |
|---|---|
| SELECT | Public (`true`). |
| INSERT | `user_id = auth.uid()`. |
| UPDATE | `user_id = auth.uid()` (USING and WITH CHECK). |
| DELETE | `user_id = auth.uid()`. |

### `xp_transactions`
| Operation | Rule |
|---|---|
| SELECT | `user_id = auth.uid()`. |
| INSERT | `user_id = auth.uid()`. |

### `user_activity_log`
| Operation | Rule |
|---|---|
| SELECT | `user_id = auth.uid()`. |
| INSERT | `user_id = auth.uid()`. |

---

## 7. Notifications & Push

### `notifications`
| Operation | Rule |
|---|---|
| SELECT | `user_id = auth.uid()`. |
| UPDATE | `user_id = auth.uid()` (USING and WITH CHECK). |
| DELETE | `user_id = auth.uid()`. |

### `push_subscriptions`
| Operation | Rule |
|---|---|
| SELECT | `user_id = auth.uid()`. |
| INSERT | `user_id = auth.uid()`. |
| UPDATE | `user_id = auth.uid()`. |
| DELETE | `user_id = auth.uid()`. |

---

## 8. Resources & Whiteboard

### `resources`
> Fix #1674: previously INSERT/UPDATE/DELETE all used a blanket `true` check, so RLS enforced nothing here and any authenticated user could modify or delete another user's uploaded resource directly via the Supabase client. Ownership is now enforced at the database layer via `uploaded_by`.

| Operation | Rule |
|---|---|
| SELECT | Public (`true`). |
| INSERT | `uploaded_by = auth.uid()`. |
| UPDATE | `uploaded_by = auth.uid()` (USING and WITH CHECK). |
| DELETE | `uploaded_by = auth.uid()`. |

### `saved_resources`
| Operation | Rule |
|---|---|
| SELECT | `user_id = auth.uid()`. |
| INSERT | `user_id = auth.uid()`. |
| DELETE | `user_id = auth.uid()`. |

### `resource_votes`
| Operation | Rule |
|---|---|
| SELECT | Public (`true`). |
| INSERT | `user_id = auth.uid()`. |
| UPDATE | `user_id = auth.uid()`. |
| DELETE | `user_id = auth.uid()`. |

### `whiteboard_events`
| Operation | Rule |
|---|---|
| SELECT | Public (`true`). |
| INSERT | Open (`true`) — no ownership check. |

### `whiteboard_states`
| Operation | Rule |
|---|---|
| SELECT | Public (`true`). |
| INSERT | Open (`true`). |
| UPDATE | Open (`true`) — no ownership check. |

> ⚠️ Note: `whiteboard_events` and `whiteboard_states` have no per-user write restriction. Any authenticated caller can write/modify any room's whiteboard state. This is presumably intentional for real-time collaborative editing, but is a deliberate exception to the ownership pattern used elsewhere and worth confirming.

---

## 9. Misc Tables

### `portfolio_profiles`
| Operation | Rule |
|---|---|
| SELECT | `is_published = true` — unpublished portfolios are not publicly visible. |
| ALL (write) | `profile_id = auth.uid()` — fully managed by owner. |

### `skills_taxonomy`
| Operation | Rule |
|---|---|
| SELECT | Public (`true`). |
| INSERT | Open (`true`) — any authenticated caller can add taxonomy entries. |

### `doubts`
| Operation | Rule |
|---|---|
| SELECT | Public (`true`). |
| INSERT | Open (`true`). |

### `contact_messages`
| Operation | Rule |
|---|---|
| SELECT | Admins only. |
| INSERT | Open (`true`) — anyone (including unauthenticated contact-form submitters) can insert. |

### `users` (conditional — only if a `public.users` table exists alongside `auth.users`)
| Operation | Rule |
|---|---|
| SELECT | Public (`true`). |
| INSERT | `auth.uid() = id`. |
| UPDATE | `auth.uid() = id` (USING and WITH CHECK). |

---

## Change Log

| Migration | Change |
|---|---|
| `20260617000000_consolidate_rls_policies.sql` | Full RLS audit and consolidation (#985): drops all pre-existing policies, force-enables RLS on every `public` table, and re-creates a single, explicit policy set per table. |
| `20260702000000_prevent_peer_review_self_reviews.sql` | Replaces `peer_reviews` INSERT policy to block self-reviews — reviewer can no longer submit a review against their own `peer_submissions` row. |
| `20260703000000_add_overdue_notification_type.sql` | Adds `mentorship_reminder` / `mentorship_reminder_overdue` enum values to `notification_type`. No RLS impact. |

---

## Known Gaps / Follow-ups

- **`messages`** (session messages) and **`sessions`** rows are readable by *any* authenticated user, not just participants/mentors — confirm this is intended before treating session content as private.
- **`whiteboard_events`** / **`whiteboard_states`** have no ownership restriction on writes — any caller can mutate any room's board state.
- **`skills_taxonomy`** and **`doubts`** allow open INSERT with no `WITH CHECK` — fine for crowd-sourced/public data, but worth a spam/abuse review.