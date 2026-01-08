import React, { useState, useEffect } from 'react';
import { WeddingRings } from '../WeddingRings';
import { useIsMobile } from '@/hooks/use-mobile';

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
  gallery1, gallery2, gallery3, gallery4, gallery5,
  gallery6, gallery7, gallery8, gallery9, gallery10,
  gallery11, gallery12
];

export const HeroSection: React.FC = () => {
  const isMobile = useIsMobile();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

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

          {/* Couple Image Gallery with Speech Bubbles */}
          <div className="relative flex justify-center items-center mt-8 md:mt-16 mb-12">
            {/* Left Speech Bubble */}
            <div className={`absolute z-10 transform -rotate-12 ${isMobile ? 'left-2 -top-8 scale-100' : 'left-56 -top-12 scale-150'}`}>
              <div className="bg-white border-2 border-primary rounded-lg px-6 py-3 relative shadow-lg">
                <p className="font-lemon-milk italic font-light text-[8px] text-primary whitespace-nowrap">Vi gjorde det!</p>
                <div className="absolute bottom-[-8px] right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
                <div className="absolute bottom-[-10px] right-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-primary"></div>
              </div>
            </div>

            {/* Rotating Gallery */}
            <div className="relative w-64 md:w-80 h-80 md:h-96 rounded-lg shadow-xl overflow-hidden">
              {galleryImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Ellison och Olle ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
            </div>

            {/* Right Speech Bubble */}
            <div className={`absolute z-10 transform rotate-12 ${isMobile ? 'right-2 -top-8 scale-100' : 'right-56 -top-12 scale-150'}`}>
              <div className="bg-white border-2 border-primary rounded-lg px-6 py-3 relative shadow-lg">
                <p className="font-lemon-milk italic font-light text-[8px] text-primary whitespace-nowrap">Tack! 💕</p>
                <div className="absolute bottom-[-8px] left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
                <div className="absolute bottom-[-10px] left-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-primary"></div>
              </div>
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
