import React, { useState, useEffect, useRef } from 'react';
import { MessageCircleHeart, Send, Smile } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface Memory {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

export const MemoriesSection: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleEmojiSelect = (emoji: { native: string }) => {
    setMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  // Fetch existing memories
  useEffect(() => {
    const fetchMemories = async () => {
      const { data, error } = await supabase
        .from('wedding_memories')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data && !error) {
        setMemories(data);
      }
    };

    fetchMemories();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('wedding_memories')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wedding_memories',
        },
        (payload) => {
          setMemories((prev) => [payload.new as Memory, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !message.trim()) {
      toast({
        title: "Fyll i alla fält",
        description: "Ange både ditt namn och ett meddelande.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('wedding_memories')
      .insert([{ name: name.trim(), message: message.trim() }]);

    if (error) {
      toast({
        title: "Något gick fel",
        description: "Kunde inte skicka ditt meddelande. Försök igen.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Tack! 💕",
        description: "Ditt minne har sparats.",
      });
      setName('');
      setMessage('');
    }

    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <section id="memories" className="py-10 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto space-y-6">
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

          {/* Memory Form */}
          <Card className="shadow-lg border border-primary/20 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Ditt namn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white"
                  maxLength={50}
                />
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Skriv ditt minne här..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-white min-h-[100px] pr-12"
                    maxLength={280}
                  />
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Smile size={20} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none" align="end">
                      <Picker
                        data={data}
                        onEmojiSelect={handleEmojiSelect}
                        theme="light"
                        locale="sv"
                        previewPosition="none"
                        skinTonePosition="none"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    <Send size={16} />
                    Dela minne
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Memories Feed */}
          {memories.length > 0 && (
            <div className="space-y-3">
              {memories.map((memory) => (
                <Card 
                  key={memory.id} 
                  className="bg-white/90 backdrop-blur-sm border border-primary/10 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-medium text-sm text-foreground">
                        {memory.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {formatDate(memory.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">
                      {memory.message}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

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
