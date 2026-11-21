import { Link, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Logo from '@/components/public/Logo';
import { RAZINE } from '@/lib/razine';
import { cn } from '@/lib/utils';

export default function DashboardSidebar({ nav, rail, razina, showRazina, onToggleRail, onNavigate }) {
  const { pathname } = useLocation();
  const activeIndex = Math.max(0, nav.findIndex((item) => pathname.startsWith(item.to)));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn('flex h-16 shrink-0 items-center gap-2', rail ? 'justify-center px-2' : 'px-4')}>
        <Link
          to="/"
          aria-label="Profa — naslovna stranica"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Logo className="h-8 w-8 shrink-0" />
          {!rail && <span className="truncate text-[15px] font-semibold tracking-tight">Profa</span>}
        </Link>
      </div>

      {showRazina && !rail && (
        <div className="shrink-0 border-t border-border/70 px-4 py-3">
          <p className="shell-label mb-2">Tvoja razina</p>
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-2.5 py-2">
            <span
              aria-hidden="true"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary font-mono text-[10px] font-semibold text-primary-foreground"
            >
              {RAZINE.find((item) => item.value === razina)?.kratko ?? '—'}
            </span>
            <span className="truncate text-sm font-medium text-primary">{razina}</span>
          </div>
        </div>
      )}

      <nav className="relative min-h-0 flex-1 px-2 pb-2" aria-label="Navigacija dashboarda">
        <span
          aria-hidden="true"
          className="absolute left-2 right-2 top-0 h-10 rounded-lg bg-secondary/70 transition-transform duration-300 ease-in-out"
          style={{ transform: `translateY(${activeIndex * 44}px)` }}
        />
        <ul className="relative space-y-1">
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex h-10 items-center gap-3 rounded-lg font-mono text-[11px] uppercase tracking-[0.07em] transition-colors',
                    rail ? 'justify-center px-0' : 'px-3',
                    active
                      ? 'font-medium text-primary'
                      : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground',
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  {!rail && <span className="truncate">{item.label}</span>}
                  {rail && (
                    <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-background group-hover:block group-focus-visible:block">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-border/70 p-2">
        <button
          type="button"
          onClick={onToggleRail}
          aria-pressed={rail}
          className={cn(
            'flex h-10 w-full items-center gap-3 rounded-lg font-mono text-[11px] uppercase tracking-[0.07em] text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground',
            rail ? 'justify-center px-0' : 'px-3',
          )}
        >
          {rail ? (
            <PanelLeftOpen className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          )}
          {!rail && <span>Skupi navigaciju</span>}
        </button>
      </div>
    </div>
  );
}