-- Create storage bucket for wedding photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-photos', 'wedding-photos', true);

-- Create table to track uploaded photos
CREATE TABLE public.wedding_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by TEXT
);

-- Enable RLS
ALTER TABLE public.wedding_photos ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view photos
CREATE POLICY "Anyone can view photos"
ON public.wedding_photos
FOR SELECT
USING (true);

-- Allow anyone to upload photos
CREATE POLICY "Anyone can upload photos"
ON public.wedding_photos
FOR INSERT
WITH CHECK (true);

-- Storage policies for the bucket
CREATE POLICY "Anyone can view wedding photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'wedding-photos');

CREATE POLICY "Anyone can upload wedding photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'wedding-photos');

-- Enable realtime for photos
ALTER PUBLICATION supabase_realtime ADD TABLE public.wedding_photos;