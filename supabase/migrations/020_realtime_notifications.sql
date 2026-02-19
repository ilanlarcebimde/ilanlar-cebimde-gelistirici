/* =========================================================
   1) Realtime publication: channel_stats
   ========================================================= */
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_rel pr
      JOIN pg_publication p ON p.oid = pr.prpubid
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE p.pubname = 'supabase_realtime'
        AND n.nspname = 'public'
        AND c.relname = 'channel_stats'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_stats;
    END IF;
  END IF;
END;
$$;

/* =========================================================
   2) channel_stats columns + unique constraint
   ========================================================= */
ALTER TABLE public.channel_stats
  ADD COLUMN IF NOT EXISTS published_seq bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_last_at timestamptz;

DO $$
BEGIN
  -- ensure channel_id is unique (needed for UPSERT)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'channel_stats_channel_id_unique'
      AND conrelid = 'public.channel_stats'::regclass
  ) THEN
    ALTER TABLE public.channel_stats
      ADD CONSTRAINT channel_stats_channel_id_unique UNIQUE (channel_id);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_channel_stats_channel_id
  ON public.channel_stats(channel_id);

/* =========================================================
   3) Trigger function: job_posts -> channel_stats (safe)
   ========================================================= */
CREATE OR REPLACE FUNCTION public.fn_job_posts_to_channel_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- INSERT: only when published
  IF TG_OP = 'INSERT' THEN
    IF NEW.status::text = 'published' THEN
      INSERT INTO public.channel_stats (channel_id, published_seq, published_last_at)
      VALUES (NEW.channel_id, 1, now())
      ON CONFLICT (channel_id) DO UPDATE
        SET published_seq = public.channel_stats.published_seq + 1,
            published_last_at = now();
    END IF;

    RETURN NEW;
  END IF;

  -- UPDATE: handle transition to published (optional but recommended)
  IF TG_OP = 'UPDATE' THEN
    IF (COALESCE(OLD.status::text,'') <> 'published')
       AND (NEW.status::text = 'published') THEN
      INSERT INTO public.channel_stats (channel_id, published_seq, published_last_at)
      VALUES (NEW.channel_id, 1, now())
      ON CONFLICT (channel_id) DO UPDATE
        SET published_seq = public.channel_stats.published_seq + 1,
            published_last_at = now();
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_job_posts_to_channel_stats_ins'
      AND tgrelid = 'public.job_posts'::regclass
  ) THEN
    CREATE TRIGGER trg_job_posts_to_channel_stats_ins
    AFTER INSERT ON public.job_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_job_posts_to_channel_stats();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_job_posts_to_channel_stats_upd'
      AND tgrelid = 'public.job_posts'::regclass
  ) THEN
    CREATE TRIGGER trg_job_posts_to_channel_stats_upd
    AFTER UPDATE OF status ON public.job_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_job_posts_to_channel_stats();
  END IF;
END;
$$;

/* =========================================================
   4) user_channel_seen table + RLS
   ========================================================= */
CREATE TABLE IF NOT EXISTS public.user_channel_seen (
  user_id uuid NOT NULL,
  channel_id uuid NOT NULL,
  last_seen_seq bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_user_channel_seen_user
  ON public.user_channel_seen(user_id);

ALTER TABLE public.user_channel_seen ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_channel_seen'
      AND policyname='user_channel_seen_select_own'
  ) THEN
    CREATE POLICY user_channel_seen_select_own
      ON public.user_channel_seen
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_channel_seen'
      AND policyname='user_channel_seen_insert_own'
  ) THEN
    CREATE POLICY user_channel_seen_insert_own
      ON public.user_channel_seen
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_channel_seen'
      AND policyname='user_channel_seen_update_own'
  ) THEN
    CREATE POLICY user_channel_seen_update_own
      ON public.user_channel_seen
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_channel_seen'
      AND policyname='user_channel_seen_delete_own'
  ) THEN
    CREATE POLICY user_channel_seen_delete_own
      ON public.user_channel_seen
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

/* =========================================================
   5) channel_stats RLS: public SELECT only
   ========================================================= */
ALTER TABLE public.channel_stats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='channel_stats'
      AND policyname='channel_stats_select_public'
  ) THEN
    CREATE POLICY channel_stats_select_public
      ON public.channel_stats
      FOR SELECT TO PUBLIC
      USING (true);
  END IF;
END;
$$;
