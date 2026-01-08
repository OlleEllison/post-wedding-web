import React from 'react';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const UploadSection: React.FC = () => {
  return (
    <section id="upload" className="py-10 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Section Header */}
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="text-primary" size={24} />
              </div>
            </div>
            <h3 className="font-lemon-milk font-normal text-[14px] md:text-[16px] text-black">
              Dela dina bilder
            </h3>
            <p className="text-[10px] md:text-[12px] text-muted-foreground">
              Har du bilder från bröllopet? Ladda upp dem här så samlar vi alla minnen på ett ställe!
            </p>
          </div>

          {/* Google Form for uploads */}
          <Card className="shadow-xl border-2 border-primary/20 bg-transparent backdrop-blur-sm">
            <CardHeader className="text-center">
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-hidden rounded-b-lg">
                <iframe 
                  src="YOUR_PHOTO_UPLOAD_FORM_URL_HERE" 
                  className="w-full h-[600px] md:h-[700px] border-0"
                  title="Photo Upload Form"
                >
                  Laddar formulär...
                </iframe>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
