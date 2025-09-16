import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { 
  Camera, 
  Users, 
  UserCheck, 
  Plus, 
  Edit, 
  Building2, 
  ScanBarcode, 
  Wine, 
  LogOut, 
  MessageCircle,
  Shield,
  Globe,
  Crown,
  Gamepad2,
  Sparkles,
  Settings
} from 'lucide-react';
import ModernFooter from '@/components/ui/modern-footer';
import Navigation from '@/components/ui/navigation';

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      toast({ title: "Success", description: "Signed out successfully!" });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast({ title: "Info", description: "Logged out locally." });
    }
  };

  return (
    <div className="page-container">
      <Navigation 
        isAdmin={true}
        currentPage={currentView}
        onNavigate={(page) => setCurrentView(page)}
      />

      <div className="fixed inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-40 bg-primary/10 rounded-full animate-float"></div>
        <div className="absolute bottom-32 right-20 w-24 h-24 bg-accent/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="content-wrapper pt-20 pb-8">
        <div className="flex items-center justify-between">
          <div className="animate-slide-in-up">
            <h1 className="text-responsive-lg font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-xl text-primary font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Control Center ⚡
            </p>
          </div>
          <Button 
            variant="glass" 
            size="icon-sm"
            onClick={handleSignOut}
            className="hover:scale-110 hover:shadow-glow"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="content-wrapper">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in-scale">
          {[
            { id: 'users', title: 'Registered Users', icon: <Users className="h-10 w-10" />, gradient: 'from-blue-500/20 to-primary/20' },
            { id: 'scanner', title: 'QR Scanner', icon: <Camera className="h-10 w-10" />, gradient: 'from-green-500/20 to-emerald-500/20' },
            { id: 'create-party', title: 'Create Party', icon: <Plus className="h-10 w-10" />, gradient: 'from-purple-500/20 to-pink-500/20' },
            { id: 'edit-parties', title: 'Edit Parties', icon: <Edit className="h-10 w-10" />, gradient: 'from-orange-500/20 to-red-500/20' },
            { id: 'guest-list', title: 'Guest List', icon: <UserCheck className="h-10 w-10" />, gradient: 'from-cyan-500/20 to-blue-500/20' },
            { id: 'productions', title: 'Productions', icon: <Building2 className="h-10 w-10" />, gradient: 'from-indigo-500/20 to-purple-500/20' },
            { id: 'games', title: 'Admin Games', icon: <Gamepad2 className="h-10 w-10" />, gradient: 'from-green-500/20 to-teal-500/20' },
            { id: 'bar-tab', title: 'Bar Tab', icon: <Wine className="h-10 w-10" />, gradient: 'from-purple-500/20 to-pink-500/20' },
            { id: 'add-admin', title: 'Add Admin', icon: <Shield className="h-10 w-10" />, gradient: 'from-red-500/20 to-orange-500/20' },
            { id: 'messages', title: 'Message Users', icon: <MessageCircle className="h-10 w-10" />, gradient: 'from-blue-500/20 to-cyan-500/20' },
          ].map((item, index) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className="glass hover:glass-strong p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-glow group animate-fade-in-scale"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`bg-gradient-to-br ${item.gradient} p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <div className="text-foreground group-hover:text-primary transition-colors duration-300">
                  {item.icon}
                </div>
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                {item.title}
              </h3>
            </button>
          ))}
        </div>
      </div>

      <ModernFooter />
    </div>
  );
};

export default AdminDashboard;