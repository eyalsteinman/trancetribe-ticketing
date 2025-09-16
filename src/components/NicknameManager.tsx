import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import PageHeader from '@/components/ui/page-header';
import { useBackground } from '@/contexts/BackgroundContext';
import { useBackNavigation } from '@/hooks/useBackNavigation';

interface NicknameManagerProps {
  user: User;
  onBack: () => void;
}

const NicknameManager = ({ user, onBack }: NicknameManagerProps) => {
  const [nickname, setNickname] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  useBackNavigation({
    onBackNavigation: onBack,
    isActive: true
  });
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
      <PageHeader
        title="My Info"
        onBack={onBack}
      />
      
      <div className="w-full pt-20 space-y-6 text-left px-4">

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