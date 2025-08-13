import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { User } from '@supabase/supabase-js';
import { Calendar, UserIcon, Gamepad2, Crown, ShieldCheck, LogOut } from 'lucide-react';
import UserParties from './UserParties';
import UserGames from './UserGames';
import NicknameManager from './NicknameManager';
import BoredScreen from './BoredScreen';
import DotCircleGame from './DotCircleGame';
import ExploderGame from './ExploderGame';
import HayaNinja from './HayaNinja';
import SocialNetworks from './SocialNetworks';
import VIPHub from './VIP/VIPHub';
import VIPProduction from './VIP/VIPProduction';
import ReorderableTiles from './ReorderableTiles';
import Insurance from './Insurance';

interface UserDashboardProps {
  user: User;
}

const UserDashboard = ({ user }: UserDashboardProps) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'parties' | 'nickname' | 'games' | 'color-changer' | 'dot-circle' | 'exploder' | 'haya-ninja' | 'social' | 'vip' | 'vip-detail' | 'insurance'>('dashboard');
  const [nickname, setNickname] = useState<string>('');
  const [userQRCodes, setUserQRCodes] = useState<any[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<number | null>(null);
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

  if (currentView === 'social') {
    return <SocialNetworks userId={user.id} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'insurance') {
    return <Insurance onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'vip') {
    return (
      <VIPHub
        user={user}
        nickname={nickname}
        onBack={() => setCurrentView('dashboard')}
        onSelectProduction={(id) => {
          setSelectedProduction(id);
          setCurrentView('vip-detail');
        }}
      />
    );
  }

  if (currentView === 'vip-detail' && selectedProduction !== null) {
    return (
      <VIPProduction
        user={user}
        productionId={selectedProduction}
        onBack={() => setCurrentView('vip')}
      />
    );
  }

  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ 
        backgroundColor
      }}
    >
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 
            className="text-xl font-bold"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            {nickname ? `Welcome back, ${nickname}!` : 'User Dashboard'}
          </h1>
          <Button 
            variant="outline" 
            onClick={handleSignOut} 
            className="whitespace-nowrap on-color"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="space-y-4">
          {(() => {
            const items = [
              {
                id: 'parties',
                title: 'Parties',
                icon: <Calendar className="h-12 w-12" />,
                onClick: () => setCurrentView('parties' as const),
              },
              {
                id: 'nickname',
                title: 'Choose Nickname',
                icon: <UserIcon className="h-12 w-12" />,
                onClick: () => setCurrentView('nickname' as const),
              },
              {
                id: 'games',
                title: 'Games',
                icon: <Gamepad2 className="h-12 w-12" />,
                onClick: () => setCurrentView('games' as const),
              },
              {
                id: 'social',
                title: 'Social Networks',
                icon: <UserIcon className="h-12 w-12" />,
                onClick: () => setCurrentView('social' as const),
              },
              {
                id: 'insurance',
                title: 'Insurance',
                icon: <ShieldCheck className="h-12 w-12" />,
                onClick: () => setCurrentView('insurance' as const),
              },
              {
                id: 'vip',
                title: 'VIP',
                icon: <Crown className="h-12 w-12" />,
                onClick: () => setCurrentView('vip' as const),
              },
            ];
            return (
              <ReorderableTiles items={items} orderKey={`dashboard-order-user-${user.id}`} />
            );
          })()}
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