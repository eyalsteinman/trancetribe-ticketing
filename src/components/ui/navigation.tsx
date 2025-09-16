import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Calendar, 
  Settings, 
  MessageSquare, 
  CreditCard,
  Info,
  UserCheck,
  QrCode,
  Camera,
  Wine,
  Crown,
  Shield,
  Globe,
  Heart
} from 'lucide-react';

interface NavigationProps {
  isAdmin?: boolean;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const Navigation = ({ isAdmin = false, currentPage = 'dashboard', onNavigate }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'Registered Users', icon: Users },
    { id: 'guestlist', label: 'Guest List', icon: UserCheck },
    { id: 'parties', label: 'Create Party', icon: Calendar },
    { id: 'edit-parties', label: 'Edit Parties', icon: Settings },
    { id: 'productions', label: 'Manage Productions', icon: Globe },
    { id: 'my-productions', label: 'My Productions', icon: Crown },
    { id: 'games', label: 'Admin Games', icon: Heart },
    { id: 'bartab', label: 'Bar Tab', icon: Wine },
    { id: 'scanner', label: 'QR Scanner', icon: Camera },
    { id: 'add-admin', label: 'Add Admin', icon: Shield },
    { id: 'messages', label: 'Message Users', icon: MessageSquare },
    { id: 'faq', label: 'FAQ & Contact', icon: Info },
  ];

  const userNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'events', label: 'Events & Parties', icon: Calendar },
    { id: 'social', label: 'Social Networks', icon: Globe },
    { id: 'vip', label: 'VIP', icon: Crown },
    { id: 'personal-code', label: 'Personal Code', icon: QrCode },
    { id: 'friends-code', label: 'Friends Code', icon: Users },
    { id: 'bartab', label: 'Bar Tab', icon: CreditCard },
    { id: 'insurance', label: 'Insurance', icon: Shield },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'my-info', label: 'My Info', icon: Settings },
    { id: 'faq', label: 'FAQ & Contact', icon: Info },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleItemClick = (itemId: string) => {
    if (onNavigate) {
      onNavigate(itemId);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <Button
        variant="glass"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 glass hover:glass-strong"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Navigation Overlay */}
      <div className={`fixed inset-0 z-40 transition-all duration-300 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />

        {/* Navigation Panel */}
        <div className={`absolute left-0 top-0 h-full w-80 max-w-[80vw] glass-strong border-r border-white/20 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-foreground">
                {isAdmin ? 'Admin Panel' : 'Navigation'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isAdmin ? 'Administrative Controls' : 'Quick Access Menu'}
              </p>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary/20 text-primary border border-primary/30 shadow-glow' 
                          : 'hover:bg-white/5 text-foreground hover:text-primary'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <div className="text-xs text-muted-foreground text-center">
                Trance Tribes Tickets
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;