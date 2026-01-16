-- Add UPDATE policy to wedding_memories table that denies all updates
-- Since the UI doesn't support editing memories, we deny all updates to prevent vandalism
CREATE POLICY "Memories cannot be updated"
ON public.wedding_memories FOR UPDATE
USING (false);