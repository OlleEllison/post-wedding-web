-- Add posted_by column to track who posted each memory
ALTER TABLE public.wedding_memories ADD COLUMN IF NOT EXISTS posted_by TEXT;

-- Add RLS policy to allow users to delete their own memories
CREATE POLICY "Users can delete their own memories"
ON public.wedding_memories
FOR DELETE
USING (posted_by = current_setting('request.headers', true)::json->>'x-user-id');