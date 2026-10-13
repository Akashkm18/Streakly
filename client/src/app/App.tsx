import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/shared/ui/Toast';
import { useAuthStore } from '@/entities/user/model/useAuthStore';
import { ProtectedRoute } from './router/ProtectedRoute';
import { StreaklyLayout } from '@/widgets/layout/StreaklyLayout';

// Pages
import { LandingPage } from '@/pages/landing/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { LibraryPage } from '@/pages/library/LibraryPage';
import { HobbyDetailPage } from '@/pages/habits/HobbyDetailPage';
import { GoalsPage } from '@/pages/goals/GoalsPage';
import { BadgesPage } from '@/pages/badges/BadgesPage';
import { InsightsPage } from '@/pages/insights/InsightsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
  const { checkAuth } = useAuthStore();
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    checkAuth();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.classList.toggle('light', nextTheme === 'light');
  };

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected App Pages with Left Sidebar Layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <StreaklyLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              title="Dashboard"
              subtitle="Daily rhythm & hobby momentum"
            >
              <DashboardPage />
            </StreaklyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <StreaklyLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              title="Hobby Library"
              subtitle="Browse 40+ curated habits across 8 categories"
            >
              <LibraryPage />
            </StreaklyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hobbies/:id"
        element={
          <ProtectedRoute>
            <StreaklyLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              title="Hobby Details"
              subtitle="Metrics, personal records, and session history"
            >
              <HobbyDetailPage />
            </StreaklyLayout>
          </ProtectedRoute>
        }
      />
      {/* Fallback alias */}
      <Route
        path="/habit/:id"
        element={<Navigate to="/hobbies/:id" replace />}
      />

      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <StreaklyLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              title="Goals & Targets"
              subtitle="Deadline tracking with velocity projections"
            >
              <GoalsPage />
            </StreaklyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/badges"
        element={
          <ProtectedRoute>
            <StreaklyLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              title="Badges Shelf"
              subtitle="Milestone achievements and streak tiers"
            >
              <BadgesPage />
            </StreaklyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/insights"
        element={
          <ProtectedRoute>
            <StreaklyLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              title="365-Day Insights"
              subtitle="GitHub activity heatmap, category donut, and trends"
            >
              <InsightsPage />
            </StreaklyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <StreaklyLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              title="Settings & Export"
              subtitle="Freezes, advance rest days, and CSV/report downloads"
            >
              <SettingsPage theme={theme} onToggleTheme={toggleTheme} />
            </StreaklyLayout>
          </ProtectedRoute>
        }
      />

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
