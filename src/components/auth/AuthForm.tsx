import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { AdminForm } from './AdminForm';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  
  return (
    <Tabs defaultValue="user" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="user">{t('user')}</TabsTrigger>
        <TabsTrigger value="admin">{t('admin')}</TabsTrigger>
      </TabsList>
      
      <TabsContent value="user">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>{t('user_login_registration')}</CardTitle>
            {/* Toggle Button - Right side without overlap */}
            <button
              onClick={onToggleUserLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-medium leading-tight ml-auto"
            >
              {isUserLogin ? (
                <>
                  <div>{t('dont_have_account')}</div>
                  <div>{t('sign_up')}</div>
                </>
              ) : (
                <>
                  <div>{t('have_account')}</div>
                  <div>{t('sign_in')}</div>
                </>
              )}
            </button>
            </div>
            <CardDescription>
              {isUserLogin ? t('sign_in_to_account') : t('create_account_description')}
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
            <CardTitle>{t('admin_access')}</CardTitle>
            <CardDescription>{t('admin_credentials_description')}</CardDescription>
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