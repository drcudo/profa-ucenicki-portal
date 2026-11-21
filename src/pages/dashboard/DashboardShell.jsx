import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { studentNav, teacherNav } from '@/lib/dashboardNav';
import HalftoneGround from '@/components/dashboard/HalftoneGround';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import { cn } from '@/lib/utils';
import { RazinaProvider, useRazina } from '@/lib/RazinaContext';

export default function DashboardShell() {
  return (
    <RazinaProvider>
      <ShellBody />
    </RazinaProvider>
  );
}

function ShellBody() {
  const { user } = useAuth();
  const { razina } = useRazina();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rail, setRail] = useState(false);
  const [unread, setUnread] = useState(0);

  const isTeacher = user?.role === 'admin';
  const nav = isTeacher ? teacherNav : studentNav;
  const active = nav.find((item) => pathname.startsWith(item.to)) ?? nav[0];

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);
  
  useEffect(() => {
    if (!user) return;
    const query = isTeacher ? {} : { ucenik_email: user.email, status: 'Potreban ispravak' };
    base44.entities.Predaja.count(query)
      .then((count) => setUnread(count))
      .catch(() => setUnread(0));
  }, [user, isTeacher]);

  const teacherRoutes = [
    '/dashboard/upravljanje',
    '/dashboard/dodjele',
    '/dashboard/grupe',
    '/dashboard/ucenici',
    '/dashboard/predaje',
  ];
  const studentRoutes = [
    '/dashboard/pregled',
    '/dashboard/udzbenik',
    '/dashboard/zadaca',
    '/dashboard/ispiti',
    '/dashboard/napredak',
  ];
  const blocked = isTeacher
    ? studentRoutes.some((route) => pathname.startsWith(route))
    : teacherRoutes.some((route) => pathname.startsWith(route));

  if (blocked) {
    return <Navigate to={isTeacher ? '/dashboard/upravljanje' : '/dashboard/pregled'} replace />;
  }

  return (
    <div className="relative min-h-screen bg-ground font-body">
      <HalftoneGround />

      <div className="relative z-10 flex min-h-screen">
        {drawerOpen && (
          <button
            type="button"
            aria-label="Zatvori navigaciju"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-30 bg-foreground/30 md:hidden"
          />
        )}

        <aside
          className={cn(
            'shell-card fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col transition-transform duration-300 md:static md:z-auto md:m-3 md:rounded-xl md:transition-[width]',
            rail ? 'md:w-[72px]' : 'md:w-[252px]',
            drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          )}
        >
          <DashboardSidebar
            nav={nav}
            rail={rail}
            razina={razina}
            showRazina={!isTeacher}
            onToggleRail={() => setRail((value) => !value)}
            onNavigate={() => setDrawerOpen(false)}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar
            pageLabel={active?.label ?? 'Dashboard'}
            user={user}
            unread={unread}
            onOpenDrawer={() => setDrawerOpen(true)}
            primaryTo={isTeacher ? '/dashboard/upravljanje' : '/dashboard/zadaca'}
            primaryLabel={isTeacher ? 'Novo gradivo' : 'Predaj zadaću'}
            bellTo={isTeacher ? '/dashboard/predaje' : '/dashboard/zadaca'}
            searchTo={isTeacher ? '/dashboard/upravljanje' : '/dashboard/udzbenik'}
          />
          <main className="min-w-0 flex-1 px-3 pb-12 sm:px-5">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}