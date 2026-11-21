import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function DashboardHome() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'admin' ? '/dashboard/upravljanje' : '/dashboard/pregled'} replace />;
}