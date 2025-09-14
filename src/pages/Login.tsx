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
      className="min-h-screen flex items-center justify-center transition-colors duration-500"
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="w-full space-y-6 login-page-force-black">
        {/* Login Form */}
        <div className="container-section">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">
                  Trance Tribe - Choose your access type
                </CardTitle>
                <p className="text-center">
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </p>
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm hover:no-underline bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                  </Button>
                </div>

                <div className="text-center py-4">
                  <p className="text-sm font-medium">or continue with</p>
                </div>

                <div className="space-y-2">
                  <Button 
                    variant="full"
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
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
                  </Button>
                  
                  <Button 
                    variant="full"
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
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
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Production Browser Section */}
        <div className="container-section">
          <ProductionBrowser onLoginPrompt={() => {}} />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default LoginPage;