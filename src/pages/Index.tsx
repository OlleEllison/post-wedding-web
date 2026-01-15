import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/sections/HeroSection';
import { ThankYouSection } from '@/components/sections/ThankYouSection';
import { PhotoGallerySection } from '@/components/sections/PhotoGallerySection';
import { MemoriesSection } from '@/components/sections/MemoriesSection';
import { PasswordGate } from '@/components/PasswordGate';

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');

  // Handle scroll to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'thankyou', 'photos', 'memories'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <PasswordGate>
      <div className="min-h-screen bg-transparent relative">
        <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <main className="pt-16 relative z-10" style={{ transform: 'translateZ(0)' }}>
          <HeroSection />
          <ThankYouSection />
          <PhotoGallerySection />
          <MemoriesSection />
        </main>
      </div>
    </PasswordGate>
  );
};

export default Index;
