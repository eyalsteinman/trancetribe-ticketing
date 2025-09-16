import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User } from '@supabase/supabase-js';
import { Calendar, UserIcon, Gamepad2, Crown, ShieldCheck, LogOut, Users, IdCard, Heart, Wine, MessageCircle, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import ModernFooter from '@/components/ui/modern-footer';
import HamburgerMenu from '@/components/ui/hamburger-menu';
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
    <div className="min-h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 gradient-primary opacity-20"></div>
      <div className="fixed inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-blue/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-neon-pink/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Hamburger Menu */}
      <HamburgerMenu 
        isAdmin={false}
        onNavigate={setCurrentView}
        onSignOut={handleSignOut}
        unreadMessageCount={unreadMessageCount}
        unreadDirectMessageCount={unreadDirectMessageCount}
      />

      <div className="relative z-10 min-h-screen p-4 pt-20">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
            {nickname ? t('welcome_back') : t('user_dashboard')}
          </h1>
          {nickname && (
            <p className="text-2xl text-accent font-semibold animate-scale-in delay-300">{nickname}!</p>
          )}
        </div>

        {/* Dashboard Grid - Modern Circle Buttons */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-6 animate-fade-in delay-500">
            {[
              { id: 'parties', title: t('events_parties'), icon: Calendar, gradient: 'gradient-primary' },
              { id: 'nickname', title: t('my_info'), icon: UserIcon, gradient: 'gradient-electric' },
              { id: 'social', title: t('social_networks'), icon: Users, gradient: 'gradient-cyber' },
              { id: 'insurance', title: t('insurance'), icon: ShieldCheck, gradient: 'gradient-primary' },
              { id: 'vip', title: t('vip'), icon: Crown, gradient: 'gradient-electric' },
              { id: 'personal-code', title: t('personal_code'), icon: IdCard, gradient: 'gradient-cyber' },
              { id: 'friends-codes', title: t('friends_codes'), icon: Heart, gradient: 'gradient-primary' },
              { id: 'bar-tab', title: t('bar_tab'), icon: Wine, gradient: 'gradient-electric' },
              { id: 'faq', title: t('faq_contact'), icon: Users, gradient: 'gradient-cyber' },
              { 
                id: 'messages', 
                title: t('messages'), 
                icon: MessageCircle, 
                gradient: 'gradient-primary',
                badge: unreadMessageCount > 0 ? unreadMessageCount : undefined
              },
              { 
                id: 'direct-messages', 
                title: t('direct_messages'), 
                icon: Mail, 
                gradient: 'gradient-electric',
                badge: unreadDirectMessageCount > 0 ? unreadDirectMessageCount : undefined
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.id} 
                  className="flex flex-col items-center space-y-3 group animate-scale-in"
                  style={{ animationDelay: `${index * 100 + 600}ms` }}
                >
                  <Button
                    variant="circle"
                    size="circle"
                    onClick={() => setCurrentView(item.id as any)}
                    className={`relative ${item.gradient} hover:scale-110 transition-all duration-300 hover:shadow-neon active:scale-95 circle-button`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                    {item.badge && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold border-2 border-white">
                        {item.badge > 9 ? '9+' : item.badge}
                      </div>
                    )}
                  </Button>
                  <p className="text-sm text-center text-foreground font-medium group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* QR Codes Section */}
        {userQRCodes.length > 0 && (
          <div className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent mb-6 text-center">
              {t('your_tickets')}
            </h2>
            <div className="grid gap-6">
              {userQRCodes.map((qrCode) => (
                <div 
                  key={qrCode.id} 
                  className="glass p-6 rounded-3xl border border-white/10 cursor-pointer group hover:scale-[1.02] transition-all duration-300"
                  onClick={() => {
                    localStorage.setItem('selectedPartyId', qrCode.party_id);
                    setCurrentView('parties');
                  }}
                >
                  <h3 className="font-bold text-xl text-foreground mb-2">
                    {qrCode.parties?.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {qrCode.parties?.date ? new Date(qrCode.parties.date).toLocaleDateString() : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <ModernFooter />
      </div>
    </div>
  );
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
        <ModernFooter />
      </div>
    </div>
    </div>
  );
};

export default UserDashboard;