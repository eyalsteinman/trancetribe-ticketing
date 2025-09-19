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
        <TabsList className="grid w-full grid-cols-2 auth-glass-strong rounded-xl m-2">
          <TabsTrigger value="user" className="text-white data-[state=active]:bg-white/20 rounded-lg">
            {t('user')}
          </TabsTrigger>
          <TabsTrigger value="admin" className="text-white data-[state=active]:bg-white/20 rounded-lg">
            {t('admin')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="user" className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col space-y-3">
              <h3 className="text-xl font-semibold text-white text-center">
                {t('user_login_registration')}
              </h3>
              <button
                onClick={onToggleUserLogin}
                className="auth-button px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 self-center"
              >
                {isUserLogin ? (
                  <span className="text-center">
                    {t('dont_have_account')}<br />{t('sign_up')}
                  </span>
                ) : (
                  <span className="text-center">
                    {t('have_account')}<br />{t('sign_in')}
                  </span>
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