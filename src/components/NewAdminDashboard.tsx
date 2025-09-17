import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// Import all the existing admin views
import QRScanner from '@/components/QRScanner';
import AdminGuestList from '@/components/AdminGuestList';
import CreateParty from '@/components/CreateParty';
import EditParties from '@/components/EditParties';
import AdminProductions from '@/components/AdminProductions';
import ManageProductions from '@/components/ManageProductions';
import ManageAdmins from '@/components/ManageAdmins';
import RegisteredUsers from '@/components/RegisteredUsers';
import AdminGames from '@/components/AdminGames';
import NicknameManager from '@/components/NicknameManager';
import BarTabManager from '@/components/BarTabManager';
import BarTabScanner from '@/components/BarTabScanner';
import FAQContact from '@/components/FAQContact';
import AdminMessageSender from '@/components/AdminMessageSender';

interface NewAdminDashboardProps {
  user: User;
}

interface Tile {
  id: string;
  title: string;
  action: () => void;
}

const NewAdminDashboard: React.FC<NewAdminDashboardProps> = ({ user }) => {
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [adminName, setAdminName] = useState<string>('');
  
  // Swipe navigation state
  const [isDragging, setIsDragging] = useState(false);
  const [currentTileIndex, setCurrentTileIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragCurrentX, setDragCurrentX] = useState(0);
  const buttonRef = useRef<HTMLDivElement>(null);

  const tiles: Tile[] = [
    { id: 'scanner', title: 'Camera Scan', action: () => setCurrentView('scanner') },
    { id: 'guest-list', title: 'Guest List', action: () => setCurrentView('guest-list') },
    { id: 'create-party', title: 'Create Party', action: () => setCurrentView('create-party') },
    { id: 'edit-parties', title: 'Edit Parties', action: () => setCurrentView('edit-parties') },
    { id: 'my-productions', title: 'My Productions', action: () => setCurrentView('my-productions') },
    { id: 'manage-productions', title: 'Manage Productions', action: () => setCurrentView('manage-productions') },
    { id: 'manage-admins', title: 'Add Admin', action: () => setCurrentView('manage-admins') },
    { id: 'registered-users', title: 'Registered Users', action: () => setCurrentView('registered-users') },
    { id: 'admin-games', title: 'Admin Games', action: () => setCurrentView('admin-games') },
    { id: 'nickname', title: 'My Info', action: () => setCurrentView('nickname') },
    { id: 'bar-tab', title: 'Bar Tab', action: () => setCurrentView('bar-tab') },
    { id: 'bar-tab-scanner', title: 'Bartab Scanner', action: () => setCurrentView('bar-tab-scanner') },
    { id: 'faq', title: 'FAQ & Contact', action: () => setCurrentView('faq') },
    { id: 'message', title: 'Message Users', action: () => setCurrentView('message') },
  ];

  useEffect(() => {
    loadAdminProfile();
  }, [user]);

  const loadAdminProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setAdminName(profile.display_name || profile.first_name || 'Admin');
      }
    } catch (error) {
      console.error('Error loading admin profile:', error);
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

  // Touch/Mouse handlers for swipe navigation
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragCurrentX(e.clientX);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    setDragCurrentX(e.clientX);
    const deltaX = e.clientX - dragStartX;
    const sensitivity = 100; // pixels needed to change tile
    
    let newIndex = currentTileIndex - Math.floor(deltaX / sensitivity);
    newIndex = Math.max(0, Math.min(tiles.length - 1, newIndex));
    
    if (newIndex !== currentTileIndex) {
      setCurrentTileIndex(newIndex);
    }
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Execute the current tile's action
      tiles[currentTileIndex].action();
    }
  };

  // Render different views
  if (currentView !== 'dashboard') {
    const renderView = () => {
      switch (currentView) {
        case 'scanner': return <QRScanner onScan={() => {}} onClose={() => setCurrentView('dashboard')} />;
        case 'guest-list': return <AdminGuestList user={user} onBack={() => setCurrentView('dashboard')} />;
        case 'create-party': return <CreateParty onBack={() => setCurrentView('dashboard')} />;
        case 'edit-parties': return <EditParties onBack={() => setCurrentView('dashboard')} />;
        case 'my-productions': return <AdminProductions onBack={() => setCurrentView('dashboard')} />;
        case 'manage-productions': return <ManageProductions onBack={() => setCurrentView('dashboard')} />;
        case 'manage-admins': return <ManageAdmins onBack={() => setCurrentView('dashboard')} />;
        case 'registered-users': return <RegisteredUsers onBack={() => setCurrentView('dashboard')} />;
        case 'admin-games': return <AdminGames onGameSelect={() => {}} onBack={() => setCurrentView('dashboard')} />;
        case 'nickname': return <NicknameManager user={user} onBack={() => setCurrentView('dashboard')} />;
        case 'bar-tab': return <BarTabManager user={user} onBack={() => setCurrentView('dashboard')} />;
        case 'bar-tab-scanner': return <BarTabScanner user={user} onBack={() => setCurrentView('dashboard')} />;
        case 'faq': return <FAQContact onBack={() => setCurrentView('dashboard')} />;
        case 'message': return <AdminMessageSender adminId={user.id} onBack={() => setCurrentView('dashboard')} />;
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
            {adminName}
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
          <div className="bg-purple-900 w-80 p-6 animate-slide-in-right">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white text-xl font-bold">Admin Navigation</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="space-y-2">
              {tiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => {
                    tile.action();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left p-3 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  {tile.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Center Content */}
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        {/* Current Tile Display */}
        <div className="text-center mb-12">
          <h1 className="text-white text-4xl font-bold opacity-80 transition-all duration-300">
            {tiles[currentTileIndex]?.title}
          </h1>
        </div>

        {/* Navigation Instructions */}
        <div className="text-center mb-8">
          <p className="text-white text-sm opacity-70">
            move from side to side to navigate
          </p>
        </div>

        {/* Swipe Button */}
        <div
          ref={buttonRef}
          className={`w-20 h-20 rounded-full cursor-pointer select-none transition-all duration-200 ${
            isDragging 
              ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-110' 
              : 'bg-gray-400 shadow-lg shadow-gray-400/30'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  );
};

export default NewAdminDashboard;