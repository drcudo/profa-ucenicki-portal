import { Pencil, Trash2, Users } from 'lucide-react';
import { clanoviGrupe, imeUcenika } from '@/lib/grupe';

export default function GrupaCard({ grupa, ucenici, onEdit, onDelete }) {
  const clanovi = clanoviGrupe(grupa, ucenici);

  return (
    <article className="shell-card rounded-xl px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate font-display text-base font-semibold text-foreground">{grupa.naziv}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {grupa.nacin === 'Po razini' ? `Automatski · ${grupa.razina}` : 'Ručni odabir'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Uredi grupu ${grupa.naziv}`}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Obriši grupu ${grupa.naziv}`}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        {clanovi.length} {clanovi.length === 1 ? 'član' : 'članova'}
      </p>

      {clanovi.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {clanovi.map((ucenik) => (
            <span
              key={ucenik.email}
              className="rounded-full bg-secondary/60 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {imeUcenika(ucenik)}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}