import { useEffect, useState } from 'react';
import { ArrowRight, CalendarClock, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeading from '@/components/dashboard/PageHeading';
import StatusBadge from '@/components/dashboard/StatusBadge';
import PredajaDialog from '@/components/dashboard/PredajaDialog';
import { formatDate } from '@/lib/ucenje';
import { razinaOf } from '@/lib/razine';
import { useRazina } from '@/lib/RazinaContext';

const SKUPINE = [
  { key: 'za-rijesiti', label: 'Za riješiti', statuses: ['Za riješiti', 'AI pregledava'] },
  { key: 'ispravak', label: 'Potreban ispravak', statuses: ['Potreban ispravak'] },
  { key: 'zavrseno', label: 'Završeno', statuses: ['Prihvaćeno'] },
];

export default function Zadaca() {
  const { user } = useAuth();
  const { razina } = useRazina();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [openRow, setOpenRow] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!user?.email) return;
      setLoading(true);
      const dodjele = await base44.entities.Dodjela.filter({ ucenik_email: user.email, tip: 'Domaća zadaća' });
      const matIds = [...new Set(dodjele.map((d) => d.materijal_id).filter(Boolean))];
      if (matIds.length === 0) {
        if (alive) {
          setRows([]);
          setLoading(false);
        }
        return;
      }
      const [materijali, predaje] = await Promise.all([
        base44.entities.Materijal.filter({ id: { $in: matIds } }),
        base44.entities.Predaja.filter({ ucenik_email: user.email }),
      ]);
      const lessonIds = [...new Set(materijali.map((m) => m.lekcija_id).filter(Boolean))];
      const cjelinaIds = [...new Set(materijali.map((m) => m.cjelina_id).filter(Boolean))];
      const [lekcije, cjeline] = await Promise.all([
        lessonIds.length ? base44.entities.Lekcija.filter({ id: { $in: lessonIds } }) : [],
        cjelinaIds.length ? base44.entities.Cjelina.filter({ id: { $in: cjelinaIds } }) : [],
      ]);
      if (!alive) return;
      const matMap = Object.fromEntries(materijali.map((m) => [m.id, m]));
      const lekcijaMap = Object.fromEntries(lekcije.map((l) => [l.id, l]));
      const cjelinaMap = Object.fromEntries(cjeline.map((c) => [c.id, c]));

      const built = dodjele
        .map((dodjela) => {
          const materijal = matMap[dodjela.materijal_id];
          if (!materijal) return null;
          const predaja = predaje.find((p) => p.materijal_id === materijal.id);
          return {
            id: dodjela.id,
            dodjela,
            materijal,
            predaja,
            lekcija: lekcijaMap[materijal.lekcija_id],
            cjelina: cjelinaMap[materijal.cjelina_id],
            status: predaja?.status || 'Za riješiti',
          };
        })
        .filter(Boolean)
        .sort((a, b) => String(a.dodjela.rok || '9999').localeCompare(String(b.dodjela.rok || '9999')));

      setRows(built);
      setLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, [user?.email, version]);

  const vidljivi = rows.filter((row) => razinaOf(row.cjelina) === razina);

  const gumbLabel = (status) => {
    if (status === 'Za riješiti') return 'Riješi';
    if (status === 'Potreban ispravak') return 'Ispravi';
    if (status === 'AI pregledava') return 'Pogledaj';
    return 'Pregledaj';
  };

  return (
    <div>
      <PageHeading
        eyebrow="Domaća zadaća"
        title="Domaća zadaća"
        description="Riješi zadatke, priloži fotografije postupka i odmah dobij AI povratnu informaciju."
      />

      {loading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : vidljivi.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Za {razina} još nema dodijeljenih zadaća.
        </div>
      ) : (
        <div className="space-y-7">
          {SKUPINE.map((skupina) => {
            const items = vidljivi.filter((row) => skupina.statuses.includes(row.status));
            return (
              <section key={skupina.key}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-foreground">{skupina.label}</h2>
                  <span className="rounded-md bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Trenutno nema zadaća u ovoj skupini.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {items.map((row) => (
                      <li key={row.id} className="shell-card flex flex-wrap items-center gap-3 rounded-xl px-4 py-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{row.materijal.naziv}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {[row.cjelina?.naziv, row.lekcija?.naziv].filter(Boolean).join(' · ') || 'Domaća zadaća'}
                          </p>
                          {row.dodjela.rok && (
                            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                              Rok: {formatDate(row.dodjela.rok)}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={row.status} />
                        <button
                          type="button"
                          onClick={() => setOpenRow(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                        >
                          {gumbLabel(row.status)}
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {openRow && (
        <PredajaDialog
          open={!!openRow}
          onClose={() => setOpenRow(null)}
          vrsta="zadaca"
          naslov={openRow.materijal.naziv}
          opis={openRow.materijal.sadrzaj}
          meta={{
            materijal_id: openRow.materijal.id,
            lekcija_id: openRow.materijal.lekcija_id,
            cjelina_id: openRow.materijal.cjelina_id,
          }}
          predaja={openRow.predaja}
          onSaved={() => setVersion((value) => value + 1)}
        />
      )}
    </div>
  );
}