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
    <div className="w-full">
      <Tabs defaultValue="user" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5 backdrop-blur-sm border border-white/10">
          <TabsTrigger 
            value="user" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white font-semibold"
          >
            🎵 User Access
          </TabsTrigger>
          <TabsTrigger 
            value="admin"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-secondary data-[state=active]:text-white font-semibold"
          >
            👑 Admin Access
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="user" className="space-y-0">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-neon">
                  <span className="text-2xl">🎵</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-glow">
                    {isUserLogin ? "Welcome Back!" : "Join the Tribe"}
                  </h2>
                  <p className="text-muted-foreground font-medium">
                    {isUserLogin ? "Sign in to your account" : "Create your account and get instant access"}
                  </p>
                </div>
              </div>
              
              {/* Toggle Button */}
              <button
                onClick={onToggleUserLogin}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-dark text-white px-6 py-3 rounded-2xl font-semibold shadow-neon hover-lift transition-all duration-300"
              >
                {isUserLogin ? (
                  <div className="flex items-center gap-2">
                    <span>✨</span>
                    <span>New here? Sign Up</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>🔑</span>
                    <span>Already a member? Sign In</span>
                  </div>
                )}
              </button>
            </div>
            
            <div className="bg-glass backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-modern">
              {isUserLogin ? (
                <SignInForm />
              ) : (
                <SignUpForm />
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="admin" className="space-y-0">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center shadow-neon">
                  <span className="text-2xl">👑</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-glow">Admin Portal</h2>
                  <p className="text-muted-foreground font-medium">
                    Sign in with your admin credentials
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-glass backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-modern">
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