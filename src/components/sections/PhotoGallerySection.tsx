import React, { useState, useRef } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeddingPhotos } from '@/hooks/useWeddingPhotos';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const PhotoGallerySection: React.FC = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { allImages, isLoading } = useWeddingPhotos();
  const { toast } = useToast();

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
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

          {/* Photo Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allImages.map((image, index) => (
                <div 
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-lg shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-300"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                  {image.isUploaded && (
                    <div className="absolute top-2 right-2 bg-primary/80 text-primary-foreground text-[8px] px-2 py-1 rounded-full">
                      Nytt
                    </div>
                  )}
                </div>
              ))}
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
