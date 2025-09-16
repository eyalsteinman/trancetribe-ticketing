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
    <div className="min-h-screen w-full app-background relative">
      {/* Ultra Dynamic Parallax Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary floating orb */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-radial from-primary/40 to-transparent rounded-full blur-3xl animate-float opacity-60"></div>
        
        {/* Secondary floating orb */}
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-radial from-accent/35 to-transparent rounded-full blur-3xl animate-float-delayed opacity-70"></div>
        
        {/* Tertiary floating orb */}
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-radial from-secondary/30 to-transparent rounded-full blur-3xl animate-bounce-gentle opacity-50"></div>
        
        {/* Floating particles with varied sizes */}
        <div className="absolute top-1/4 left-1/5 w-3 h-3 bg-primary rounded-full animate-ping opacity-60"></div>
        <div className="absolute top-3/4 right-1/5 w-2 h-2 bg-accent rounded-full animate-ping opacity-40 animation-delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-secondary rounded-full animate-ping opacity-50 animation-delay-500"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-primary rounded-full animate-ping opacity-70 animation-delay-1500"></div>
        
        {/* Gradient mesh overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-accent/10 animate-gradient-shift"></div>
      </div>

      <div className="relative z-10 min-h-screen w-full">
        {/* Ultra Modern Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-xl border-b border-border/30 shadow-modern">
          <div className="w-full px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                  {nickname ? `Welcome back,` : 'Dashboard'}
                </h1>
                {nickname && (
                  <p className="text-lg sm:text-xl text-primary font-bold drop-shadow-glow">{nickname}!</p>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={async () => {
                  await handleSignOut();
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                }} 
                className="h-12 w-12 rounded-2xl bg-glass border-2 border-border/30 hover:border-primary/60 hover:shadow-glow transition-all duration-500"
                aria-label="Sign Out"
              >
                <LogOut className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Ultra Modern Dashboard Tiles */}
        <div className="pt-24 px-6 pb-6">
          {(() => {
            const items = [
              {
                id: 'parties',
                title: 'Events & Parties',
                subtitle: 'Manage your tickets',
                icon: <Calendar className="dashboard-icon" />,
                onClick: () => setCurrentView('parties' as const),
              },
              {
                id: 'nickname',
                title: 'My Profile',
                subtitle: 'Personal details',
                icon: <UserIcon className="dashboard-icon" />,
                onClick: () => setCurrentView('nickname' as const),
              },
              {
                id: 'social',
                title: 'Social Networks',
                subtitle: 'Connect & share',
                icon: <Users className="dashboard-icon" />,
                onClick: () => setCurrentView('social' as const),
              },
              {
                id: 'insurance',
                title: 'Insurance',
                subtitle: 'Coverage details',
                icon: <ShieldCheck className="dashboard-icon" />,
                onClick: () => setCurrentView('insurance' as const),
              },
              {
                id: 'vip',
                title: 'VIP Access',
                subtitle: 'Premium features',
                icon: <Crown className="dashboard-icon" />,
                onClick: () => setCurrentView('vip' as const),
              },
              {
                id: 'personal-code',
                title: 'Personal Code',
                subtitle: 'Your unique ID',
                icon: <IdCard className="dashboard-icon" />,
                onClick: () => setCurrentView('personal-code' as const),
              },
              {
                id: 'friends-codes',
                title: 'Friends Codes',
                subtitle: 'Connect with friends',
                icon: <Heart className="dashboard-icon" />,
                onClick: () => setCurrentView('friends-codes' as const),
              },
              {
                id: 'bar-tab',
                title: 'Bar Tab',
                subtitle: 'Manage purchases',
                icon: <Wine className="dashboard-icon" />,
                onClick: () => setCurrentView('bar-tab' as const),
              },
              {
                id: 'faq',
                title: 'Help & Support',
                subtitle: 'Get assistance',
                icon: <Users className="dashboard-icon" />,
                onClick: () => setCurrentView('faq' as const),
              },
              {
                id: 'messages',
                title: 'Messages',
                subtitle: `${unreadMessageCount > 0 ? `${unreadMessageCount} unread` : 'All caught up'}`,
                icon: (
                  <div className="relative dashboard-icon">
                    <MessageCircle className="h-12 w-12" />
                    {unreadMessageCount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-sm rounded-full h-6 w-6 flex items-center justify-center font-black animate-pulse-glow">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </div>
                    )}
                  </div>
                ),
                onClick: () => setCurrentView('messages' as const),
              },
              {
                id: 'direct-messages',
                title: 'Direct Chat',
                subtitle: `${unreadDirectMessageCount > 0 ? `${unreadDirectMessageCount} new` : 'No new messages'}`,
                icon: (
                  <div className="relative dashboard-icon">
                    <Mail className="h-12 w-12" />
                    {unreadDirectMessageCount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-sm rounded-full h-6 w-6 flex items-center justify-center font-black animate-pulse-glow">
                        {unreadDirectMessageCount > 9 ? '9+' : unreadDirectMessageCount}
                      </div>
                    )}
                  </div>
                ),
                onClick: () => setCurrentView('direct-messages' as const),
              },
            ];
            return (
              <div className="dashboard-grid animate-fade-in-up">
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className="dashboard-button"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {item.icon}
                    <h3 className="dashboard-title">{item.title}</h3>
                    <p className="dashboard-subtitle">{item.subtitle}</p>
                  </button>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Ultra Modern QR Codes Section */}
        {userQRCodes.length > 0 && (
          <div className="px-6 pb-6">
            <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-8 animate-shimmer bg-[length:200%_100%]">Your Tickets</h2>
            <div className="space-y-6">
              {userQRCodes.map((qrCode) => (
                <div 
                  key={qrCode.id} 
                  className="cursor-pointer group overflow-hidden rounded-3xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-border/30 hover:border-primary/60 hover:shadow-neon transition-all duration-500 hover:scale-105"
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
                        <div className="h-64 w-full overflow-hidden rounded-t-3xl">
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

        {/* Footer */}
        <div className="floating-section">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
