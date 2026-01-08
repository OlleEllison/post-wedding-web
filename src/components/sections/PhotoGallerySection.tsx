import React, { useState } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Gallery images
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

const galleryImages = [
  { src: gallery1, alt: 'Bröllopsbildr 1' },
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

export const PhotoGallerySection: React.FC = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

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
    setSelectedImageIndex((selectedImageIndex - 1 + galleryImages.length) % galleryImages.length);
  };

  const goToNext = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex + 1) % galleryImages.length);
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
            <p className="text-[10px] md:text-[12px] text-muted-foreground">
              Klicka på en bild för att förstora
            </p>
          </div>

          {/* Upload Button */}
          <div className="text-center">
            <Button 
              variant="outline" 
              className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => {
                // This will be connected to the upload form section
                const element = document.getElementById('upload');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <Upload className="mr-2" size={16} />
              Ladda upp dina bilder
            </Button>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
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
              </div>
            ))}
          </div>

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
                src={galleryImages[selectedImageIndex].src}
                alt={galleryImages[selectedImageIndex].alt}
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
                {selectedImageIndex + 1} / {galleryImages.length}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
