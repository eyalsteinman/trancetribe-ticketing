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
    <div className="auth-glass rounded-2xl overflow-hidden">
      <Tabs defaultValue="user" className="w-full">
        <TabsList className="grid w-full grid-cols-2 auth-glass-strong rounded-2xl m-2">
          <TabsTrigger value="user" className="text-black data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl font-semibold">
            {t('user')}
          </TabsTrigger>
          <TabsTrigger value="admin" className="text-black data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl font-semibold">
            {t('admin')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="user" className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col space-y-4">
              <h3 className="text-xl font-semibold text-white text-center">
                {t('user_login_registration')}
              </h3>
              <button
                onClick={onToggleUserLogin}
                className="auth-button px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 self-center w-full max-w-[200px] text-center"
              >
                {isUserLogin ? (
                  <div className="text-center">
                    <div>{t('dont_have_account')}</div>
                    <div className="font-bold">{t('sign_up')}</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div>{t('have_account')}</div>
                    <div className="font-bold">{t('sign_in')}</div>
                  </div>
                )}
              </button>
            </div>
            <p className="text-white/80 text-center text-sm">
              {isUserLogin ? t('sign_in_to_account') : t('create_account_description')}
            </p>
          </div>
          
          <div className="mt-6">
            {isUserLogin ? (
              <SignInForm />
            ) : (
              <SignUpForm />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="admin" className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white text-center">{t('admin_access')}</h3>
            <p className="text-white/80 text-center text-sm">{t('admin_credentials_description')}</p>
          </div>
          <AdminForm 
            onShowAdminPassword={onShowAdminPassword}
            pendingAdminSignup={pendingAdminSignup}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};