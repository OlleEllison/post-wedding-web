import React from 'react';
import { Heart } from 'lucide-react';

export const ThankYouSection: React.FC = () => {
  return (
    <section id="thankyou" className="py-10 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="font-lemon-milk font-normal text-[18px] md:text-[20px] text-primary">
              Ett stort tack
            </h2>
          </div>

          {/* Thank You Message */}
          <div className="text-center space-y-4 py-4 border-b border-border">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Heart className="text-primary" size={24} />
              </div>
            </div>
            <div className="space-y-4 max-w-2xl mx-auto">
              <p className="text-[10px] md:text-[12px] text-muted-foreground leading-relaxed">
                Kära vänner och familj,
              </p>
              <p className="text-[10px] md:text-[12px] text-muted-foreground leading-relaxed">
                Tack för att ni delade vår speciella dag med oss. Er närvaro, kärlek och glädje 
                gjorde vårt bröllop till en oförglömlig upplevelse som vi kommer att bära med oss 
                resten av livet.
              </p>
              <p className="text-[10px] md:text-[12px] text-muted-foreground leading-relaxed">
                Tack för alla fina presenter, hjärtliga ord och underbara minnen. Vi är så lyckliga 
                över att ha er i våra liv!
              </p>
              <p className="text-[10px] md:text-[12px] text-muted-foreground leading-relaxed font-medium">
                Med all vår kärlek,
                <br />
                Ellison & Olle
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
