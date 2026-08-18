import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { callGuestApi, getGuestId } from '@/lib/guestSession';

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
  canDelete: boolean;
}

export interface GalleryImage {
  id?: string;
  src: string;
  alt: string;
  filePath?: string;
  isUploaded?: boolean;
  isNew?: boolean;
  canDelete?: boolean;
}

// The guest id comes from the server-signed session token issued at login.
// It is used for UI hints only; the server re-derives it for every write.
export const getUserId = (): string | null => getGuestId();

const isWithin24Hours = (dateString: string): boolean => {
  const uploadDate = new Date(dateString);
  const now = new Date();
  const hoursDiff = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff < 24;
};

export function useWeddingPhotos() {
  const [uploadedPhotos, setUploadedPhotos] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserId = getGuestId();

  const fetchPhotos = async () => {
    // Photo records are only readable through the guest-content edge function,
    // which verifies the signed session token and derives ownership server-side.
    const { data } = await callGuestApi<{ photos: WeddingPhoto[] }>(
      'list_photos',
    );

    if (data?.photos) {
      const photos = data.photos.map((photo) => {
        const { data: urlData } = supabase.storage
          .from('wedding-photos')
          .getPublicUrl(photo.file_path);

        return {
          id: photo.id,
          src: urlData.publicUrl,
          alt: photo.file_name,
          filePath: photo.file_path,
          isUploaded: true,
          isNew: isWithin24Hours(photo.created_at),
          canDelete: photo.canDelete,
        };
      });
      setUploadedPhotos(photos);
    }
    setIsLoading(false);
  };

  // Deletion (storage file + database row) is performed server-side after the
  // edge function verifies ownership from the signed session token.
  const deletePhoto = async (photoId: string, _filePath: string) => {
    const { error } = await callGuestApi('delete_photo', { id: photoId });

    if (!error) {
      setUploadedPhotos((prev) => prev.filter((p) => p.id !== photoId));
    }

    return { error };
  };

  useEffect(() => {
    fetchPhotos();
    // Realtime needs public table reads, so poll instead.
    const interval = setInterval(fetchPhotos, 30000);
    return () => clearInterval(interval);
  }, [currentUserId]);


  // Combine uploaded photos with static images
  const allImages: GalleryImage[] = [...uploadedPhotos, ...staticImages];

  return { 
    allImages, 
    uploadedPhotos, 
    staticImages, 
    isLoading,
    refetch: fetchPhotos,
    deletePhoto,
  };
}
