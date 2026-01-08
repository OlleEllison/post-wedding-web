import React from 'react';
import { MessageCircleHeart } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const MemoriesSection: React.FC = () => {
  return (
    <section id="memories" className="py-10 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Section Header */}
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageCircleHeart className="text-primary" size={24} />
              </div>
            </div>
            <h3 className="font-lemon-milk font-normal text-[14px] md:text-[16px] text-black">
              Dela ditt bästa minne
            </h3>
            <p className="text-[10px] md:text-[12px] text-muted-foreground">
              Vad var ditt favorit-ögonblick från bröllopet? Dela med dig av ditt bästa minne!
            </p>
          </div>

          {/* Google Form for memories */}
          <Card className="shadow-xl border-2 border-primary/20 bg-transparent backdrop-blur-sm">
            <CardHeader className="text-center">
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-hidden rounded-b-lg">
                <iframe 
                  src="https://docs.google.com/forms/d/e/1FAIpQLSd5Y4KYiEhpU6DQdiQkMRiOBaEIWIpWDi2pShID5nE7YJpfJA/viewform?embedded=true" 
                  className="w-full h-[500px] md:h-[600px] border-0"
                  title="Memory Sharing Form"
                >
                  Laddar formulär...
                </iframe>
              </div>
            </CardContent>
          </Card>

          {/* Closing message */}
          <div className="text-center pt-8 pb-16">
            <p className="font-lemon-milk font-normal text-[18px] md:text-[20px] text-primary">
              Tack för allt! 💕
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
