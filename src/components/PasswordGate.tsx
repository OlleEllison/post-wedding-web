import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PasswordGateProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'wedding_site_access';

export const PasswordGate: React.FC<PasswordGateProps> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already unlocked
    const accessGranted = localStorage.getItem(STORAGE_KEY);
    if (accessGranted === 'true') {
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-password', {
        body: { password }
      });

      if (fnError) {
        console.error('Function error:', fnError);
        setError('Unable to verify password. Please try again.');
        setIsLoading(false);
        return;
      }

      if (data?.success) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsUnlocked(true);
        toast.success('Welcome to our wedding celebration!');
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Still checking localStorage
  if (isUnlocked === null) {
    return (
      <div className="min-h-screen min-h-[-webkit-fill-available] flex items-center justify-center bg-transparent">
        <div className="animate-pulse">
          <Heart className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  // Show password form
  if (!isUnlocked) {
    return (
      <div className="min-h-screen min-h-[-webkit-fill-available] flex items-center justify-center bg-transparent p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-serif text-foreground mb-2">
                Välkommen!
              </h1>
              <p className="text-muted-foreground">
                Vänligen ange lösenordet för att se bröllopssidan
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Ange lösenord..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center text-lg"
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-destructive text-sm text-center">
                  {error}
                </p>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? 'Verifierar...' : 'Gå in'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Lösenordet finns på bröllopsinbjudan
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <Heart className="w-6 h-6 text-primary/40 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Unlocked - show children
  return <>{children}</>;
};
