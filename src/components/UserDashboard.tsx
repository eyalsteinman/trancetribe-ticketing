import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User } from '@supabase/supabase-js';
import { Calendar, UserIcon, Gamepad2, Crown, ShieldCheck, LogOut, Users, IdCard, Heart, Wine, Moon, Sun, MessageCircle, ArrowLeft, Mail, CalendarDays } from 'lucide-react';
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
import EventCalendar from './EventCalendar';
import { useTheme } from '@/hooks/useDarkMode';
import PageHeader from './ui/page-header';

interface UserDashboardProps {
  user: User;
}

const UserDashboard = ({ user }: UserDashboardProps) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'parties' | 'nickname' | 'games' | 'color-changer' | 'dot-circle' | 'exploder' | 'haya-ninja' | 'social' | 'vip' | 'vip-detail' | 'insurance' | 'personal-code' | 'friends-codes' | 'bar-tab' | 'faq' | 'messages' | 'tribes' | 'direct-messages' | 'event-calendar'>('dashboard');
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
  const { t } = useLanguage();

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
          title: t('warning'),
          description: t('logged_out_locally_server_failed'),
          variant: "destructive"
        });
      } else {
        toast({
          title: t('success'),
          description: t('signed_out_successfully'),
        });
      }
    } catch (error) {
      console.error('Sign out catch error:', error);
      toast({
        title: t('info'), 
        description: t('logged_out_locally'),
      });
    }
  };

  // Handle different views
  if (currentView === 'parties') {
    return <UserParties user={user} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'event-calendar') {
    return <EventCalendar onBack={() => setCurrentView('dashboard')} userId={user.id} />;
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
    <div className="min-h-screen w-full transition-colors duration-500 p-4">
      {/* Header */}
      <div className="relative pt-2 pb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {nickname ? t('welcome_back') : t('user_dashboard')}
        </h1>
        {nickname && (
          <p className="text-lg text-primary font-semibold">{nickname}!</p>
        )}
        <Button 
          variant="outline" 
          size="icon"
          onClick={async () => {
            await handleSignOut();
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }} 
          className="absolute top-2 right-4 z-50 border-foreground/20 bg-background/50 backdrop-blur-sm text-foreground hover:bg-foreground/10 transition-all duration-200"
          aria-label="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-full">
          {(() => {
            const items = [
              {
                id: 'parties',
                title: t('events_parties'),
                icon: <Calendar className="h-12 w-12" />,
                onClick: () => setCurrentView('parties' as const),
              },
              {
                id: 'event-calendar',
                title: t('event_calendar'),
                icon: <CalendarDays className="h-12 w-12" />,
                onClick: () => setCurrentView('event-calendar' as const),
              },
              {
                id: 'nickname',
                title: t('my_info'),
                icon: <UserIcon className="h-12 w-12" />,
                onClick: () => setCurrentView('nickname' as const),
              },
              {
                id: 'social',
                title: t('social_networks'),
                icon: <Users className="h-12 w-12" />,
                onClick: () => setCurrentView('social' as const),
              },
              {
                id: 'insurance',
                title: t('insurance'),
                icon: <ShieldCheck className="h-12 w-12" />,
                onClick: () => setCurrentView('insurance' as const),
              },
              {
                id: 'vip',
                title: t('vip'),
                icon: <Crown className="h-12 w-12" />,
                onClick: () => setCurrentView('vip' as const),
              },
              {
                id: 'personal-code',
                title: t('personal_code'),
                icon: <IdCard className="h-12 w-12" />,
                onClick: () => setCurrentView('personal-code' as const),
              },
              {
                id: 'friends-codes',
                title: t('friends_codes'),
                icon: <Heart className="h-12 w-12" />,
                onClick: () => setCurrentView('friends-codes' as const),
              },
              {
                id: 'bar-tab',
                title: t('bar_tab'),
                icon: <Wine className="h-12 w-12" />,
                onClick: () => setCurrentView('bar-tab' as const),
              },
                {
                  id: 'faq',
                  title: t('faq_contact'),
                  icon: <Users className="h-12 w-12" />,
                  onClick: () => setCurrentView('faq' as const),
                },
                {
                  id: 'messages',
                  title: t('messages'),
                  icon: (
                    <div className="relative">
                      <MessageCircle className="h-12 w-12" />
                      {unreadMessageCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                        </div>
                      )}
                    </div>
                  ),
                  onClick: () => setCurrentView('messages' as const),
                },
                {
                  id: 'direct-messages',
                  title: t('direct_messages'),
                  icon: (
                    <div className="relative">
                      <Mail className="h-12 w-12" />
                      {unreadDirectMessageCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
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
        <div className="mt-6">
          <h2 className="text-lg font-bold text-foreground mb-4">{t('your_tickets')}</h2>
            <div className="space-y-4">
              {userQRCodes.map((qrCode) => (
                <div 
                  key={qrCode.id} 
                  className="cursor-pointer group overflow-hidden border border-border bg-card rounded-xl"
                  onClick={() => {
                    localStorage.setItem('selectedPartyId', qrCode.party_id);
                    localStorage.setItem('viewPartyDetails', 'true');
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
                             alt={qrCode.parties.name}
                             className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                         </div>
                       )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        {qrCode.is_scanned ? (
                          <div className="bg-green-500 text-white px-3 py-1 text-xs font-semibold">
                            ✓ Used
                          </div>
                        ) : qrCode.is_approved ? (
                          <div className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
                            ✓ Ready
                          </div>
                        ) : (
                          <div className="bg-orange-500 text-white px-3 py-1 text-xs font-semibold">
                            Pending
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Event Info */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
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
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
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