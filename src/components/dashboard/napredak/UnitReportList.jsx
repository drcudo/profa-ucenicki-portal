import ProgressBar from '@/components/dashboard/ProgressBar';

const opis = (row) => {
  const dijelovi = [];
  if (row.zadace) dijelovi.push(`${row.zadace} ${row.zadace === 1 ? 'zadaća' : 'zadaće'}`);
  if (row.ispiti) dijelovi.push(`${row.ispiti} ${row.ispiti === 1 ? 'ispit' : 'ispita'}`);
  if (row.lekcije) dijelovi.push(`${row.lekcije} lekcija`);
  return dijelovi.join(' · ') || 'Nema dodijeljenog gradiva';
};

export default function UnitReportList({ rows }) {
  return (
    <ul className="shell-card divide-y divide-border/60 overflow-hidden rounded-xl">
      {rows.map((row) => (
        <li key={row.id} className="px-4 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="min-w-0 truncate font-medium text-foreground">{row.naziv}</p>
            <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {row.pct === null ? 'bez ocjene' : `${row.pct}%`}
            </p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{opis(row)}</p>
          <ProgressBar value={row.pct ?? 0} className="mt-3" />
          {row.ukupno > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Prihvaćeno {row.prihvaceno} od {row.ukupno} obveza
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}