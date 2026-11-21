import { RAZINE } from '@/lib/razine';
import { cn } from '@/lib/utils';

export default function RazinaTabs({ value, onChange, variant = 'inline', className }) {
  if (variant === 'stack') {
    return (
      <div className={cn('space-y-1', className)} role="group" aria-label="Odabir razine">
        {RAZINE.map((razina) => {
          const active = razina.value === value;
          return (
            <button
              key={razina.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(razina.value)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                active
                  ? 'bg-secondary/70 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-md font-mono text-[10px] font-semibold',
                  active ? 'bg-primary text-primary-foreground' : 'bg-secondary/70 text-muted-foreground',
                )}
                aria-hidden="true"
              >
                {razina.kratko}
              </span>
              <span className="truncate">{razina.value}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Odabir razine"
      className={cn('inline-flex flex-wrap gap-1 rounded-lg bg-secondary/50 p-1', className)}
    >
      {RAZINE.map((razina) => {
        const active = razina.value === value;
        return (
          <button
            key={razina.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(razina.value)}
            className={cn(
              'rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors',
              active
                ? 'bg-card font-medium text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {razina.value}
          </button>
        );
      })}
    </div>
  );
}