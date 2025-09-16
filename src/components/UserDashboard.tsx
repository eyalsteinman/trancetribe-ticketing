import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { 
  Calendar, 
  UserIcon, 
  Crown, 
  ShieldCheck, 
  LogOut, 
  Users, 
  IdCard, 
  Heart, 
  Wine, 
  MessageCircle, 
  Mail,
  Globe,
  Gamepad2,
  Sparkles,
  Settings
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import ModernFooter from '@/components/ui/modern-footer';
import Navigation from '@/components/ui/navigation';
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
import Insurance from './Insurance';
import PersonalCode from './PersonalCode';
import FriendsCodes from './FriendsCodes';
import UserBarTab from './UserBarTab';
import FAQContact from './FAQContact';
import UserMessages from './UserMessages';
import UserMessaging from './UserMessaging';

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

  useEffect(() => {
    loadUserQRCodes();
    loadUserProfile();
    loadUnreadMessageCount();
    loadUnreadDirectMessageCount();
    
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
        const uniqueQRCodes = data.reduce((acc: any[], current: any) => {
          const existingIndex = acc.findIndex(qr => qr.party_id === current.party_id);
          if (existingIndex === -1) {
            acc.push(current);
          } else {
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

      if (!error) {
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

      if (!error) {
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
      loadUserProfile();
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
      loadUnreadMessageCount();
    }} userId={user.id} onOpenTribes={() => setCurrentView('tribes')} />;
  }

  if (currentView === 'tribes') {
    const UserTribes = React.lazy(() => import('./UserTribes'));
    return (
      <React.Suspense fallback={<div className="page-container"><div className="text-center">Loading...</div></div>}>
        <UserTribes onBack={() => setCurrentView('dashboard')} userId={user.id} />
      </React.Suspense>
    );
  }

  if (currentView === 'direct-messages') {
    return (
      <React.Suspense fallback={<div className="page-container"><div className="text-center">Loading...</div></div>}>
        <UserMessaging onBack={() => setCurrentView('dashboard')} userId={user.id} />
      </React.Suspense>
    );
  }

  return (
    <div className="page-container">
      {/* Navigation */}
      <Navigation 
        isAdmin={false}
        currentPage={currentView}
        onNavigate={(page) => setCurrentView(page as any)}
      />

      {/* Parallax Background Elements */}
      <div className="fixed inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-20 right-10 w-40 h-40 bg-primary/10 rounded-full animate-float"></div>
        <div className="absolute bottom-32 left-20 w-24 h-24 bg-accent/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/5 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <div className="content-wrapper pt-20 pb-8">
        <div className="flex items-center justify-between">
          <div className="animate-slide-in-up">
            <h1 className="text-responsive-lg font-bold text-foreground mb-2">
              {nickname ? `Welcome back,` : 'User Dashboard'}
            </h1>
            {nickname && (
              <p className="text-xl text-primary font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {nickname}! ✨
              </p>
            )}
          </div>
          <Button 
            variant="glass" 
            size="icon-sm"
            onClick={async () => {
              await handleSignOut();
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }} 
            className="hover:scale-110 hover:shadow-glow"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="content-wrapper">
        <div className="animate-fade-in-scale">
          {(() => {
            const items = [
              {
                id: 'parties',
                title: 'Events\n& Parties',
                icon: <Calendar className="h-10 w-10" />,
                onClick: () => setCurrentView('parties' as const),
                gradient: 'from-primary/20 to-accent/20',
              },
              {
                id: 'nickname',
                title: 'My Info',
                icon: <UserIcon className="h-10 w-10" />,
                onClick: () => setCurrentView('nickname' as const),
                gradient: 'from-secondary/20 to-primary/20',
              },
              {
                id: 'social',
                title: 'Social Networks',
                icon: <Globe className="h-10 w-10" />,
                onClick: () => setCurrentView('social' as const),
                gradient: 'from-accent/20 to-primary/20',
              },
              {
                id: 'insurance',
                title: 'Insurance',
                icon: <ShieldCheck className="h-10 w-10" />,
                onClick: () => setCurrentView('insurance' as const),
                gradient: 'from-green-500/20 to-primary/20',
              },
              {
                id: 'vip',
                title: 'VIP',
                icon: <Crown className="h-10 w-10" />,
                onClick: () => setCurrentView('vip' as const),
                gradient: 'from-yellow-500/20 to-orange-500/20',
              },
              {
                id: 'personal-code',
                title: 'Personal Code',
                icon: <IdCard className="h-10 w-10" />,
                onClick: () => setCurrentView('personal-code' as const),
                gradient: 'from-blue-500/20 to-primary/20',
              },
              {
                id: 'friends-codes',
                title: 'Friends Codes',
                icon: <Heart className="h-10 w-10" />,
                onClick: () => setCurrentView('friends-codes' as const),
                gradient: 'from-pink-500/20 to-red-500/20',
              },
              {
                id: 'bar-tab',
                title: 'Bar Tab',
                icon: <Wine className="h-10 w-10" />,
                onClick: () => setCurrentView('bar-tab' as const),
                gradient: 'from-purple-500/20 to-pink-500/20',
              },
              {
                id: 'faq',
                title: 'FAQ & Contact',
                icon: <Users className="h-10 w-10" />,
                onClick: () => setCurrentView('faq' as const),
                gradient: 'from-gray-500/20 to-primary/20',
              },
              {
                id: 'messages',
                title: 'Messages',
                icon: (
                  <div className="relative">
                    <MessageCircle className="h-10 w-10" />
                    {unreadMessageCount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse-glow">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </div>
                    )}
                  </div>
                ),
                onClick: () => setCurrentView('messages' as const),
                gradient: 'from-blue-500/20 to-cyan-500/20',
              },
              {
                id: 'direct-messages',
                title: 'Direct Messages',
                icon: (
                  <div className="relative">
                    <Mail className="h-10 w-10" />
                    {unreadDirectMessageCount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse-glow">
                        {unreadDirectMessageCount > 9 ? '9+' : unreadDirectMessageCount}
                      </div>
                    )}
                  </div>
                ),
                onClick: () => setCurrentView('direct-messages' as const),
                gradient: 'from-indigo-500/20 to-purple-500/20',
              },
              {
                id: 'games',
                title: 'Games',
                icon: <Gamepad2 className="h-10 w-10" />,
                onClick: () => setCurrentView('games' as const),
                gradient: 'from-green-500/20 to-emerald-500/20',
              },
            ];

            return (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`glass hover:glass-strong p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-glow group animate-fade-in-scale`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`bg-gradient-to-br ${item.gradient} p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <div className="text-foreground group-hover:text-primary transition-colors duration-300">
                        {item.icon}
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300 whitespace-pre-line">
                      {item.title}
                    </h3>
                  </button>
                ))}
              </div>
            );
          })()}
        </div>

        {/* QR Codes Section */}
        {userQRCodes.length > 0 && (
          <div className="mt-12 animate-slide-in-up">
            <h2 className="text-responsive-md font-bold text-foreground mb-6 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Your Tickets
            </h2>
            <div className="grid gap-6">
              {userQRCodes.map((qrCode, index) => (
                <div 
                  key={qrCode.id} 
                  className="glass hover:glass-strong cursor-pointer group transition-all duration-500 hover:scale-[1.02] hover:shadow-glow animate-fade-in-scale"
                  style={{ animationDelay: `${index * 150}ms` }}
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
                  <div className="relative overflow-hidden">
                    {/* Event Image */}
                    {qrCode.parties?.photo_url && (
                      <div className="h-48 w-full overflow-hidden">
                        <img 
                          src={qrCode.parties.photo_url} 
                          alt={qrCode.parties.name}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      {qrCode.is_scanned ? (
                        <div className="glass bg-green-500/20 text-green-300 px-3 py-1 text-sm font-semibold border border-green-500/30">
                          ✓ Used
                        </div>
                      ) : qrCode.is_approved ? (
                        <div className="glass bg-primary/20 text-primary px-3 py-1 text-sm font-semibold border border-primary/30">
                          ✓ Ready
                        </div>
                      ) : (
                        <div className="glass bg-orange-500/20 text-orange-300 px-3 py-1 text-sm font-semibold border border-orange-500/30">
                          Pending
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Event Info */}
                  <div className="p-6 space-y-3">
                    <div>
                      <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors duration-300">
                        {qrCode.parties?.name}
                      </h3>
                      {qrCode.parties?.date && (
                        <p className="text-muted-foreground text-sm mt-1">
                          {new Date(qrCode.parties.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="glass border-white/20">
          <DialogHeader>
            <DialogTitle className="text-foreground">Your Ticket QR Code</DialogTitle>
          </DialogHeader>
          {selectedQRCode && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={selectedQRCode.code} size={200} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">{selectedQRCode.parties?.name}</p>
                <p className="text-sm text-muted-foreground">Show this code at the event</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modern Footer */}
      <ModernFooter />
    </div>
  );
};

export default UserDashboard;