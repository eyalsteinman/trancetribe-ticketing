import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { User } from '@supabase/supabase-js';
import { ArrowLeft, Copy } from 'lucide-react';
import Footer from '@/components/ui/footer';

interface PersonalCodeProps {
  user: User;
  onBack: () => void;
}

const PersonalCode = ({ user, onBack }: PersonalCodeProps) => {
  const [personalCode, setPersonalCode] = useState<string>('');
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadPersonalCode();
  }, []);

  const loadPersonalCode = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('personal_code')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setPersonalCode(data.personal_code || '');
      }
    } catch (error) {
      console.error('Error loading personal code:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(personalCode);
      toast({
        title: "Copied!",
        description: "Personal code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive"
      });
    }
  };

  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ backgroundColor }}
    >
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 
            className="text-xl font-bold"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Personal Code
          </h1>
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="whitespace-nowrap on-color"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="text-center space-y-4">
          <h2 
            className="text-lg"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Your personal code
          </h2>

          <Card className="cursor-pointer hover:bg-accent/10 transition-colors" onClick={copyToClipboard}>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-foreground mb-2">
                {personalCode}
              </div>
              <div className="text-foreground text-sm flex items-center justify-center gap-2">
                <Copy className="h-4 w-4" />
                Press number to copy
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default PersonalCode;