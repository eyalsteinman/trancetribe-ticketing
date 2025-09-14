import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import ProductionBrowser from '@/components/ProductionBrowser';
import Footer from '@/components/ui/footer';

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
  const { toast } = useToast();

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
    <div className="min-h-screen flex flex-col bg-white text-black">
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-auto px-4 space-y-8">
          {/* Login Form */}
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="relative">
              <CardTitle className="text-center text-2xl font-bold text-black">
                User Login/Registration
              </CardTitle>
              {/* Sign In Button - Top Right */}
              {!isSignUp && (
                <button
                  onClick={() => setIsSignUp(true)}
                  className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-medium leading-tight"
                >
                  <div>Already have an account?</div>
                  <div>Sign In</div>
                </button>
              )}
              <p className="text-center text-black">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-black">First Name *</label>
                      <Input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                        required
                        className="bg-white text-black border-gray-300"
                        style={{ color: '#000000', backgroundColor: '#ffffff' }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-black">Last Name *</label>
                      <Input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                        required
                        className="bg-white text-black border-gray-300"
                        style={{ color: '#000000', backgroundColor: '#ffffff' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-black">Phone Number</label>
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="bg-white text-black border-gray-300"
                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="text-sm font-medium text-black">Email *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="bg-white text-black border-gray-300"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-black">Password *</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="bg-white text-black border-gray-300"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                />
              </div>

              <Button 
                onClick={handleAuth}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              >
                {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
              </Button>
            </CardContent>
          </Card>

          {/* Account Toggle Container - Only show Sign Up option when in Sign In mode */}
          {isSignUp && (
            <div className="account-toggle-container bg-white p-4 rounded-lg border border-gray-200 shadow-md">
              <div className="text-center">
                <button
                  onClick={() => setIsSignUp(false)}
                  className="text-sm px-6 py-3 rounded font-medium border border-gray-300 hover:bg-gray-50"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                >
                  Already have an account? Sign In
                </button>
              </div>
            </div>
          )}

          {/* Social Login Container */}
          <div className="social-login-container bg-white p-6 rounded-lg border border-gray-200 shadow-md">
            <div className="text-center py-4">
              <p className="text-sm font-medium text-black">or continue with</p>
            </div>

            <div className="space-y-3">
              <button 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded font-medium border border-gray-300 hover:bg-gray-50"
                style={{ color: '#000000', backgroundColor: '#ffffff' }}
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: window.location.origin
                    }
                  });
                  if (error) {
                    toast({
                      title: "Error",
                      description: error.message,
                      variant: "destructive"
                    });
                  }
                }}
              >
                Continue with Google
              </button>
              
              <button 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded font-medium border border-gray-300 hover:bg-gray-50"
                style={{ color: '#000000', backgroundColor: '#ffffff' }}
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'facebook',
                    options: {
                      redirectTo: window.location.origin
                    }
                  });
                  if (error) {
                    toast({
                      title: "Error",
                      description: error.message,
                      variant: "destructive"
                    });
                  }
                }}
              >
                Continue with Facebook
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Production Browser Section */}
      <div className="bg-white py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <ProductionBrowser onLoginPrompt={() => {}} />
        </div>
      </div>

      {/* Footer Container */}
      <div className="footer-container bg-white border-t border-gray-200 py-4">
        <div className="mt-12 pt-6 border-t border-border/50 text-center space-y-3">
          <h3 className="font-bold text-xl text-primary">Trance Tribes Tickets</h3>
          <p className="text-sm text-muted-foreground">
            Created by Eyal Steinman, all rights reserved 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;