import React, { useState, useEffect } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import RotatableDial from '@/components/RotatableDial';
import ReorderableMenuItems from '@/components/ReorderableMenuItems';

// Import all the existing views
import UserParties from '@/components/UserParties';
import PersonalizeEdit from '@/components/PersonalizeEdit';
import UserGames from '@/components/UserGames';
import DotCircleGame from '@/components/DotCircleGame';
import ExploderGame from '@/components/ExploderGame';
import HayaNinja from '@/components/HayaNinja';
import VIPHub from '@/components/VIP/VIPHub';
import VIPProduction from '@/components/VIP/VIPProduction';
import UserMessages from '@/components/UserMessages';
import SocialNetworks from '@/components/SocialNetworks';
import FAQContact from '@/components/FAQContact';
import PersonalCode from '@/components/PersonalCode';
import FriendsCodes from '@/components/FriendsCodes';
import NicknameManager from '@/components/NicknameManager';
import TicketManager from '@/components/TicketManager';
import UserBarTab from '@/components/UserBarTab';
import BoredScreen from '@/components/BoredScreen';

const UserMessaging = React.lazy(() => import('@/components/UserMessaging'));
const UserTribes = React.lazy(() => import('@/components/UserTribes'));

interface NewUserDashboardProps {
  user: User;
}

interface Tile {
  id: string;
  title: string;
  action: () => void;
}

const NewUserDashboard: React.FC<NewUserDashboardProps> = ({ user }) => {
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');

  const tiles: Tile[] = [
    { id: 'parties', title: 'My Events', action: () => setCurrentView('parties') },
    { id: 'personalize', title: 'Personalize', action: () => setCurrentView('personalize') },
    { id: 'games', title: 'Games Hub', action: () => setCurrentView('games') },
    { id: 'dot-circle', title: 'Dot Circle', action: () => setCurrentView('dot-circle') },
    { id: 'exploder', title: 'Exploder', action: () => setCurrentView('exploder') },
    { id: 'haya-ninja', title: 'Haya Ninja', action: () => setCurrentView('haya-ninja') },
    { id: 'vip', title: 'VIP Hub', action: () => setCurrentView('vip') },
    { id: 'vip-production', title: 'VIP Production', action: () => setCurrentView('vip-production') },
    { id: 'messages', title: 'Messages', action: () => setCurrentView('messages') },
    { id: 'messaging', title: 'Direct Messages', action: () => setCurrentView('messaging') },
    { id: 'tribes', title: 'User Tribes', action: () => setCurrentView('tribes') },
    { id: 'social', title: 'Social Networks', action: () => setCurrentView('social') },
    { id: 'faq', title: 'FAQ & Contact', action: () => setCurrentView('faq') },
    { id: 'personal-code', title: 'Personal Code', action: () => setCurrentView('personal-code') },
    { id: 'friends-codes', title: 'Friends Codes', action: () => setCurrentView('friends-codes') },
    { id: 'nickname', title: 'My Info', action: () => setCurrentView('nickname') },
    { id: 'tickets', title: 'Ticket Manager', action: () => setCurrentView('tickets') },
    { id: 'bar-tab', title: 'Bar Tab', action: () => setCurrentView('bar-tab') },
    { id: 'bored', title: 'Bored Screen', action: () => setCurrentView('bored') },
  ];

  const [orderedTiles, setOrderedTiles] = useState<Tile[]>(tiles);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserName(profile.display_name || profile.first_name || 'User');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const handleTileSelect = (tile: Tile) => {
    tile.action();
  };

  const handleReorder = (newTiles: Tile[]) => {
    setOrderedTiles(newTiles);
  };

  // Render different views
  if (currentView !== 'dashboard') {
    const renderView = () => {
      switch (currentView) {
        case 'parties': return <UserParties user={user} onBack={() => setCurrentView('dashboard')} />;
        case 'personalize': return <PersonalizeEdit user={user} onBack={() => setCurrentView('dashboard')} />;
        case 'games': return <UserGames onGameSelect={() => {}} onBack={() => setCurrentView('dashboard')} />;
        case 'dot-circle': return <DotCircleGame onBack={() => setCurrentView('dashboard')} adminId={user.id} adminNickname={userName} />;
        case 'exploder': return <ExploderGame onBack={() => setCurrentView('dashboard')} />;
        case 'haya-ninja': return <HayaNinja onBack={() => setCurrentView('dashboard')} />;
        case 'vip': return <VIPHub user={user} onBack={() => setCurrentView('dashboard')} onSelectProduction={() => {}} />;
        case 'vip-production': return <VIPProduction user={user} onBack={() => setCurrentView('dashboard')} production={null} />;
        case 'messages': return <UserMessages userId={user.id} onBack={() => setCurrentView('dashboard')} />;
        case 'messaging': 
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <UserMessaging userId={user.id} onBack={() => setCurrentView('dashboard')} />
            </React.Suspense>
          );
        case 'tribes': 
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <UserTribes userId={user.id} onBack={() => setCurrentView('dashboard')} />
            </React.Suspense>
          );
        case 'social': return <SocialNetworks userId={user.id} onBack={() => setCurrentView('dashboard')} />;
        case 'faq': return <FAQContact onBack={() => setCurrentView('dashboard')} />;
        case 'personal-code': return <PersonalCode user={user} onBack={() => setCurrentView('dashboard')} />;
        case 'friends-codes': return <FriendsCodes user={user} onBack={() => setCurrentView('dashboard')} />;
        case 'nickname': return <NicknameManager user={user} onBack={() => setCurrentView('dashboard')} />;
        case 'tickets': return <TicketManager tickets={[]} onChange={() => {}} maxTicketsPerUser={10} onMaxTicketsChange={() => {}} />;
        case 'bar-tab': return <UserBarTab userId={user.id} onBack={() => setCurrentView('dashboard')} />;
        case 'bored': return <BoredScreen onBack={() => setCurrentView('dashboard')} />;
        default: return null;
      }
    };

    return renderView();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-800 to-purple-900 relative overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 z-20">
        {/* Hamburger Menu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMenuOpen(true)}
          className="text-white hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Welcome Text */}
        <div className="text-center">
          <p className="text-white text-sm leading-tight">
            Welcome back
            <br />
            {userName}
          </p>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="text-white hover:bg-white/10"
        >
          <LogOut className="h-6 w-6" />
        </Button>
      </div>

      {/* Side Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-30 flex">
          <div className="bg-black/50 flex-1" onClick={() => setIsMenuOpen(false)} />
          <div className="bg-purple-900 w-64 p-4 animate-slide-in-right">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-lg font-bold">Navigation</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ReorderableMenuItems
              tiles={orderedTiles}
              onTileClick={(tile) => tile.action()}
              onCloseMenu={() => setIsMenuOpen(false)}
              onReorder={handleReorder}
            />
          </div>
        </div>
      )}

      {/* Center Content */}
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <RotatableDial tiles={orderedTiles} onTileSelect={handleTileSelect} />
      </div>
    </div>
  );
};

export default NewUserDashboard;