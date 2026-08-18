
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  identifier text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_lookup
  ON public.rate_limit_events (kind, identifier, created_at DESC);

GRANT ALL ON public.rate_limit_events TO service_role;
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

-- wedding_memories: no direct client access, everything via edge function
DROP POLICY IF EXISTS "Anyone can view memories" ON public.wedding_memories;
DROP POLICY IF EXISTS "Anyone can add memories" ON public.wedding_memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON public.wedding_memories;
DROP POLICY IF EXISTS "Memories cannot be updated" ON public.wedding_memories;
REVOKE ALL ON public.wedding_memories FROM anon, authenticated;
GRANT ALL ON public.wedding_memories TO service_role;

-- wedding_photos: public read only; writes go through the edge function
DROP POLICY IF EXISTS "Anyone can upload photos" ON public.wedding_photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.wedding_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.wedding_photos;
REVOKE INSERT, UPDATE, DELETE ON public.wedding_photos FROM anon, authenticated;
GRANT SELECT ON public.wedding_photos TO anon, authenticated;
GRANT ALL ON public.wedding_photos TO service_role;
