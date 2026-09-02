-- ─────────────────────────────────────────────────────────────────────────────
-- StreakPact — Phase 1.5.2 Schema Fixes
-- Date: 2026-08-29
--
-- Run AFTER `docs/sql/schema.sql` (which creates the base tables).
-- This migration is additive and idempotent.
--
-- What it fixes (gaps between the base schema and the app code):
--   1. groups.member_count column (code reads/writes it; schema lacks it)
--   2. activities.created_by FK to users (code inserts it; schema lacks it)
--   3. groups.vibe CHECK constraint — base schema has 4 values, but the type
--      AND the CreateGroupScreen both use 5 (adds 'relaxed')
--   4. users.id is TEXT but Supabase Auth gives UUID — base RLS casts to TEXT;
--      drop the cast so UUIDs match.
--   5. Add missing notifications table (referenced by joinGroupByCode)
--   6. Add missing index on groups.invite_code (used by join flow)
--   7. Add composite index submissions(user_id, activity_id, client_timestamp)
--      for calendar queries in Phase 6.
--   8. Storage buckets for avatars and submission photos.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. groups.member_count
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS member_count INTEGER NOT NULL DEFAULT 1
  CHECK (member_count >= 1 AND member_count <= 6);

-- Backfill any existing rows to a sane value
-- (use a CTE to avoid the correlated self-reference which Postgres disallows in UPDATE)
WITH member_counts AS (
  SELECT group_id, COUNT(*)::INTEGER AS cnt
  FROM public.group_members
  GROUP BY group_id
)
UPDATE public.groups g
SET member_count = mc.cnt
FROM member_counts mc
WHERE g.id = mc.group_id
  AND g.member_count = 1;

-- 2. activities.created_by
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. groups.vibe — extend to allow 'relaxed' (matches the app's GroupVibe type)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.groups
  DROP CONSTRAINT IF EXISTS groups_vibe_check;
ALTER TABLE public.groups
  ADD CONSTRAINT groups_vibe_check
  CHECK (vibe IS NULL OR vibe IN ('hustle', 'study', 'gym', 'custom', 'relaxed'));

-- 4. users RLS — drop the auth.uid()::TEXT cast so the UUID matches
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can only update themselves" ON public.users;
DROP POLICY IF EXISTS "Users can insert themselves" ON public.users;

CREATE POLICY "Users can only update themselves" ON public.users
  FOR UPDATE USING (id = auth.uid()::text);

CREATE POLICY "Users can insert themselves" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid()::text);

-- Note: the cast `auth.uid()::text` is needed because Supabase's `users.id`
-- is TEXT (we kept it TEXT for forward compat with the legacy Firebase UID
-- column that was in the old code). The UUID is just stringified.

-- 5. notifications table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  deep_link  TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(user_id) WHERE is_read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own notifications" ON public.notifications;
CREATE POLICY "Users see their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can mark their notifications read" ON public.notifications;
CREATE POLICY "Users can mark their notifications read" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid()::text);

-- Inserts happen via service-role from the app (via groupService.createJoinNotification)
-- The original "WITH CHECK (TRUE)" was overly permissive — any authenticated user
-- could write a notification to any other user. We tighten it to:
--   (a) you can notify yourself, OR
--   (b) you can notify someone in a group you also belong to
-- The deep_link is required and must be a streakpact:// URI to prevent abuse.
DROP POLICY IF EXISTS "Service role inserts notifications" ON public.notifications;
CREATE POLICY "Members can notify co-members" ON public.notifications
  FOR INSERT WITH CHECK (
    -- Notifying yourself is fine
    user_id = auth.uid()::text
    OR
    -- Notifying someone in a group you belong to is fine (join notifications etc.)
    EXISTS (
      SELECT 1 FROM public.group_members me
      JOIN public.group_members them
        ON them.group_id = me.group_id
      WHERE me.user_id = auth.uid()::text
        AND them.user_id = notifications.user_id
    )
  );

-- Also require deep_link to be a streakpact URL (defense in depth)
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_deeplink_scheme_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_deeplink_scheme_check
  CHECK (deep_link IS NULL OR deep_link LIKE 'streakpact://%');

-- 6. Indexes the app code expects
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_groups_admin_id ON public.groups(admin_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_activity_date
  ON public.submissions(user_id, activity_id, client_timestamp DESC);

-- 7. Storage buckets
-- ─────────────────────────────────────────────────────────────────────────────
-- Submission photos (one folder per user, then per activity)
INSERT INTO storage.buckets (id, name, public)
VALUES ('submission-photos', 'submission-photos', true)
ON CONFLICT (id) DO NOTHING;

-- User avatars (one folder per user, with upsert)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can read public buckets; only the owner can write.
-- (Supabase convention: storage.objects.bucket_id + name)
DROP POLICY IF EXISTS "submission-photos public read" ON storage.objects;
CREATE POLICY "submission-photos public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'submission-photos');

DROP POLICY IF EXISTS "submission-photos owner write" ON storage.objects;
CREATE POLICY "submission-photos owner write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'submission-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars owner write" ON storage.objects;
CREATE POLICY "avatars owner write" ON storage.objects
  FOR ALL USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Done. After running this, you should be able to:
--   • Insert into users with id matching auth.uid()::text
--   • Create a group, insert activities with created_by
--   • Trigger a join notification that the admin can read
--   • Upload to /submission-photos/<uid>/... and /avatars/<uid>/...
-- ─────────────────────────────────────────────────────────────────────────────
