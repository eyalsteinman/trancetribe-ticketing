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
    <div className="app-container dynamic-bg">
      {/* Floating background elements */}
      <div className="floating-orb" />
      <div className="floating-orb" />
      <div className="floating-orb" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${20 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="page-container relative z-10">
        {/* Enhanced Header */}
        <div className="page-header">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-glow">
              {nickname ? 'Welcome back,' : 'User Dashboard'}
            </h1>
            {nickname && (
              <p className="text-xl gradient-text font-semibold animate-shimmer">{nickname}!</p>
            )}
          </div>
          <Button 
            variant="glass" 
            size="icon"
            onClick={async () => {
              await handleSignOut();
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }} 
            className="hover:text-destructive"
            aria-label="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid-responsive animate-slideInUp">
          {(() => {
            const items = [
              {
                id: 'parties',
                title: 'Events & Parties',
                description: 'Browse and join events',
                icon: <Calendar className="h-16 w-16 text-primary" />,
                onClick: () => setCurrentView('parties' as const),
                gradient: 'from-purple-500/20 to-pink-500/20'
              },
              {
                id: 'nickname',
                title: 'My Profile',
                description: 'Edit your information',
                icon: <UserIcon className="h-16 w-16 text-accent" />,
                onClick: () => setCurrentView('nickname' as const),
                gradient: 'from-blue-500/20 to-cyan-500/20'
              },
              {
                id: 'social',
                title: 'Social Networks',
                description: 'Connect with friends',
                icon: <Users className="h-16 w-16 text-primary" />,
                onClick: () => setCurrentView('social' as const),
                gradient: 'from-green-500/20 to-emerald-500/20'
              },
              {
                id: 'insurance',
                title: 'Insurance',
                description: 'Protection & coverage',
                icon: <ShieldCheck className="h-16 w-16 text-success" />,
                onClick: () => setCurrentView('insurance' as const),
                gradient: 'from-emerald-500/20 to-teal-500/20'
              },
              {
                id: 'vip',
                title: 'VIP Access',
                description: 'Premium experiences',
                icon: <Crown className="h-16 w-16 text-warning" />,
                onClick: () => setCurrentView('vip' as const),
                gradient: 'from-yellow-500/20 to-orange-500/20'
              },
              {
                id: 'personal-code',
                title: 'Personal Code',
                description: 'Your unique identifier',
                icon: <IdCard className="h-16 w-16 text-primary" />,
                onClick: () => setCurrentView('personal-code' as const),
                gradient: 'from-indigo-500/20 to-purple-500/20'
              },
              {
                id: 'friends-codes',
                title: 'Friends Network',
                description: 'Connect with codes',
                icon: <Heart className="h-16 w-16 text-destructive" />,
                onClick: () => setCurrentView('friends-codes' as const),
                gradient: 'from-rose-500/20 to-pink-500/20'
              },
              {
                id: 'bar-tab',
                title: 'Bar Tab',
                description: 'Manage your orders',
                icon: <Wine className="h-16 w-16 text-accent" />,
                onClick: () => setCurrentView('bar-tab' as const),
                gradient: 'from-amber-500/20 to-orange-500/20'
              },
              {
                id: 'faq',
                title: 'Support',
                description: 'Help & contact',
                icon: <Users className="h-16 w-16 text-muted-foreground" />,
                onClick: () => setCurrentView('faq' as const),
                gradient: 'from-slate-500/20 to-gray-500/20'
              },
              {
                id: 'messages',
                title: 'Messages',
                description: 'Community chat',
                icon: (
                  <div className="relative">
                    <MessageCircle className="h-16 w-16 text-primary" />
                    {unreadMessageCount > 0 && (
                      <div className="notification-badge">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </div>
                    )}
                  </div>
                ),
                onClick: () => setCurrentView('messages' as const),
                gradient: 'from-blue-500/20 to-indigo-500/20',
                hasNotification: unreadMessageCount > 0
              },
              {
                id: 'direct-messages',
                title: 'Direct Messages',
                description: 'Private conversations',
                icon: (
                  <div className="relative">
                    <Mail className="h-16 w-16 text-accent" />
                    {unreadDirectMessageCount > 0 && (
                      <div className="notification-badge">
                        {unreadDirectMessageCount > 9 ? '9+' : unreadDirectMessageCount}
                      </div>
                    )}
                  </div>
                ),
                onClick: () => setCurrentView('direct-messages' as const),
                gradient: 'from-violet-500/20 to-purple-500/20',
                hasNotification: unreadDirectMessageCount > 0
              },
            ];

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`dashboard-tile bg-gradient-to-br ${item.gradient} ${item.hasNotification ? 'animate-glow-pulse' : ''}`}
                    onClick={item.onClick}
                    style={{
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    <div className="relative z-10 flex flex-col items-center space-y-4">
                      <div className="p-4 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
                        {item.icon}
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Enhanced Tickets Section */}
        {userQRCodes.length > 0 && (
          <div className="mt-12 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-2xl font-bold text-glow mb-6 text-center">Your Active Tickets</h2>
            <div className="space-y-6">
              {userQRCodes.map((qrCode, index) => (
                <div 
                  key={qrCode.id} 
                  className="glass-card hover-glow cursor-pointer group overflow-hidden modern-radius-lg animate-fadeInScale"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
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
                  <div className="relative">
                    {/* Enhanced Event Image */}
                    {qrCode.parties?.photo_url && (
                      <div className="h-48 w-full overflow-hidden relative">
                        <img 
                          src={qrCode.parties.photo_url} 
                          alt={qrCode.parties.name}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        {/* Animated overlay effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                    )}
                    
                    {/* Enhanced Status Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      {qrCode.is_scanned ? (
                        <div className="status-badge status-success">
                          ✓ Used
                        </div>
                      ) : qrCode.is_approved ? (
                        <div className="status-badge bg-primary text-primary-foreground animate-glow-pulse">
                          ✓ Ready
                        </div>
                      ) : (
                        <div className="status-badge status-warning">
                          ⏳ Pending
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Enhanced Event Info */}
                  <div className="p-6 space-y-4 relative">
                    <div>
                      <h3 className="font-bold text-xl text-foreground group-hover:gradient-text transition-all duration-300">
                        {qrCode.parties?.name}
                      </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(qrCode.parties?.date).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            weekday: 'short'
                          })}
                        </p>
                      </div>
                      
                      {/* QR Code Ready Action */}
                        {qrCode.is_approved && !qrCode.is_scanned && (
                        <Button 
                          size="sm"
                          className="w-full bg-primary text-white hover:bg-primary/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedQRCode(qrCode);
                            setShowQRDialog(true);
                          }}
                        >
                          Show QR Code
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Games Shortcut */}
        {userQRCodes.length === 0 && (
          <div className="mt-16 text-center animate-slideInUp">
            <div className="glass-card p-8 max-w-md mx-auto">
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-full flex items-center justify-center animate-float">
                  <Gamepad2 className="h-10 w-10 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">No Tickets Yet</h3>
                  <p className="text-muted-foreground">
                    Join an event to get your first ticket, or explore our games while you wait!
                  </p>
                </div>
                <Button 
                  onClick={() => setCurrentView('games')} 
                  variant="premium"
                  size="lg"
                  className="w-full"
                >
                  <Gamepad2 className="h-5 w-5 mr-2" />
                  Explore Games
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
        
        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="max-w-sm z-[9999] bg-black/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-white">Your QR Code</DialogTitle>
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
      <Footer />
    </div>
  );
};

export default UserDashboard;