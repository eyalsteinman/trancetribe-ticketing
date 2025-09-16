import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { AdminForm } from './AdminForm';

interface AuthFormProps {
  onShowAdminPassword: (email: string, password: string) => void;
  pendingAdminSignup: {email: string, password: string} | null;
  isUserLogin: boolean;
  onToggleUserLogin: () => void;
}

export const AuthForm = ({ 
  onShowAdminPassword, 
  pendingAdminSignup, 
  isUserLogin, 
  onToggleUserLogin 
}: AuthFormProps) => {
  return (
    <div className="w-full max-w-full overflow-hidden">
      <Tabs defaultValue="user" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-white/5 backdrop-blur-sm border border-white/10 text-xs sm:text-sm">
          <TabsTrigger 
            value="user" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white font-semibold px-2 py-2 text-xs sm:text-sm"
          >
            🎵 User Access
          </TabsTrigger>
          <TabsTrigger 
            value="admin"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-secondary data-[state=active]:text-white font-semibold px-2 py-2 text-xs sm:text-sm"
          >
            👑 Admin Access
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="user" className="space-y-0 w-full">
          <div className="space-y-4 sm:space-y-6 w-full">
            <div className="text-center space-y-2 w-full">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-neon flex-shrink-0">
                  <span className="text-xl sm:text-2xl">🎵</span>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-black text-glow">
                    {isUserLogin ? "Welcome Back!" : "Join the Tribe"}
                  </h2>
                  <p className="text-muted-foreground font-medium text-sm sm:text-base max-w-xs sm:max-w-none mx-auto">
                    {isUserLogin ? "Sign in to your account" : "Create your account and get instant access"}
                  </p>
                </div>
              </div>
              
              {/* Toggle Button */}
              <button
                onClick={onToggleUserLogin}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-dark text-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-semibold shadow-neon hover-lift transition-all duration-300 text-sm sm:text-base w-full sm:w-auto"
              >
                {isUserLogin ? (
                  <div className="flex items-center justify-center gap-2">
                    <span>✨</span>
                    <span>New here? Sign Up</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>🔑</span>
                    <span>Already a member? Sign In</span>
                  </div>
                )}
              </button>
            </div>
            
            <div className="bg-glass backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 shadow-modern w-full">
              {isUserLogin ? (
                <SignInForm />
              ) : (
                <SignUpForm />
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="admin" className="space-y-0 w-full">
          <div className="space-y-4 sm:space-y-6 w-full">
            <div className="text-center space-y-2 w-full">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center shadow-neon flex-shrink-0">
                  <span className="text-xl sm:text-2xl">👑</span>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-black text-glow">Admin Portal</h2>
                  <p className="text-muted-foreground font-medium text-sm sm:text-base max-w-xs sm:max-w-none mx-auto">
                    Sign in with your admin credentials
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-glass backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 shadow-modern w-full">
              <AdminForm 
                onShowAdminPassword={onShowAdminPassword}
                pendingAdminSignup={pendingAdminSignup}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};