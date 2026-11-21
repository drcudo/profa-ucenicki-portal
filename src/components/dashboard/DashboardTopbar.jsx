import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronRight, LogOut, Home } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function DashboardTopbar({ pageLabel, user, unread, onOpenDrawer, primaryTo, primaryLabel, bellTo, searchTo }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const name = user?.full_name || user?.email || 'Korisnik';
  const initials = name
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const submitSearch = (event) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    navigate(`${searchTo || '/dashboard/udzbenik'}?q=${encodeURIComponent(term)}`);
  };

  return (
    <header className="relative z-20 flex h-16 items-center gap-2 px-3 sm:px-5">
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Otvori navigaciju"
        className="shell-pill grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:hidden"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      <nav aria-label="Putanja" className="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
        <Link to="/dashboard" className="hidden items-center gap-1.5 hover:text-foreground sm:flex">
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          Profa
        </Link>
        <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 opacity-60 sm:block" aria-hidden="true" />
        <span className="truncate font-medium text-foreground">{pageLabel}</span>
      </nav>

      <form onSubmit={submitSearch} className="shell-pill hidden h-9 w-[240px] shrink-0 items-center gap-2 rounded-lg px-3 lg:flex">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pretraži gradivo…"
          aria-label="Pretraži gradivo"
          className="w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
      </form>

      <Link
        to={bellTo}
        aria-label="Obavijesti"
        className="shell-pill relative grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span aria-hidden="true" className="absolute right-2 top-2 h-1.5 w-1.5 rounded-[2px] bg-primary" />
        )}
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Korisnički račun"
            className="shell-pill grid h-9 w-9 shrink-0 place-items-center rounded-lg font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-foreground"
          >
            {initials || 'PR'}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <span className="block text-sm font-medium">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/">Javna stranica</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => base44.auth.logout('/')}>
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            Odjava
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Link
        to={primaryTo}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {primaryLabel}
      </Link>
    </header>
  );
}