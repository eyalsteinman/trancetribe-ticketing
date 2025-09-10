import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';
import AdminSignupNew from './AdminSignupNew';

interface AdminSignupProps {
  onBack: () => void;
}

const AdminSignup = ({ onBack }: AdminSignupProps) => {
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const { backgroundColor, isBackgroundDark } = useBackground();

  if (showCreateAdmin) {
    return <AdminSignupNew onBack={() => setShowCreateAdmin(false)} />;
  }

  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ 
        backgroundColor
      }}
    >
      <div className="w-full max-w-none">
        <div className="flex items-center justify-between mb-6">
          <h1 
            className="text-2xl font-bold"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Admin Management
          </h1>
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="on-color back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => setShowCreateAdmin(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Create New Admin with Role
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;