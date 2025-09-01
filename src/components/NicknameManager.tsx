import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { ArrowLeft } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';

interface NicknameManagerProps {
  user: User;
  onBack: () => void;
}

const NicknameManager = ({ user, onBack }: NicknameManagerProps) => {
  const [nickname, setNickname] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setNickname(data.nickname || '');
        setNicknameInput(data.nickname || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveNickname = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: nicknameInput })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving nickname:', error);
        toast({
          title: "Error",
          description: "Failed to save nickname",
          variant: "destructive"
        });
      } else {
        setNickname(nicknameInput);
        toast({
          title: "Success",
          description: "Nickname saved successfully!",
        });
      }
    } catch (error) {
      console.error('Error saving nickname:', error);
      toast({
        title: "Error",
        description: "Failed to save nickname",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
  <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ 
        backgroundColor
      }}
    >
      <div className="max-w-md mx-auto space-y-6 text-left">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 
            className="text-xl font-bold"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Personalize and Edit
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Nickname</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Nickname:</label>
              <p className="text-lg">{nickname || 'No nickname set'}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">New Nickname:</label>
              <Input
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Enter your nickname"
              />
            </div>
            
            <Button
              onClick={saveNickname}
              disabled={loading || !nicknameInput.trim()}
              className="w-full"
            >
              {loading ? "Saving..." : "Save Nickname"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NicknameManager;