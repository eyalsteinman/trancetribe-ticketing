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
    <Tabs defaultValue="user" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="user">User</TabsTrigger>
        <TabsTrigger value="admin">Admin</TabsTrigger>
      </TabsList>
      
      <TabsContent value="user">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>User Login/Registration</CardTitle>
            {/* Toggle Button - Right side without overlap */}
            <button
              onClick={onToggleUserLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-medium leading-tight ml-auto"
            >
              {isUserLogin ? (
                <>
                  <div>Don't have account?</div>
                  <div>Sign Up</div>
                </>
              ) : (
                <>
                  <div>Have account?</div>
                  <div>Sign In</div>
                </>
              )}
            </button>
            </div>
            <CardDescription>
              {isUserLogin ? "Sign in to your account" : "Create your account with your full name and get instant access"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isUserLogin ? (
              <SignInForm />
            ) : (
              <SignUpForm />
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="admin">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Sign in with your admin credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminForm 
              onShowAdminPassword={onShowAdminPassword}
              pendingAdminSignup={pendingAdminSignup}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};