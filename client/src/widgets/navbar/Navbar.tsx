import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/entities/user/model/useAuthStore';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/ui/Toast';
import { getSocket } from '@/shared/api/socket';
import {
  Sprout,
  LayoutDashboard,
  Trees,
  Sparkles,
  Users,
  Timer,
  Dna,
  Gift,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';

export interface NavbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Setup live cheer listening via Socket.IO
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const socket = getSocket();
    socket.emit('register_user', user.id);

    const handleCheerReceived = (cheer: { senderName: string; emoji: string; message?: string }) => {
      addToast({
        type: 'success',
        title: `${cheer.emoji} Cheer from ${cheer.senderName}!`,
        message: cheer.message || `${cheer.senderName} cheered your botanical growth!`,
      });
    };

    socket.on('cheer_received', handleCheerReceived);

    return () => {
      socket.off('cheer_received', handleCheerReceived);
    };
  }, [isAuthenticated, user]);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/garden', label: 'Garden', icon: Trees },
    { to: '/coach', label: 'Coach', icon: Sparkles },
    { to: '/rooms', label: 'Rooms', icon: Users },
    { to: '/focus', label: 'Focus', icon: Timer },
    { to: '/insights', label: 'Insights', icon: Dna },
    { to: '/wrapped', label: 'Wrapped', icon: Gift },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-950/60 bg-[#0B1914]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-garden group-hover:scale-105 transition-all duration-300">
            <Sprout className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-heading tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              Bloom
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
              Garden
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        {isAuthenticated && (
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-emerald-100/70 hover:text-white hover:bg-emerald-900/30'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Section Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-emerald-200/70 hover:text-white hover:bg-emerald-900/40 border border-transparent hover:border-emerald-800/40 transition-colors cursor-pointer"
            title="Toggle botanical theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-emerald-800" />}
          </button>

          {/* User Profile / Logout or Login */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-emerald-100 leading-none">{user?.name}</span>
                <span className="text-[10px] text-emerald-400/80 leading-tight">Gardener</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-emerald-300/70 hover:text-red-400 hover:bg-emerald-900/40 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Enter Garden
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isAuthenticated && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-emerald-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="lg:hidden border-t border-emerald-950 bg-[#0B1914] px-4 py-3 space-y-1.5">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${
                location.pathname === to
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-emerald-200/70 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
