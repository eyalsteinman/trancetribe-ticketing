import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';

interface AdminSignupNewProps {
  onBack: () => void;
}

const availableTiles = [
  { id: 'registered-users', label: 'Registered Users' },
  { id: 'guest-list', label: 'Guest List' },
  { id: 'productions', label: 'Productions' },
  { id: 'parties', label: 'Parties' },
  { id: 'manage-admins', label: 'Manage Admins' },
  { id: 'messages', label: 'Messages' },
  { id: 'games', label: 'Games' },
  { id: 'bar-tabs', label: 'Bar Tabs' },
  { id: 'analytics', label: 'Analytics' },
];

const AdminSignupNew = ({ onBack }: AdminSignupNewProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [adminLevel, setAdminLevel] = useState<'level1' | 'level2' | 'level3'>('level1');
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  const handleTileToggle = (tileId: string) => {
    setSelectedTiles(prev => 
      prev.includes(tileId) 
        ? prev.filter(id => id !== tileId)
        : [...prev, tileId]
    );
  };

  const handleAdminSignup = async () => {
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error", 
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    if (selectedTiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one tile for the admin",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Starting admin signup process...');

      // Sign up the user
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName} ${lastName}`.trim() || email.split('@')[0]
          }
        }
      });

      console.log('Signup result:', { signupData, signupError });

      if (signupError) {
        throw signupError;
      }

      if (!signupData.user) {
        throw new Error('No user returned from signup');
      }

      const userId = signupData.user.id;
      console.log('User signed up with ID:', userId);

      // Wait a moment for the trigger to create the profile and user role
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add admin role to the newly created user
      console.log('Adding admin role...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (roleError) {
        console.error('Admin role assignment failed:', roleError);
        throw new Error('Failed to assign admin role: ' + roleError.message);
      }

      // Get current user ID for created_by field
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Create admin profile with level and tile permissions
      console.log('Creating admin profile...');
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .insert({
          user_id: userId,
          admin_level: adminLevel,
          allowed_tiles: selectedTiles,
          created_by: currentUser?.id || null
        });

      if (profileError) {
        console.error('Admin profile creation failed:', profileError);
        throw new Error('Failed to create admin profile: ' + profileError.message);
      }

      console.log('Admin account created successfully');

      toast({
        title: "Success",
        description: signupData.user.email_confirmed_at 
          ? "Admin account created successfully! The new admin can now login."
          : "Admin account created! The new admin will need to check their email to confirm their account before logging in.",
      });

      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      setAdminLevel('level1');
      setSelectedTiles([]);

      // Go back to main page after a short delay
      setTimeout(() => {
        onBack();
      }, 2000);

    } catch (error: any) {
      console.error('Error during admin signup:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
            Create Admin Account
          </h1>
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="on-color back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <Card className="w-full max-w-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Admin Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
            </div>

            <div>
              <Label htmlFor="adminLevel">Admin Level *</Label>
              <Select value={adminLevel} onValueChange={(value: 'level1' | 'level2' | 'level3') => setAdminLevel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select admin level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="level1">Level 1 - Basic Admin</SelectItem>
                  <SelectItem value="level2">Level 2 - Advanced Admin</SelectItem>
                  <SelectItem value="level3">Level 3 - Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Admin Dashboard Tiles *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select which tiles this admin will have access to in the dashboard:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableTiles.map((tile) => (
                  <div key={tile.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={tile.id}
                      checked={selectedTiles.includes(tile.id)}
                      onCheckedChange={() => handleTileToggle(tile.id)}
                    />
                    <Label 
                      htmlFor={tile.id} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tile.label}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedTiles.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedTiles.length} tile{selectedTiles.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            <button 
              onClick={handleAdminSignup} 
              disabled={loading} 
              className="w-full px-4 py-3 rounded font-medium border border-gray-300 hover:bg-gray-50"
              style={{ color: '#000000', backgroundColor: '#ffffff' }}
            >
              {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSignupNew;