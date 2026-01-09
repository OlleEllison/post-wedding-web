-- Add RLS policy to allow users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON public.wedding_photos
FOR DELETE
USING (uploaded_by = current_setting('request.headers', true)::json->>'x-user-id');