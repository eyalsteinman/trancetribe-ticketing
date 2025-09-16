import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { User } from '@supabase/supabase-js';
import { Calendar, UserIcon, Gamepad2, Crown, ShieldCheck, LogOut, Users, IdCard, Heart, Wine, Moon, Sun, MessageCircle, ArrowLeft, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import Footer from '@/components/ui/footer';
import UserParties from './UserParties';
import UserGames from './UserGames';
import PersonalizeEdit from './PersonalizeEdit';
import BoredScreen from './BoredScreen';
import DotCircleGame from './DotCircleGame';
import ExploderGame from './ExploderGame';
import HayaNinja from './HayaNinja';
import SocialNetworks from './SocialNetworks';
import VIPHub from './VIP/VIPHub';
import VIPProduction from './VIP/VIPProduction';
import ReorderableTiles from './ReorderableTiles';
import ReorderableTilesLogic from './ReorderableTilesLogic';
import Insurance from './Insurance';
import PersonalCode from './PersonalCode';
import FriendsCodes from './FriendsCodes';
import UserBarTab from './UserBarTab';
import FAQContact from './FAQContact';
import UserMessages from './UserMessages';
import UserMessaging from './UserMessaging';
import { useTheme } from '@/hooks/useDarkMode';
import PageHeader from './ui/page-header';

interface UserDashboardProps {
  user: User;
}

const UserDashboard = ({ user }: UserDashboardProps) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'parties' | 'nickname' | 'games' | 'color-changer' | 'dot-circle' | 'exploder' | 'haya-ninja' | 'social' | 'vip' | 'vip-detail' | 'insurance' | 'personal-code' | 'friends-codes' | 'bar-tab' | 'faq' | 'messages' | 'tribes' | 'direct-messages'>('dashboard');
  const [nickname, setNickname] = useState<string>('');
  const [userQRCodes, setUserQRCodes] = useState<any[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<{id: string; name: string; logo_url: string | null; vip_description: string | null; vip_price: number | null} | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<any>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadDirectMessageCount, setUnreadDirectMessageCount] = useState(0);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();
  const { currentTheme, cycleTheme, getThemeDisplayName } = useTheme();

  useEffect(() => {
    loadUserQRCodes();
    loadUserProfile();
    loadUnreadMessageCount();
    loadUnreadDirectMessageCount();
    
    // Set up polling to refresh QR codes and messages every 30 seconds
    const interval = setInterval(() => {
      loadUserQRCodes();
      loadUnreadMessageCount();
      loadUnreadDirectMessageCount();
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

  const loadUnreadMessageCount = async () => {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error loading unread message count:', error);
      } else {
        setUnreadMessageCount(count || 0);
      }
    } catch (error) {
      console.error('Error loading unread message count:', error);
    }
  };

  const loadUnreadDirectMessageCount = async () => {
    try {
      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error loading unread direct message count:', error);
      } else {
        setUnreadDirectMessageCount(count || 0);
      }
    } catch (error) {
      console.error('Error loading unread direct message count:', error);
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
    return <PersonalizeEdit user={user} onBack={() => {
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

  if (currentView === 'faq') {
    return <FAQContact user={user} onBack={() => setCurrentView('dashboard')} isAdmin={false} />;
  }

  if (currentView === 'messages') {
    return <UserMessages onBack={() => {
      setCurrentView('dashboard');
      loadUnreadMessageCount(); // Refresh unread count when returning
    }} userId={user.id} onOpenTribes={() => setCurrentView('tribes')} />;
  }

  if (currentView === 'tribes') {
    const UserTribes = React.lazy(() => import('./UserTribes'));
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-background p-4"><div className="text-center">Loading...</div></div>}>
        <UserTribes onBack={() => setCurrentView('dashboard')} userId={user.id} />
      </React.Suspense>
    );
  }

  if (currentView === 'direct-messages') {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-background p-4"><div className="text-center">Loading...</div></div>}>
        <UserMessaging onBack={() => setCurrentView('dashboard')} userId={user.id} />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-mesh overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 animate-pulse-slow"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-primary/30 to-transparent rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-accent/30 to-transparent rounded-full blur-3xl animate-float-delayed"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping opacity-40"></div>
        <div className="absolute top-3/4 left-3/4 w-1 h-1 bg-accent rounded-full animate-ping opacity-60 delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-secondary rounded-full animate-ping opacity-50 delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen p-4 sm:p-6 max-w-sm mx-auto">
        {/* Modern Header */}
        <div className="relative mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                {nickname ? `Welcome back,` : 'Dashboard'}
              </h1>
              {nickname && (
                <p className="text-sm sm:text-base text-primary font-medium">{nickname}!</p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={async () => {
                await handleSignOut();
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }} 
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-glass backdrop-blur-xl border border-white/20 hover:bg-white/10 hover:border-primary/50 transition-all duration-300"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="w-full">
          {(() => {
            const items = [
              {
                id: 'parties',
                title: 'Events\n& Parties',
                icon: <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />,
                onClick: () => setCurrentView('parties' as const),
              },
              {
                id: 'nickname',
                title: 'My Info',
                icon: <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />,
                onClick: () => setCurrentView('nickname' as const),
              },
              {
                id: 'social',
                title: 'Social Networks',
                icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" />,
                onClick: () => setCurrentView('social' as const),
              },
              {
                id: 'insurance',
                title: 'Insurance',
                icon: <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />,
                onClick: () => setCurrentView('insurance' as const),
              },
              {
                id: 'vip',
                title: 'VIP',
                icon: <Crown className="h-5 w-5 sm:h-6 sm:w-6" />,
                onClick: () => setCurrentView('vip' as const),
              },
              {
                id: 'personal-code',
                title: 'Personal Code',
                icon: <IdCard className="h-5 w-5 sm:h-6 sm:w-6" />,
                onClick: () => setCurrentView('personal-code' as const),
              },
              {
                id: 'friends-codes',
                title: 'Friends Codes',
                icon: <Heart className="h-5 w-5 sm:h-6 sm:w-6" />,
                onClick: () => setCurrentView('friends-codes' as const),
              },
              {
                id: 'bar-tab',
                title: 'Bar Tab',
                icon: <Wine className="h-5 w-5 sm:h-6 sm:w-6" />,
                onClick: () => setCurrentView('bar-tab' as const),
              },
              {
                id: 'faq',
                title: 'FAQ & Contact',
                icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" />,
                onClick: () => setCurrentView('faq' as const),
              },
              {
                id: 'messages',
                title: 'Messages',
                icon: (
                  <div className="relative">
                    <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    {unreadMessageCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold text-[10px] sm:text-xs">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </div>
                    )}
                  </div>
                ),
                onClick: () => setCurrentView('messages' as const),
              },
              {
                id: 'direct-messages',
                title: 'Direct Messages',
                icon: (
                  <div className="relative">
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
                    {unreadDirectMessageCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold text-[10px] sm:text-xs">
                        {unreadDirectMessageCount > 9 ? '9+' : unreadDirectMessageCount}
                      </div>
                    )}
                  </div>
                ),
                onClick: () => setCurrentView('direct-messages' as const),
              },
            ];
            return (
              <ReorderableTilesLogic 
                items={items} 
                orderKey={`dashboard-order-user-${user.id}`}
                onLongPress={(id) => {
                  // Handle long press for reordering
                  console.log('Long press on:', id);
                }} 
              />
            );
          })()}
        </div>

        {/* QR Codes Section */}
        {userQRCodes.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">Your Tickets</h2>
            <div className="space-y-4">
              {userQRCodes.map((qrCode) => (
                <div 
                  key={qrCode.id} 
                  className="cursor-pointer group overflow-hidden border border-border bg-card"
                  onClick={() => {
                    const party = { 
                      id: qrCode.party_id, 
                      name: qrCode.parties?.name, 
                      date: qrCode.parties?.date,
                      photo_url: qrCode.parties?.photo_url
                    };
                    localStorage.setItem('selectedPartyId', qrCode.party_id);
                    setCurrentView('parties');
                  }}
                >
                  <div className="p-0">
                    <div className="relative">
                      {/* Event Image */}
                      {qrCode.parties?.photo_url && (
                        <div className="h-64 w-full overflow-hidden">
                          <img 
                            src={qrCode.parties.photo_url} 
                            alt={qrCode.parties?.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      
                      {/* Overlay Content */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                        <h3 className="text-white font-bold text-lg mb-1">
                          {qrCode.parties?.name}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {new Date(qrCode.parties?.date).toLocaleDateString()}
                        </p>
                        
                        {/* Status Badge */}
                        <div className="mt-2">
                          {qrCode.is_approved ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                              ✓ Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-black">
                              ⏳ Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="w-80">
            <DialogHeader>
              <DialogTitle>Your QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4">
              {selectedQRCode && (
                <>
                  <div className="bg-white p-4 rounded-lg">
                    <QRCodeSVG 
                      value={selectedQRCode.code}
                      size={200}
                      level="M"
                      includeMargin
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{selectedQRCode.parties?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedQRCode.parties?.date).toLocaleDateString()}
                    </p>
                    {selectedQRCode.friend_display_name && (
                      <p className="text-sm text-accent mt-2">
                        For: {selectedQRCode.friend_display_name}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
    </div>
  );
};

export default UserDashboard;
