import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const AppLayout = ({ children, className = '' }: AppLayoutProps) => {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#4C1D95]">
      {/* Animated background */}
      <div className="auth-animated-bg" />
      
      {/* Content */}
      <div className={`min-h-screen w-full relative z-10 p-4 ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
