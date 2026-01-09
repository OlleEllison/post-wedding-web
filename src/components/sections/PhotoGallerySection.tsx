import React, { useState, useRef, useMemo } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeddingPhotos } from '@/hooks/useWeddingPhotos';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const IMAGES_PER_PAGE = 100;
const MAX_COLUMNS = 10;

export const PhotoGallerySection: React.FC = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { allImages, isLoading } = useWeddingPhotos();
  const { toast } = useToast();

  const totalPages = Math.ceil(allImages.length / IMAGES_PER_PAGE);
  const currentImages = useMemo(() => {
    const start = currentPage * IMAGES_PER_PAGE;
    return allImages.slice(start, start + IMAGES_PER_PAGE);
  }, [allImages, currentPage]);

  // Calculate grid columns based on image count (max 10x10)
  const gridColumns = useMemo(() => {
    const count = currentImages.length;
    if (count <= 1) return 1;
    if (count <= 4) return 2;
    if (count <= 9) return 3;
    if (count <= 16) return 4;
    if (count <= 25) return 5;
    if (count <= 36) return 6;
    if (count <= 49) return 7;
    if (count <= 64) return 8;
    if (count <= 81) return 9;
    return MAX_COLUMNS;
  }, [currentImages.length]);

  const openLightbox = (index: number) => {
    const globalIndex = currentPage * IMAGES_PER_PAGE + index;
    setSelectedImageIndex(globalIndex);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
    document.body.style.overflow = 'auto';
  };

  const goToPrevious = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex - 1 + allImages.length) % allImages.length);
  };

  const goToNext = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex + 1) % allImages.length);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ogiltig filtyp",
          description: `${file.name} är inte en bild.`,
          variant: "destructive",
        });
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Filen är för stor",
          description: `${file.name} är större än 10MB.`,
          variant: "destructive",
        });
        continue;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('wedding-photos')
        .upload(filePath, file);

      if (uploadError) {
        toast({
          title: "Uppladdning misslyckades",
          description: `Kunde inte ladda upp ${file.name}.`,
          variant: "destructive",
        });
        continue;
      }

      // Save to database
      const { error: dbError } = await supabase
        .from('wedding_photos')
        .insert([{ file_path: filePath, file_name: file.name }]);

      if (dbError) {
        toast({
          title: "Något gick fel",
          description: "Bilden laddades upp men kunde inte sparas.",
          variant: "destructive",
        });
      }
    }

    toast({
      title: "Tack! 📸",
      description: "Dina bilder har laddats upp!",
    });

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section id="photos" className="py-10 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Camera className="text-primary" size={24} />
              </div>
            </div>
            <h2 className="font-lemon-milk font-normal text-[18px] md:text-[20px] text-primary">
              Bilder från dagen
            </h2>
            <p className="text-[10px] md:text-[12px] text-muted-foreground max-w-md mx-auto">
              Har du bilder från bröllopet? Ladda upp dem här så samlar vi alla minnen på ett ställe!
            </p>
          </div>

          {/* Upload Button */}
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Laddar upp...
                </>
              ) : (
                <>
                  <Upload className="mr-2" size={16} />
                  Ladda upp bilder
                </>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground mt-2">
              Bilderna visas direkt på sidan efter uppladdning
            </p>
          </div>

          {/* Photo Grid - Fixed size container */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <div className="w-full aspect-square max-w-4xl mx-auto">
              <div 
                className="w-full h-full grid gap-1"
                style={{ 
                  gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                  gridTemplateRows: `repeat(${gridColumns}, 1fr)`
                }}
              >
                {currentImages.map((image, index) => (
                  <div 
                    key={index}
                    className="relative overflow-hidden rounded-sm cursor-pointer transform hover:scale-105 hover:z-10 transition-transform duration-300"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                    {image.isNew && (
                      <div className="absolute top-0.5 right-0.5 bg-primary/80 text-primary-foreground text-[6px] px-1 py-0.5 rounded-full">
                        Nytt
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="text-primary border-primary"
              >
                <ChevronLeft size={16} />
                Föregående
              </Button>
              <span className="text-sm text-muted-foreground">
                Sida {currentPage + 1} av {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="text-primary border-primary"
              >
                Nästa
                <ChevronRight size={16} />
              </Button>
            </div>
          )}

          {/* Lightbox */}
          {selectedImageIndex !== null && (
            <div 
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
              onClick={closeLightbox}
            >
              <button
                className="absolute top-4 right-4 text-white hover:text-primary transition-colors"
                onClick={closeLightbox}
              >
                <X size={32} />
              </button>
              
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-primary transition-colors p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
              >
                <ChevronLeft size={40} />
              </button>
              
              <img
                src={allImages[selectedImageIndex].src}
                alt={allImages[selectedImageIndex].alt}
                className="max-w-[90vw] max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-primary transition-colors p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
              >
                <ChevronRight size={40} />
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                {selectedImageIndex + 1} / {allImages.length}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};