import React from 'react';
import { WeddingRings } from './WeddingRings';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeSection, onSectionChange }) => {
  const handleMenuClick = (sectionId: string) => {
    onSectionChange(sectionId);

    // Smooth scroll to section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Fixed Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="w-full px-4 h-16 flex items-center justify-between">
          {/* Logo - Left edge */}
          <button 
            onClick={() => handleMenuClick('home')}
            className="flex items-center"
          >
            <WeddingRings size={48} />
          </button>

        </div>
      </nav>

    </>
  );
};
