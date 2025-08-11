import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { User } from '@supabase/supabase-js';
import { Calendar, UserIcon, Gamepad2 } from 'lucide-react';
import UserParties from './UserParties';
import UserGames from './UserGames';
import NicknameManager from './NicknameManager';
import BoredScreen from './BoredScreen';
import DotCircleGame from './DotCircleGame';
import ExploderGame from './ExploderGame';
import HayaNinja from './HayaNinja';

interface UserDashboardProps {
  user: User;
}

const UserDashboard = ({ user }: UserDashboardProps) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'parties' | 'nickname' | 'games' | 'color-changer' | 'dot-circle' | 'exploder' | 'haya-ninja'>('dashboard');
  const [nickname, setNickname] = useState<string>('');
  const [userQRCodes, setUserQRCodes] = useState<any[]>([]);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadUserQRCodes();
    loadUserProfile();
    
    // Set up polling to refresh QR codes every 30 seconds
    const interval = setInterval(() => {
      loadUserQRCodes();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setNickname(data.nickname || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadUserQRCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          parties (
            name,
            date,
            photo_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setUserQRCodes(data);
      }
    } catch (error) {
      console.error('Error loading user QR codes:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error && !error.message.includes('Session not found')) {
        console.error('Sign out error:', error);
        toast({
          title: "Warning",
          description: "Logged out locally, but server logout failed.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Signed out successfully!",
        });
      }
    } catch (error) {
      console.error('Sign out catch error:', error);
      toast({
        title: "Info", 
        description: "Logged out locally.",
      });
    }
  };

  // Handle different views
  if (currentView === 'parties') {
    return <UserParties user={user} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'nickname') {
    return <NicknameManager user={user} onBack={() => {
      setCurrentView('dashboard');
      loadUserProfile(); // Refresh nickname after returning
    }} />;
  }

  if (currentView === 'games') {
    return <UserGames onBack={() => setCurrentView('dashboard')} onGameSelect={(game) => setCurrentView(game as any)} />;
  }

  if (currentView === 'color-changer') {
    return <BoredScreen onBack={() => setCurrentView('games')} />;
  }

  if (currentView === 'dot-circle') {
    return <DotCircleGame onBack={() => setCurrentView('games')} adminId={user.id} adminNickname={nickname} />;
  }

  if (currentView === 'exploder') {
    return <ExploderGame onBack={() => setCurrentView('games')} scope="user" playerNickname={nickname} />;
  }

  if (currentView === 'haya-ninja') {
    return <HayaNinja onBack={() => setCurrentView('games')} scope="user" playerNickname={nickname} />;
  }

  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ 
        backgroundColor,
        color: isBackgroundDark ? '#ffffff' : '#000000'
      }}
    >
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 
            className="text-2xl font-bold"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            {nickname ? `Welcome back, ${nickname}!` : 'User Dashboard'}
          </h1>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <div className="grid gap-4">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setCurrentView('parties')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2">
                <Calendar className="h-12 w-12" />
              </div>
              <CardTitle>Parties</CardTitle>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setCurrentView('nickname')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2">
                <UserIcon className="h-12 w-12" />
              </div>
              <CardTitle>Choose Nickname</CardTitle>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setCurrentView('games')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2">
                <Gamepad2 className="h-12 w-12" />
              </div>
              <CardTitle>Games</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {userQRCodes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your QR Codes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userQRCodes.map((qrCode) => (
                <div 
                  key={qrCode.id} 
                  className="flex items-center gap-4 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setCurrentView('parties')}
                >
                  {qrCode.parties?.photo_url && (
                    <img 
                      src={qrCode.parties.photo_url} 
                      alt={qrCode.parties.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{qrCode.parties?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(qrCode.parties?.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {qrCode.is_scanned ? 'qr used' : 'qr generated but not scanned yet'}
                    </div>
                  </div>
                  {qrCode.is_scanned && (
                    <div className="text-green-600 text-sm">✓</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;