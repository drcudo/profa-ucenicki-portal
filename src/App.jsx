import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';

// Autentifikacija
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Mfa from '@/pages/Mfa';

// Dashboard
import DashboardShell from '@/pages/dashboard/DashboardShell';
import DashboardHome from '@/pages/dashboard/DashboardHome';
import Pregled from '@/pages/dashboard/Pregled';
import Udzbenik from '@/pages/dashboard/Udzbenik';
import Zadaca from '@/pages/dashboard/Zadaca';
import Ispiti from '@/pages/dashboard/Ispiti';
import Napredak from '@/pages/dashboard/Napredak';
import Upravljanje from '@/pages/dashboard/Upravljanje';
import Dodjele from '@/pages/dashboard/Dodjele';
import Ucenici from '@/pages/dashboard/Ucenici';
import Predaje from '@/pages/dashboard/Predaje';
import Grupe from '@/pages/dashboard/Grupe';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, checkUserAuth } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError && authError.type === 'auth_required') {
    navigateToLogin();
    return null;
  }

  if (authError?.type === 'auth_error') {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md text-center">
          <p role="alert" className="text-sm text-destructive">
            {authError.message}
          </p>
          <button
            type="button"
            onClick={checkUserAuth}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Pokušaj ponovno
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Početna preusmjerava izravno u portal */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Autentifikacija */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mfa" element={<Mfa />} />

      {/* Portal za prijavljene učenike i nastavnika */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/dashboard" element={<DashboardShell />}>
          <Route index element={<DashboardHome />} />
          <Route path="pregled" element={<Pregled />} />
          <Route path="udzbenik" element={<Udzbenik />} />
          <Route path="zadaca" element={<Zadaca />} />
          <Route path="ispiti" element={<Ispiti />} />
          <Route path="napredak" element={<Napredak />} />
          <Route path="upravljanje" element={<Upravljanje />} />
          <Route path="dodjele" element={<Dodjele />} />
          <Route path="grupe" element={<Grupe />} />
          <Route path="ucenici" element={<Ucenici />} />
          <Route path="predaje" element={<Predaje />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;