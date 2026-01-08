import React, { useState } from 'react';
import { Menu, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeddingRings } from './WeddingRings';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeSection, onSectionChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Start', icon: Heart },
    { id: 'thankyou', label: 'Tack', icon: Heart },
    { id: 'photos', label: 'Bilder', icon: Heart },
    { id: 'upload', label: 'Ladda upp', icon: Heart },
    { id: 'memories', label: 'Minnen', icon: Heart },
  ];

  const handleMenuClick = (sectionId: string) => {
    onSectionChange(sectionId);
    setIsOpen(false);
    
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

          {/* Menu Button - Right edge */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2"
          >
            {isOpen ? <X size={32} /> : <Menu size={32} />}
          </Button>
        </div>
      </nav>

      {/* Menu Overlay - All screen sizes */}
      {isOpen && (
        <div className="fixed inset-0 z-40">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="fixed top-16 left-0 right-0 bg-card border-b border-border">
            <div className="p-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-md transition-colors flex items-center space-x-3 ${
                    activeSection === item.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
