import React, { useState, useEffect } from 'react';
import { WeddingRings } from '../WeddingRings';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWeddingPhotos } from '@/hooks/useWeddingPhotos';

export const HeroSection: React.FC = () => {
  const isMobile = useIsMobile();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { allImages } = useWeddingPhotos();

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
                allImages.map((image, index) => (
                  <img
                    key={index}
                    src={image.src}
                    alt={image.alt}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                      index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))
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
