import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useBackground } from '@/contexts/BackgroundContext';
import { User } from '@supabase/supabase-js';
import { Calendar, UserIcon, Crown, ShieldCheck, LogOut, Users, IdCard, Heart, Wine, MessageCircle, Mail } from 'lucide-react';
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
import ReorderableTilesLogic from './ReorderableTilesLogic';
import Insurance from './Insurance';
import PersonalCode from './PersonalCode';
import FriendsCodes from './FriendsCodes';
import UserBarTab from './UserBarTab';
import FAQContact from './FAQContact';
import UserMessages from './UserMessages';
import UserMessaging from './UserMessaging';
import { useProfileData } from '@/hooks/useProfileData';
import { useQRCodes } from '@/hooks/useQRCodes';
import { useMessageCounts } from '@/hooks/useMessageCounts';
import { useSignOut } from '@/hooks/useSignOut';

interface UserDashboardProps {
  user: User;
}

const UserDashboard = ({ user }: UserDashboardProps) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'parties' | 'nickname' | 'games' | 'color-changer' | 'dot-circle' | 'exploder' | 'haya-ninja' | 'social' | 'vip' | 'vip-detail' | 'insurance' | 'personal-code' | 'friends-codes' | 'bar-tab' | 'faq' | 'messages' | 'tribes' | 'direct-messages'>('dashboard');
  const [selectedProduction, setSelectedProduction] = useState<{id: string; name: string; logo_url: string | null; vip_description: string | null; vip_price: number | null} | null>(null);
  
  const { backgroundColor } = useBackground();
  const { profile } = useProfileData(user.id);
  const { qrCodes } = useQRCodes(user.id);
  const { unreadCount, unreadDirectCount, refetch: refetchMessages } = useMessageCounts(user.id);
  const { signOut } = useSignOut();

  // Optimized navigation handlers
  const handleNavigation = (view: typeof currentView) => {
    setCurrentView(view);
  };

  // Handle different views
  if (currentView === 'parties') {
    return <UserParties user={user} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'nickname') {
    return <PersonalizeEdit user={user} onBack={() => handleNavigation('dashboard')} />;
  }

  if (currentView === 'games') {
    return <UserGames onBack={() => setCurrentView('dashboard')} onGameSelect={(game) => setCurrentView(game as any)} />;
  }

  if (currentView === 'color-changer') {
    return <BoredScreen onBack={() => setCurrentView('games')} />;
  }

  if (currentView === 'dot-circle') {
    return <DotCircleGame onBack={() => handleNavigation('games')} adminId={user.id} adminNickname={profile?.nickname || ''} />;
  }

  if (currentView === 'exploder') {
    return <ExploderGame onBack={() => handleNavigation('games')} scope="user" playerNickname={profile?.nickname || ''} />;
  }

  if (currentView === 'haya-ninja') {
    return <HayaNinja onBack={() => handleNavigation('games')} scope="user" playerNickname={profile?.nickname || ''} />;
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
        nickname={profile?.nickname || ''}
        onBack={() => handleNavigation('dashboard')}
        onSelectProduction={(production) => {
          setSelectedProduction(production);
          handleNavigation('vip-detail');
        }}
      />
    );
  }

  if (currentView === 'vip-detail' && selectedProduction !== null) {
    return (
      <VIPProduction
        user={user}
        production={selectedProduction}
        onBack={() => handleNavigation('vip')}
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
      handleNavigation('dashboard');
      refetchMessages();
    }} userId={user.id} onOpenTribes={() => handleNavigation('tribes')} />;
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
          {profile?.nickname ? `Welcome back,` : 'User Dashboard'}
        </h1>
        {profile?.nickname && (
          <p className="text-lg text-primary font-semibold">{profile.nickname}!</p>
        )}
        <Button 
          variant="outline" 
          size="icon"
          onClick={signOut}
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
                title: 'Events\n& Parties',
                icon: <Calendar className="h-12 w-12" />,
                onClick: () => handleNavigation('parties'),
              },
              {
                id: 'nickname',
                title: 'My Info',
                icon: <UserIcon className="h-12 w-12" />,
                onClick: () => setCurrentView('nickname' as const),
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
                  id: 'faq',
                  title: 'FAQ & Contact',
                  icon: <Users className="h-12 w-12" />,
                  onClick: () => setCurrentView('faq' as const),
                },
                {
                  id: 'messages',
                  title: 'Messages',
                  icon: (
                    <div className="relative">
                      <MessageCircle className="h-12 w-12" />
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </div>
                  ),
                  onClick: () => handleNavigation('messages'),
                },
                {
                  id: 'direct-messages',
                  title: 'Direct Messages',
                  icon: (
                    <div className="relative">
                      <Mail className="h-12 w-12" />
                      {unreadDirectCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {unreadDirectCount > 9 ? '9+' : unreadDirectCount}
                        </div>
                      )}
                    </div>
                  ),
                  onClick: () => handleNavigation('direct-messages'),
                },
            ];
            return (
              <ReorderableTilesLogic 
                items={items} 
                orderKey={`dashboard-order-user-${user.id}`}
                onLongPress={() => {}}
              />
            );
          })()}
        </div>

      {/* QR Codes Section */}
      {qrCodes.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Your Tickets</h2>
            <div className="space-y-4">
              {qrCodes.map((qrCode) => (
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
                    handleNavigation('parties');
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
        
        
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default UserDashboard;