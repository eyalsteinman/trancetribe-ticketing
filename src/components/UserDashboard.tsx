import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { User } from '@supabase/supabase-js';
import { Calendar, UserIcon, Gamepad2, Crown, ShieldCheck, LogOut, Users, IdCard, Heart, Wine, Moon, Sun } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
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
import PersonalCode from './PersonalCode';
import FriendsCodes from './FriendsCodes';
import UserBarTab from './UserBarTab';
import { useDarkMode } from '@/hooks/useDarkMode';

interface UserDashboardProps {
  user: User;
}

const UserDashboard = ({ user }: UserDashboardProps) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'parties' | 'nickname' | 'games' | 'color-changer' | 'dot-circle' | 'exploder' | 'haya-ninja' | 'social' | 'vip' | 'vip-detail' | 'insurance' | 'personal-code' | 'friends-codes' | 'bar-tab'>('dashboard');
  const [nickname, setNickname] = useState<string>('');
  const [userQRCodes, setUserQRCodes] = useState<any[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<{id: string; name: string; logo_url: string | null; vip_description: string | null; vip_price: number | null} | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<any>(null);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

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
        // Remove duplicates by party_id - keep only the latest QR code per party
        const uniqueQRCodes = data.reduce((acc: any[], current: any) => {
          const existingIndex = acc.findIndex(qr => qr.party_id === current.party_id);
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // Keep the more recent one (or the approved one if exists)
            if (new Date(current.created_at) > new Date(acc[existingIndex].created_at) || 
                (current.is_approved && !acc[existingIndex].is_approved)) {
              acc[existingIndex] = current;
            }
          }
          return acc;
        }, []);
        setUserQRCodes(uniqueQRCodes);
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
        onSelectProduction={(production) => {
          setSelectedProduction(production);
          setCurrentView('vip-detail');
        }}
      />
    );
  }

  if (currentView === 'vip-detail' && selectedProduction !== null) {
    return (
      <VIPProduction
        user={user}
        production={selectedProduction}
        onBack={() => setCurrentView('vip')}
      />
    );
  }

  if (currentView === 'personal-code') {
    return <PersonalCode user={user} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'friends-codes') {
    return <FriendsCodes user={user} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'bar-tab') {
    return <UserBarTab userId={user.id} onBack={() => setCurrentView('dashboard')} />;
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
                icon: <Users className="h-12 w-12" />,
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
              {
                id: 'personal-code',
                title: 'Personal Code',
                icon: <IdCard className="h-12 w-12" />,
                onClick: () => setCurrentView('personal-code' as const),
              },
              {
                id: 'friends-codes',
                title: 'Friends Codes',
                icon: <Heart className="h-12 w-12" />,
                onClick: () => setCurrentView('friends-codes' as const),
              },
              {
                id: 'bar-tab',
                title: 'Bar Tab',
                icon: <Wine className="h-12 w-12" />,
                onClick: () => setCurrentView('bar-tab' as const),
              },
              {
                id: 'dark-mode',
                title: isDarkMode ? 'Light Mode' : 'Dark Mode',
                icon: isDarkMode ? <Sun className="h-12 w-12" /> : <Moon className="h-12 w-12" />,
                onClick: toggleDarkMode,
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
                  className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    // Store party ID and navigate to specific party
                    localStorage.setItem('selectedPartyId', qrCode.party_id);
                    setCurrentView('parties');
                  }}
                >
                  {/* Party Photo */}
                  {qrCode.parties?.photo_url && (
                    <img 
                      src={qrCode.parties.photo_url} 
                      alt={qrCode.parties.name}
                      className="w-full h-48 object-cover rounded"
                    />
                  )}
                  
                  {/* Party Info */}
                  <div>
                    <div className="font-semibold text-lg">{qrCode.parties?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(qrCode.parties?.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {qrCode.is_scanned ? 'qr used' : qrCode.is_approved ? 'qr approved! Enjoy the party!' : 'qr pending approval'}
                    </div>
                  </div>
                  
                  {/* QR Code Display for Approved */}
                  {qrCode.is_approved && !qrCode.is_scanned && (
                    <div 
                      className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded border cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Show QR code popup
                        setSelectedQRCode(qrCode);
                        setShowQRDialog(true);
                      }}
                    >
                      <div className="text-green-600 text-sm font-medium mb-2">✓ QR Code Ready</div>
                      <div className="text-xs text-muted-foreground">
                        Your QR code is approved and ready for use! Click here to view.
                      </div>
                    </div>
                  )}
                  
                  {qrCode.is_scanned && (
                    <div className="text-green-600 text-sm text-center font-medium">✓ Used</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        
        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Your QR Code</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              {selectedQRCode && (
                <>
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <QRCodeSVG value={selectedQRCode.code} size={200} />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">{selectedQRCode.parties?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedQRCode.parties?.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-green-600">✓ Approved - Show this QR code at the entrance</p>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center space-y-2">
          <h3 className="font-bold text-lg">Trance Tribes Tickets</h3>
          <p className="text-xs text-muted-foreground">
            Created by Eyal Steinman, all rights reserved 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;