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
  uploaded_by: string | null;
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
    // PostgREST caps a single request at 1000 rows, so page through the table
    const PAGE_SIZE = 1000;
    const rows: WeddingPhoto[] = [];
    let from = 0;
    let error: unknown = null;

    // Safety cap: 20 000 photos
    while (from < 20000) {
      const { data, error: pageError } = await supabase
        .from('wedding_photos')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (pageError) {
        error = pageError;
        break;
      }
      if (!data || data.length === 0) break;
      rows.push(...(data as WeddingPhoto[]));
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    if (!error) {
      const photos = rows.map((photo: WeddingPhoto) => {
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
          canDelete: !!currentUserId && photo.uploaded_by === currentUserId,
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

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`wedding_photos_${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wedding_photos',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const photo = payload.new as WeddingPhoto;
            const { data: urlData } = supabase.storage
              .from('wedding-photos')
              .getPublicUrl(photo.file_path);
            
            setUploadedPhotos((prev) => [{
              id: photo.id,
              src: urlData.publicUrl,
              alt: photo.file_name,
              filePath: photo.file_path,
              isUploaded: true,
              isNew: true,
              canDelete: !!currentUserId && photo.uploaded_by === currentUserId,
            }, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as WeddingPhoto).id;
            setUploadedPhotos((prev) => prev.filter((p) => p.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
