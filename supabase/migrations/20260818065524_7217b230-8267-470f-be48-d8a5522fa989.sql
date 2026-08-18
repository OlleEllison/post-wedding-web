-- Photo records are now served through the guest-content edge function only
DROP POLICY IF EXISTS "Anyone can view photos" ON public.wedding_photos;
REVOKE ALL ON public.wedding_photos FROM anon, authenticated;
GRANT ALL ON public.wedding_photos TO service_role;

DROP POLICY IF EXISTS "No direct access to photos" ON public.wedding_photos;
CREATE POLICY "No direct access to photos"
ON public.wedding_photos
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

ALTER PUBLICATION supabase_realtime DROP TABLE public.wedding_photos;
