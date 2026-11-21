import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { imeUcenika } from '@/lib/grupe';

export default function UceniciChecklist({ ucenici, value, onChange, emptyText = 'Nema učenika.' }) {
  const [query, setQuery] = useState('');

  const vidljivi = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ucenici;
    return ucenici.filter((ucenik) => `${imeUcenika(ucenik)} ${ucenik.email}`.toLowerCase().includes(q));
  }, [ucenici, query]);

  const toggle = (email) => {
    onChange(value.includes(email) ? value.filter((item) => item !== email) : [...value, email]);
  };

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pretraži učenike"
          aria-label="Pretraži učenike"
          className="w-full rounded-lg border border-input bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-border">
        {vidljivi.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          vidljivi.map((ucenik) => (
            <label
              key={ucenik.email}
              className="flex cursor-pointer items-center gap-2.5 border-b border-border/60 px-3 py-2 last:border-b-0 hover:bg-secondary/30"
            >
              <Checkbox
                checked={value.includes(ucenik.email)}
                onCheckedChange={() => toggle(ucenik.email)}
              />
              <span className="min-w-0 flex-1 truncate text-sm">{imeUcenika(ucenik)}</span>
              {ucenik.razina && (
                <span className="shrink-0 rounded bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {ucenik.razina}
                </span>
              )}
            </label>
          ))
        )}
      </div>
    </div>
  );
}