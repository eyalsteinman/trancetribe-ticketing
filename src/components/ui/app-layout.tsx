import React from 'react';
import PageHeader from '@/components/ui/page-header';
import Footer from '@/components/ui/footer';
import ScrollToTop from '@/components/ui/scroll-to-top';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Content width. Defaults to a comfortable reading width. */
  width?: 'md' | 'lg' | 'xl';
  className?: string;
  hideFooter?: boolean;
}

const widthMap = {
  md: 'max-w-md',
  lg: 'max-w-3xl',
  xl: 'max-w-7xl',
} as const;

/**
 * Shared page shell: identical background, header, spacing and footer
 * on every screen of the app.
 */
const AppLayout = ({
  title,
  subtitle,
  onBack,
  actions,
  children,
  width = 'lg',
  className,
  hideFooter = false,
}: AppLayoutProps) => {
  return (
    <div className="relative min-h-dvh w-full">
      <div className="auth-animated-bg" aria-hidden="true" />
      <div className="relative z-10 px-4 pb-16 pt-0 sm:px-6">
        <PageHeader
          title={title}
          subtitle={subtitle}
          onBack={onBack}
          showBackButton={!!onBack}
          actions={actions}
        />
        <main className={cn('mx-auto w-full space-y-6 py-2', widthMap[width], className)}>
          {children}
        </main>
        {!hideFooter && (
          <div className={cn('mx-auto w-full pt-8', widthMap[width])}>
            <Footer />
          </div>
        )}
      </div>
      <ScrollToTop />
    </div>
  );
};

export default AppLayout;
