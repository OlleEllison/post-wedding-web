-- Add UPDATE policy to wedding_photos table to prevent unauthorized modifications
CREATE POLICY "Users can update their own photos"
ON public.wedding_photos
FOR UPDATE
USING (uploaded_by = ((current_setting('request.headers'::text, true))::json ->> 'x-user-id'::text))
WITH CHECK (uploaded_by = ((current_setting('request.headers'::text, true))::json ->> 'x-user-id'::text));