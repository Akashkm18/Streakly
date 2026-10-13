import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface StreaklyLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const StreaklyLayout: React.FC<StreaklyLayoutProps> = ({
  children,
  title,
  subtitle,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar theme={theme} onToggleTheme={onToggleTheme} />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          theme={theme}
          onToggleTheme={onToggleTheme}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          title={title}
          subtitle={subtitle}
        />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
