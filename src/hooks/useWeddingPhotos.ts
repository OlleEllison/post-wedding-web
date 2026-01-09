import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Static gallery images (fallback)
import gallery1 from '@/assets/gallery/gallery-1.jpeg';
import gallery2 from '@/assets/gallery/gallery-2.jpeg';
import gallery3 from '@/assets/gallery/gallery-3.jpeg';
import gallery4 from '@/assets/gallery/gallery-4.jpeg';
import gallery5 from '@/assets/gallery/gallery-5.jpeg';
import gallery6 from '@/assets/gallery/gallery-6.jpeg';
import gallery7 from '@/assets/gallery/gallery-7.jpeg';
import gallery8 from '@/assets/gallery/gallery-8.jpeg';
import gallery9 from '@/assets/gallery/gallery-9.jpeg';
import gallery10 from '@/assets/gallery/gallery-10.jpeg';
import gallery11 from '@/assets/gallery/gallery-11.jpeg';
import gallery12 from '@/assets/gallery/gallery-12.jpeg';

const staticImages = [
  { src: gallery1, alt: 'Bröllopsbild 1' },
  { src: gallery2, alt: 'Bröllopsbild 2' },
  { src: gallery3, alt: 'Bröllopsbild 3' },
  { src: gallery4, alt: 'Bröllopsbild 4' },
  { src: gallery5, alt: 'Bröllopsbild 5' },
  { src: gallery6, alt: 'Bröllopsbild 6' },
  { src: gallery7, alt: 'Bröllopsbild 7' },
  { src: gallery8, alt: 'Bröllopsbild 8' },
  { src: gallery9, alt: 'Bröllopsbild 9' },
  { src: gallery10, alt: 'Bröllopsbild 10' },
  { src: gallery11, alt: 'Bröllopsbild 11' },
  { src: gallery12, alt: 'Bröllopsbild 12' },
];

interface WeddingPhoto {
  id: string;
  file_path: string;
  file_name: string;
  created_at: string;
}

export interface GalleryImage {
  src: string;
  alt: string;
  isUploaded?: boolean;
  isNew?: boolean;
}

const isWithin24Hours = (dateString: string): boolean => {
  const uploadDate = new Date(dateString);
  const now = new Date();
  const hoursDiff = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff < 24;
};

export function useWeddingPhotos() {
  const [uploadedPhotos, setUploadedPhotos] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('wedding_photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      const photos = data.map((photo: WeddingPhoto) => {
        const { data: urlData } = supabase.storage
          .from('wedding-photos')
          .getPublicUrl(photo.file_path);
        
        return {
          src: urlData.publicUrl,
          alt: photo.file_name,
          isUploaded: true,
          isNew: isWithin24Hours(photo.created_at),
        };
      });
      setUploadedPhotos(photos);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPhotos();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('wedding_photos')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wedding_photos',
        },
        (payload) => {
          const photo = payload.new as WeddingPhoto;
          const { data: urlData } = supabase.storage
            .from('wedding-photos')
            .getPublicUrl(photo.file_path);
          
          setUploadedPhotos((prev) => [{
            src: urlData.publicUrl,
            alt: photo.file_name,
            isUploaded: true,
            isNew: true,
          }, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Combine uploaded photos with static images
  const allImages: GalleryImage[] = [...uploadedPhotos, ...staticImages];

  return { 
    allImages, 
    uploadedPhotos, 
    staticImages, 
    isLoading,
    refetch: fetchPhotos 
  };
}
