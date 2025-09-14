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
            <CardTitle>User Login/Registration</CardTitle>
            <CardDescription>
              {isUserLogin ? "Sign in to your account" : "Create your account with your full name and get instant access"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isUserLogin ? (
              <SignInForm onToggleMode={onToggleUserLogin} />
            ) : (
              <SignUpForm onToggleMode={onToggleUserLogin} />
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