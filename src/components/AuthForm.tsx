import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import AdminPasswordForm from './AdminPasswordForm';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const { toast } = useToast();

  const handleUserSignup = async () => {
    if (!email || !password || !firstName || !lastName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: `${firstName} ${lastName}`,
            first_name: firstName,
            last_name: lastName
          }
        }
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Please check your email to confirm your account",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign up",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSignup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else if (data.user) {
        // Add user to admin role - this will work because the user is created
        try {
          const { error: roleError } = await (supabase as any)
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: 'admin'
            });
          
          if (roleError) {
            console.error('Error adding admin role:', roleError);
          }
        } catch (roleErr) {
          console.error('Role assignment error:', roleErr);
        }
        
        toast({
          title: "Success",
          description: "Admin account created successfully! You can now sign in.",
        });
        
        // Clear the form
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign up",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdminClick = () => {
    setShowAdminPassword(true);
  };

  const handleAdminPasswordSuccess = () => {
    setShowAdminPassword(false);
    // Now call the actual signup
    handleAdminSignup();
  };

  const handleAdminPasswordBack = () => {
    setShowAdminPassword(false);
  };

  if (showAdminPassword) {
    return (
      <AdminPasswordForm 
        onSuccess={handleAdminPasswordSuccess}
        onBack={handleAdminPasswordBack}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">TRANCE TRIBE</h1>
          <p className="text-muted-foreground mt-2">Choose your access type</p>
        </div>

        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          
          <TabsContent value="user">
            <Card>
              <CardHeader>
                <CardTitle>User Registration</CardTitle>
                <CardDescription>Create your account to get a unique QR code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button 
                  onClick={handleUserSignup}
                  disabled={loading || !email || !password || !firstName || !lastName}
                  className="w-full"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Access</CardTitle>
                <CardDescription>Sign in with your admin credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="email"
                  placeholder="Admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="space-y-2">
                  <Button 
                    onClick={handleAdminLogin}
                    disabled={loading || !email || !password}
                    className="w-full"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <Button 
                    onClick={handleCreateAdminClick}
                    variant="outline"
                    className="w-full"
                  >
                    Create Admin Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthForm;