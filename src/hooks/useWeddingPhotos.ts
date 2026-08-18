import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { callGuestApi, getGuestId } from '@/lib/guestSession';

// No bundled/static gallery images — the gallery only shows uploaded photos.
const staticImages: GalleryImage[] = [];


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
