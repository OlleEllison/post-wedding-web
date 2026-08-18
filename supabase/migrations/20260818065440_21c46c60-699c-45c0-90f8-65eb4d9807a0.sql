-- 1. Remove public upload access to the storage bucket; uploads now use server-issued signed URLs
DROP POLICY IF EXISTS "Anyone can upload wedding photos" ON storage.objects;

-- 2. Lock down rate_limit_events with explicit deny-all policies (service role bypasses RLS)
REVOKE ALL ON public.rate_limit_events FROM anon, authenticated;
GRANT ALL ON public.rate_limit_events TO service_role;
DROP POLICY IF EXISTS "No direct access to rate limit events" ON public.rate_limit_events;
CREATE POLICY "No direct access to rate limit events"
ON public.rate_limit_events
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 3. Lock down wedding_memories: only reachable via the guest-content edge function
REVOKE ALL ON public.wedding_memories FROM anon, authenticated;
GRANT ALL ON public.wedding_memories TO service_role;
DROP POLICY IF EXISTS "No direct access to memories" ON public.wedding_memories;
CREATE POLICY "No direct access to memories"
ON public.wedding_memories
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 4. Stop broadcasting memories over realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.wedding_memories;
