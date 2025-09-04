import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import ProductionBrowser from '@/components/ProductionBrowser';

interface LoginPageProps {
  onSuccess: () => void;
}

const LoginPage = ({ onSuccess }: LoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  const handleAuth = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (isSignUp && (!firstName || !lastName)) {
      toast({
        title: "Error", 
        description: "Please provide first and last name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              phone_number: phoneNumber,
              display_name: `${firstName} ${lastName}`
            }
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Account created! Please check your email to verify your account."
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500"
      style={{ backgroundColor }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Production Browser Section */}
        {!showLoginForm && (
          <Card>
            <CardContent className="p-6">
              <ProductionBrowser onLoginPrompt={() => setShowLoginForm(true)} />
            </CardContent>
          </Card>
        )}
        
        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle 
              className="text-center text-2xl font-bold"
              style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
            >
              {isSignUp ? 'Sign Up' : 'Welcome Back'}
            </CardTitle>
            {showLoginForm && (
              <div className="text-center">
                <Button 
                  variant="link" 
                  onClick={() => setShowLoginForm(false)}
                  className="text-sm"
                >
                  ← Back to Browse Productions
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name *</label>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name *</label>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Password *</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <Button 
              onClick={handleAuth}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Processing..." : (isSignUp ? "Sign Up" : "Sign In")}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-1">
          <div 
            className="text-sm font-medium"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Trance Tribe Tickets
          </div>
          <div 
            className="text-xs"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            All rights reserved
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;