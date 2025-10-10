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
import UserDirectMessages from './UserDirectMessages';
import EventCalendar from './EventCalendar';
import { useTheme } from '@/hooks/useDarkMode';
import PageHeader from './ui/page-header';
import ProductionCarousel from './ProductionCarousel';
import ViewTransition from './ui/view-transition';
import ScrollToTop from './ui/scroll-to-top';
import { useScrollMemory } from '@/hooks/useScrollMemory';

interface UserDashboardProps {
  user: User;
}

const UserDashboard = ({ user }: UserDashboardProps) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'parties' | 'nickname' | 'games' | 'color-changer' | 'dot-circle' | 'exploder' | 'haya-ninja' | 'social' | 'vip' | 'vip-detail' | 'insurance' | 'personal-code' | 'friends-codes' | 'bar-tab' | 'faq' | 'messages' | 'tribes' | 'direct-messages' | 'event-calendar'>('dashboard');
  const [nickname, setNickname] = useState<string>('');
  const [userQRCodes, setUserQRCodes] = useState<any[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<{id: string; name: string; logo_url: string | null; vip_description: string | null; vip_price: number | null; created_by: string} | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<any>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadDirectMessageCount, setUnreadDirectMessageCount] = useState(0);
  const [newEventsCount, setNewEventsCount] = useState(0);
  const [showJoinTribeDialog, setShowJoinTribeDialog] = useState(false);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();
  const { currentTheme, cycleTheme, getThemeDisplayName } = useTheme();
  const { t } = useLanguage();

  // Add scroll memory
  useScrollMemory({ viewKey: currentView, enabled: true });

  useEffect(() => {
    loadUserQRCodes();
    loadUserProfile();
    loadUnreadMessageCount();
    loadUnreadDirectMessageCount();
    loadNewEventsCount();
    
    // Set up polling to refresh QR codes and messages every 30 seconds
    const interval = setInterval(() => {
      loadUserQRCodes();
      loadUnreadMessageCount();
      loadUnreadDirectMessageCount();
      loadNewEventsCount();
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

  const loadNewEventsCount = async () => {
    try {
      // Check if badge was dismissed
      const badgeDismissed = localStorage.getItem(`calendar-badge-dismissed-${user.id}`);
      if (badgeDismissed === 'true') {
        setNewEventsCount(0);
        return;
      }

      // Get productions user follows
      const { data: followedProductions, error: followError } = await supabase
        .from('production_followers')
        .select('production_id')
        .eq('user_id', user.id);

      if (followError) throw followError;

      if (!followedProductions || followedProductions.length === 0) {
        setNewEventsCount(0);
        return;
      }

      const productionIds = followedProductions.map(f => f.production_id);

      // Get user's purchased tickets
      const { data: userTickets } = await supabase
        .from('qr_codes')
        .select('party_id')
        .eq('user_id', user.id);

      const purchasedPartyIds = userTickets?.map(t => t.party_id) || [];

      // Get parties from followed productions created in last 7 days that are still future events
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const today = new Date().toISOString().split('T')[0];

      const { data: newParties, error: partyError } = await supabase
        .from('parties')
        .select('id, date')
        .in('production_id', productionIds)
        .gte('created_at', sevenDaysAgo.toISOString())
        .gte('date', today)
        .eq('is_active', true);

      if (partyError) throw partyError;

      // Filter out purchased tickets and past events
      const unpurchasedEvents = newParties?.filter(party => 
        !purchasedPartyIds.includes(party.id)
      ) || [];

      setNewEventsCount(unpurchasedEvents.length);
    } catch (error) {
      console.error('Error loading new events count:', error);
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
          description: 'Signed out successfully',
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
    return <ViewTransition viewKey={currentView}><UserParties user={user} onBack={() => setCurrentView('dashboard')} /></ViewTransition>;
  }

  if (currentView === 'event-calendar') {
    return <ViewTransition viewKey={currentView}><EventCalendar 
      onBack={() => {
        // Mark badge as dismissed when exiting calendar
        localStorage.setItem(`calendar-badge-dismissed-${user.id}`, 'true');
        setNewEventsCount(0);
        setCurrentView('dashboard');
      }} 
      userId={user.id}
      onTicketPurchase={() => {
        loadNewEventsCount();
        loadUserQRCodes();
      }}
    /></ViewTransition>;
  }

  if (currentView === 'nickname') {
    return <ViewTransition viewKey={currentView}><PersonalizeEdit user={user} onBack={() => {
      setCurrentView('dashboard');
      loadUserProfile(); // Refresh nickname after returning
    }} /></ViewTransition>;
  }

  if (currentView === 'games') {
    return <ViewTransition viewKey={currentView}><UserGames onBack={() => setCurrentView('dashboard')} onGameSelect={(game) => setCurrentView(game as any)} /></ViewTransition>;
  }

  if (currentView === 'color-changer') {
    return <ViewTransition viewKey={currentView}><BoredScreen onBack={() => setCurrentView('games')} /></ViewTransition>;
  }

  if (currentView === 'dot-circle') {
    return <ViewTransition viewKey={currentView}><DotCircleGame onBack={() => setCurrentView('games')} adminId={user.id} adminNickname={nickname} /></ViewTransition>;
  }

  if (currentView === 'exploder') {
    return <ViewTransition viewKey={currentView}><ExploderGame onBack={() => setCurrentView('games')} scope="user" playerNickname={nickname} /></ViewTransition>;
  }

  if (currentView === 'haya-ninja') {
    return <ViewTransition viewKey={currentView}><HayaNinja onBack={() => setCurrentView('games')} scope="user" playerNickname={nickname} /></ViewTransition>;
  }

  if (currentView === 'social') {
    return <ViewTransition viewKey={currentView}><SocialNetworks userId={user.id} onBack={() => setCurrentView('dashboard')} /></ViewTransition>;
  }

  if (currentView === 'insurance') {
    return <ViewTransition viewKey={currentView}><Insurance onBack={() => setCurrentView('dashboard')} /></ViewTransition>;
  }

  if (currentView === 'vip') {
    return (
      <ViewTransition viewKey={currentView}>
        <VIPHub
          user={user}
          nickname={nickname}
          onBack={() => setCurrentView('dashboard')}
          onSelectProduction={(production) => {
            setSelectedProduction(production);
            setCurrentView('vip-detail');
          }}
        />
      </ViewTransition>
    );
  }

  if (currentView === 'vip-detail' && selectedProduction !== null) {
    return (
      <ViewTransition viewKey={currentView}>
        <VIPProduction
          user={user}
          production={selectedProduction}
          onBack={() => setCurrentView('vip')}
        />
      </ViewTransition>
    );
  }

  if (currentView === 'personal-code') {
    return <ViewTransition viewKey={currentView}><PersonalCode user={user} onBack={() => setCurrentView('dashboard')} /></ViewTransition>;
  }

  if (currentView === 'friends-codes') {
    return <ViewTransition viewKey={currentView}><FriendsCodes user={user} onBack={() => setCurrentView('dashboard')} /></ViewTransition>;
  }

  if (currentView === 'bar-tab') {
    return <ViewTransition viewKey={currentView}><UserBarTab userId={user.id} onBack={() => setCurrentView('dashboard')} /></ViewTransition>;
  }

  if (currentView === 'faq') {
    return <ViewTransition viewKey={currentView}><FAQContact user={user} onBack={() => setCurrentView('dashboard')} isAdmin={false} /></ViewTransition>;
  }

  if (currentView === 'messages') {
    return <ViewTransition viewKey={currentView}><UserMessages onBack={() => {
      setCurrentView('dashboard');
      loadUnreadMessageCount(); // Refresh unread count when returning
    }} userId={user.id} onOpenTribes={() => setCurrentView('tribes')} /></ViewTransition>;
  }

  if (currentView === 'direct-messages') {
    return <ViewTransition viewKey={currentView}><UserDirectMessages onBack={() => {
      setCurrentView('dashboard');
      loadUnreadDirectMessageCount(); // Refresh unread count when returning
    }} userId={user.id} /></ViewTransition>;
  }

  if (currentView === 'tribes') {
    const UserTribes = React.lazy(() => import('./UserTribes'));
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-background p-4"><div className="text-center">Loading...</div></div>}>
        <ViewTransition viewKey={currentView}><UserTribes onBack={() => setCurrentView('dashboard')} userId={user.id} /></ViewTransition>
      </React.Suspense>
    );
  }


  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#4C1D95]" style={{ position: 'relative' }}>
      {/* Animated background */}
      <div className="auth-animated-bg" />
      
      <div className="min-h-screen w-full relative z-10 transition-colors duration-500 p-4" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="relative pt-2 pb-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          {nickname ? t('welcome_back') : t('user_dashboard')}
        </h1>
        {nickname && (
          <p className="text-lg text-white font-semibold">{nickname}!</p>
        )}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleSignOut}
          className="absolute top-2 right-4 z-50 text-white hover:bg-white/10 transition-all duration-200 animate-[neon-glow_16s_ease-in-out_infinite]"
          aria-label="Sign Out"
        >
          <LogOut className="h-6 w-6 stroke-[3]" />
        </Button>
      </div>

      {/* Production Carousel */}
      <ProductionCarousel 
        userId={user.id} 
        onJoinSuccess={() => setShowJoinTribeDialog(true)}
      />

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
                icon: (
                  <div className="relative">
                    <CalendarDays className="h-12 w-12" />
                    {newEventsCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {newEventsCount > 9 ? '9+' : newEventsCount}
                      </div>
                    )}
                  </div>
                ),
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
                  title: 'Tribes Messages',
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
                  title: 'Friends Messages',
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
          <h2 className="text-lg font-bold text-white mb-4">{t('your_tickets')}</h2>
            <div className="space-y-4">
              {userQRCodes.map((qrCode) => (
                <div 
                  key={qrCode.id} 
                  className="cursor-pointer group overflow-hidden border border-border bg-card"
                  onClick={() => {
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

      {/* Join Tribe Success Dialog */}
      <Dialog open={showJoinTribeDialog} onOpenChange={setShowJoinTribeDialog}>
        <DialogContent className="sm:max-w-sm bg-purple-600/90 backdrop-blur-md border-purple-400/30 rounded-2xl p-8 animate-scale-in">
          <div className="text-center space-y-6">
            <p className="text-white font-bold text-lg leading-relaxed">
              You are now registered to our production and can buy tickets to our events
            </p>
            <Button 
              onClick={() => setShowJoinTribeDialog(false)}
              className="w-full bg-white hover:bg-white/90 text-purple-700 font-bold text-base py-6 rounded-xl"
            >
              Sababa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default UserDashboard;