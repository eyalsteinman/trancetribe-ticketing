import React, { useState } from 'react';
import { Button } from './button';
import { Sheet, SheetContent, SheetTrigger } from './sheet';
import { Menu, X, Calendar, UserIcon, Users, ShieldCheck, Crown, IdCard, Heart, Wine, MessageCircle, Mail, Camera, Plus, Edit, Building2, Settings2, ScanBarcode, Gamepad2, LogOut, UserPlus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface HamburgerMenuProps {
  isAdmin: boolean;
  onNavigate: (view: string) => void;
  onSignOut: () => void;
  unreadMessageCount?: number;
  unreadDirectMessageCount?: number;
}

const HamburgerMenu = ({ 
  isAdmin, 
  onNavigate, 
  onSignOut, 
  unreadMessageCount = 0,
  unreadDirectMessageCount = 0 
}: HamburgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  interface MenuItem {
    id: string;
    label: string;
    icon: any;
    badge?: number;
  }

  const userMenuItems: MenuItem[] = [
    { id: 'parties', label: t('events_parties'), icon: Calendar },
    { id: 'nickname', label: t('my_info'), icon: UserIcon },
    { id: 'social', label: t('social_networks'), icon: Users },
    { id: 'insurance', label: t('insurance'), icon: ShieldCheck },
    { id: 'vip', label: t('vip'), icon: Crown },
    { id: 'personal-code', label: t('personal_code'), icon: IdCard },
    { id: 'friends-codes', label: t('friends_codes'), icon: Heart },
    { id: 'bar-tab', label: t('bar_tab'), icon: Wine },
    { id: 'faq', label: t('faq_contact'), icon: Users },
    { id: 'messages', label: t('messages'), icon: MessageCircle, badge: unreadMessageCount },
    { id: 'direct-messages', label: t('direct_messages'), icon: Mail, badge: unreadDirectMessageCount },
  ];

  const adminMenuItems: MenuItem[] = [
    { id: 'scanner', label: t('camera_scan'), icon: Camera },
    { id: 'create-party', label: t('create_party'), icon: Plus },
    { id: 'edit-parties', label: t('edit_party'), icon: Edit },
    { id: 'registered-users', label: t('registered_users'), icon: Users },
    { id: 'guest-list', label: t('guest_list'), icon: UserIcon },
    { id: 'nickname', label: t('my_info'), icon: UserIcon },
    { id: 'manage-admins', label: t('add_admin'), icon: UserPlus },
    { id: 'admin-games', label: t('admin_games'), icon: Gamepad2 },
    { id: 'manage-productions', label: t('manage_productions'), icon: Building2 },
    { id: 'my-productions', label: t('my_productions'), icon: Settings2 },
    { id: 'bar-tab', label: t('bar_tab'), icon: Wine },
    { id: 'bar-tab-scanner', label: t('bar_tab_scanner'), icon: ScanBarcode },
    { id: 'faq', label: t('faq_contact'), icon: Users },
    { id: 'message', label: t('message_users'), icon: MessageCircle },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="glass" 
          size="icon" 
          className="fixed top-4 left-4 z-50 glass hover:scale-110"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 glass border-r border-white/10 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
              {t('trance_tribes')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin ? t('admin_dashboard') : t('user_dashboard')}
            </p>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 hover:bg-white/5 hover:text-primary group"
                  onClick={() => handleNavigate(item.id)}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5 group-hover:text-primary transition-colors" />
                    {item.badge && item.badge > 0 && (
                      <div className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {item.badge > 9 ? '9+' : item.badge}
                      </div>
                    )}
                  </div>
                  <span className="flex-1 text-left">{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <Button
              variant="destructive"
              className="w-full justify-start gap-3"
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
            >
              <LogOut className="h-5 w-5" />
              {t('sign_out')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HamburgerMenu;