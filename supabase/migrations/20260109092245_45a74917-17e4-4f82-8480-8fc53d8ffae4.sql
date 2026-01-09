-- Create wedding_memories table for guest messages
CREATE TABLE public.wedding_memories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wedding_memories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view memories (public wedding site)
CREATE POLICY "Anyone can view memories" 
ON public.wedding_memories 
FOR SELECT 
USING (true);

-- Allow anyone to insert memories (guests don't need accounts)
CREATE POLICY "Anyone can add memories" 
ON public.wedding_memories 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.wedding_memories;