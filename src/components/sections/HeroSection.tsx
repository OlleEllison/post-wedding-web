import React, { useState, useEffect, useMemo } from 'react';
import { WeddingRings } from '../WeddingRings';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWeddingPhotos } from '@/hooks/useWeddingPhotos';

export const HeroSection: React.FC = () => {
  const isMobile = useIsMobile();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { allImages: sourceImages } = useWeddingPhotos();
  // Keep only a small rotating set in the DOM so the hero stays fast
  // even when thousands of photos have been uploaded.
  const MAX_HERO_IMAGES = 20;
  // Rotate through a random sample of the published gallery (uploaded photos
  // first, then the static ones), keeping the DOM small.
  const allImages = useMemo(() => {
    if (sourceImages.length <= MAX_HERO_IMAGES) return sourceImages;
    const pool = [...sourceImages];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, MAX_HERO_IMAGES);
  }, [sourceImages]);


  // Reset index if it exceeds the current array length (e.g., after image deletion)
  useEffect(() => {
    if (currentImageIndex >= allImages.length && allImages.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [allImages.length, currentImageIndex]);

  useEffect(() => {
    if (allImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [allImages.length]);

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden">
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Wedding Rings */}
          <div className="flex justify-center">
            <WeddingRings size={120} className="animate-pulse" />
          </div>

          {/* Main Message */}
          <div className="space-y-4">
            <h1 className="font-lemon-milk font-normal text-[24px] md:text-[36px] text-primary">
              Tack för att ni firade med oss!
            </h1>
            <p className="text-[12px] md:text-[14px] text-muted-foreground">
              15 Augusti 2026 • Väddö
            </p>
          </div>

          {/* Desktop-only spacer */}
          <div className="hidden md:block h-4"></div>

          {/* Couple Image Gallery */}
          <div className="relative flex justify-center items-center mt-8 md:mt-16 mb-12">
            {/* Rotating Gallery */}
            <div className="relative w-64 md:w-80 h-80 md:h-96 rounded-lg shadow-xl overflow-hidden">
              {allImages.length > 0 ? (
                allImages.map((image, index) => {
                  const nextIndex = (currentImageIndex + 1) % allImages.length;
                  // Only keep the visible image and the next one in the DOM so
                  // the hero never downloads the whole rotation up front.
                  if (index !== currentImageIndex && index !== nextIndex) return null;
                  return (
                    <img
                      key={index}
                      src={image.previewSrc || image.src}
                      alt={image.alt}
                      loading={index === currentImageIndex ? 'eager' : 'lazy'}
                      decoding="async"
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                        index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  );
                })

              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Laddar bilder...</p>
                </div>
              )}
            </div>
          </div>

          {/* Married Badge */}
          <div className="flex justify-center mb-12">
            <div className="bg-secondary text-white rounded-full px-8 py-4 shadow-lg inline-flex items-center gap-4">
              <p className="text-2xl md:text-3xl font-lemon-milk font-normal">Nu är vi gifta! 💍</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
