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
      <TabsList className="grid w-full grid-cols-2 glass-card border-glass-border mb-6">
        <TabsTrigger 
          value="user" 
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
        >
          {t('user')}
        </TabsTrigger>
        <TabsTrigger 
          value="admin"
          className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground transition-all duration-300"
        >
          {t('admin')}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="user" className="mt-0">
        <Card className="glass-card border-glass-border shadow-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-2xl font-bold text-foreground">
                {t('user_login_registration')}
              </CardTitle>
              <button
                onClick={onToggleUserLogin}
                className="glass-button btn-press px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-glow whitespace-nowrap min-w-max"
              >
                {isUserLogin ? (
                  <div className="text-center leading-tight">
                    <div className="text-xs opacity-80">{t('dont_have_account')}</div>
                    <div className="font-semibold text-sm">{t('sign_up')}</div>
                  </div>
                ) : (
                  <div className="text-center leading-tight">
                    <div className="text-xs opacity-80">{t('have_account')}</div>
                    <div className="font-semibold text-sm">{t('sign_in')}</div>
                  </div>
                )}
              </button>
            </div>
            <CardDescription className="text-muted-foreground text-base">
              {isUserLogin ? t('sign_in_to_account') : t('create_account_description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isUserLogin ? (
              <SignInForm />
            ) : (
              <SignUpForm />
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="admin" className="mt-0">
        <Card className="glass-card border-glass-border shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">
              {t('admin_access')}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              {t('admin_credentials_description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
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