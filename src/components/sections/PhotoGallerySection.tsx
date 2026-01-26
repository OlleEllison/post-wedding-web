import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, Upload, Loader2, Trash2, Download, Check, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeddingPhotos, getUserId } from '@/hooks/useWeddingPhotos';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const IMAGES_PER_PAGE = 100;
const MAX_COLUMNS = 10;

export const PhotoGallerySection: React.FC = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedForDownload, setSelectedForDownload] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { allImages, isLoading, deletePhoto } = useWeddingPhotos();
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
    if (isSelectMode) return; // Don't open lightbox in select mode
    const globalIndex = currentPage * IMAGES_PER_PAGE + index;
    setSelectedImageIndex(globalIndex);
  };

  const closeLightbox = useCallback(() => {
    setSelectedImageIndex(null);
  }, []);

  const toggleImageSelection = (globalIndex: number) => {
    setSelectedForDownload(prev => {
      const newSet = new Set(prev);
      if (newSet.has(globalIndex)) {
        newSet.delete(globalIndex);
      } else {
        newSet.add(globalIndex);
      }
      return newSet;
    });
  };

  const selectAllImages = () => {
    const allIndices = new Set(allImages.map((_, index) => index));
    setSelectedForDownload(allIndices);
  };

  const clearSelection = () => {
    setSelectedForDownload(new Set());
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedForDownload(new Set());
  };

  const downloadSelectedImages = async () => {
    if (selectedForDownload.size === 0) {
      toast({
        title: "Inga bilder valda",
        description: "Välj minst en bild att ladda ner.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);

    try {
      for (const index of selectedForDownload) {
        const image = allImages[index];
        if (!image) continue;

        // Fetch the image
        const response = await fetch(image.src);
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = image.alt || `wedding-photo-${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Small delay between downloads to prevent browser issues
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      toast({
        title: "Nedladdning klar! 📥",
        description: `${selectedForDownload.size} bild${selectedForDownload.size > 1 ? 'er' : ''} har laddats ner.`,
      });

      exitSelectMode();
    } catch (error) {
      toast({
        title: "Nedladdning misslyckades",
        description: "Något gick fel vid nedladdning av bilderna.",
        variant: "destructive",
      });
    }

    setIsDownloading(false);
  };

  const downloadAllImages = async () => {
    selectAllImages();
    // Wait for state to update, then download
    setTimeout(() => {
      downloadSelectedImages();
    }, 100);
  };

  const goToPrevious = useCallback(() => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex - 1 + allImages.length) % allImages.length);
  }, [selectedImageIndex, allImages.length]);

  const goToNext = useCallback(() => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex + 1) % allImages.length);
  }, [selectedImageIndex, allImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, closeLightbox, goToPrevious, goToNext]);


  const handleDeletePhoto = async (photoId: string, filePath: string) => {
    setIsDeleting(true);
    const { error } = await deletePhoto(photoId, filePath);
    if (error) {
      toast({
        title: "Kunde inte ta bort",
        description: "Något gick fel vid borttagning av bilden.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Borttagen",
        description: "Bilden har tagits bort.",
      });
      if (selectedImageIndex !== null && selectedImageIndex >= allImages.length - 1) {
        setSelectedImageIndex(Math.max(0, allImages.length - 2));
      }
    }
    setIsDeleting(false);
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

      // Save to database with user ID
      const userId = getUserId();
      const { error: dbError } = await supabase
        .from('wedding_photos')
        .insert([{ file_path: filePath, file_name: file.name, uploaded_by: userId }]);

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

          {/* Upload & Download Buttons */}
          <div className="text-center space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            
            {!isSelectMode ? (
              <div className="flex flex-wrap justify-center gap-3">
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
                
                {allImages.length > 0 && (
                  <Button
                    variant="outline"
                    className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setIsSelectMode(true)}
                  >
                    <Download className="mr-2" size={16} />
                    Ladda ner bilder
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    variant="outline"
                    className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={selectAllImages}
                  >
                    <CheckSquare className="mr-2" size={16} />
                    Välj alla ({allImages.length})
                  </Button>
                  
                  <Button
                    variant="default"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={downloadSelectedImages}
                    disabled={selectedForDownload.size === 0 || isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        Laddar ner...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2" size={16} />
                        Ladda ner ({selectedForDownload.size})
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={exitSelectMode}
                  >
                    <X className="mr-2" size={16} />
                    Avbryt
                  </Button>
                </div>
                
                <p className="text-[10px] text-primary font-medium">
                  Klicka på bilderna du vill ladda ner • {selectedForDownload.size} av {allImages.length} valda
                </p>
              </div>
            )}
            
            {!isSelectMode && (
              <p className="text-[10px] text-muted-foreground">
                Bilderna visas direkt på sidan efter uppladdning
              </p>
            )}
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
                {currentImages.map((image, index) => {
                  const globalIndex = currentPage * IMAGES_PER_PAGE + index;
                  const isSelected = selectedForDownload.has(globalIndex);
                  
                  return (
                    <div 
                      key={image.id || index}
                      className={`relative overflow-hidden rounded-sm cursor-pointer transform hover:scale-105 hover:z-10 transition-all duration-300 group ${
                        isSelectMode && isSelected ? 'ring-2 ring-primary ring-offset-1' : ''
                      }`}
                      onClick={() => {
                        if (isSelectMode) {
                          toggleImageSelection(globalIndex);
                        } else {
                          openLightbox(index);
                        }
                      }}
                    >
                      <img
                        src={image.src}
                        alt={image.alt}
                        className={`w-full h-full object-cover transition-opacity ${
                          isSelectMode && isSelected ? 'opacity-80' : ''
                        }`}
                      />
                      
                      {/* Selection indicator */}
                      {isSelectMode && (
                        <div className={`absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-white/80 border-2 border-primary/50'
                        }`}>
                          {isSelected && <Check size={12} />}
                        </div>
                      )}
                      
                      {image.isNew && !isSelectMode && (
                        <div className="absolute top-0.5 right-0.5 bg-primary/80 text-primary-foreground text-[6px] px-1 py-0.5 rounded-full">
                          Nytt
                        </div>
                      )}
                      {image.canDelete && !isSelectMode && (
                        <button
                          className="absolute bottom-1 right-1 bg-destructive/80 text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (image.id && image.filePath) {
                              handleDeletePhoto(image.id, image.filePath);
                            }
                          }}
                          disabled={isDeleting}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
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
          {selectedImageIndex !== null && allImages[selectedImageIndex] && (
            <div 
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={closeLightbox}
            >
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-primary transition-colors p-2 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
              >
                <ChevronLeft size={40} />
              </button>
              
              <div className="flex flex-col items-center gap-3 max-h-[95vh] relative" onClick={(e) => e.stopPropagation()}>
                <button
                  className="absolute -top-2 -right-2 text-white hover:text-primary transition-colors bg-black/50 rounded-full p-1 z-10"
                  onClick={closeLightbox}
                >
                  <X size={24} />
                </button>
                
                <img
                  src={allImages[selectedImageIndex].src}
                  alt={allImages[selectedImageIndex].alt}
                  className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg"
                />
                
                <div className="flex items-center gap-4">
                  <span className="text-white text-sm">
                    {selectedImageIndex + 1} / {allImages.length}
                  </span>
                  {allImages[selectedImageIndex]?.canDelete && (
                    <button
                      className="bg-destructive/80 text-destructive-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1 hover:bg-destructive transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        const img = allImages[selectedImageIndex];
                        if (img.id && img.filePath) {
                          handleDeletePhoto(img.id, img.filePath);
                          closeLightbox();
                        }
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 size={14} />
                      Ta bort
                    </button>
                  )}
                </div>
              </div>
              
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-primary transition-colors p-2 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
              >
                <ChevronRight size={40} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};