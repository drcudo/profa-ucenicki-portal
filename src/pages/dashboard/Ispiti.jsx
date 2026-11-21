import { useEffect, useState } from 'react';
import { CalendarClock, Clock, Loader2, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeading from '@/components/dashboard/PageHeading';
import StatusBadge from '@/components/dashboard/StatusBadge';
import PredajaDialog from '@/components/dashboard/PredajaDialog';
import { formatDate } from '@/lib/ucenje';
import { razinaOf } from '@/lib/razine';
import { useRazina } from '@/lib/RazinaContext';

export default function Ispiti() {
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
      const dodjele = await base44.entities.Dodjela.filter({ ucenik_email: user.email, tip: 'Ispit znanja' });
      const ispitIds = [...new Set(dodjele.map((d) => d.ispit_id).filter(Boolean))];
      if (ispitIds.length === 0) {
        if (alive) {
          setRows([]);
          setLoading(false);
        }
        return;
      }
      const [ispiti, predaje, sveDodjele] = await Promise.all([
        base44.entities.Ispit.filter({ id: { $in: ispitIds } }),
        base44.entities.PredajaIspita.filter({ ucenik_email: user.email }),
        base44.entities.Dodjela.filter({ ucenik_email: user.email }),
      ]);

      const zadace = sveDodjele.filter((d) => d.tip === 'Domaća zadaća');
      const matIds = [...new Set(zadace.map((d) => d.materijal_id).filter(Boolean))];
      const [materijali, predajeZadaca, cjeline] = await Promise.all([
        matIds.length ? base44.entities.Materijal.filter({ id: { $in: matIds } }) : [],
        base44.entities.Predaja.filter({ ucenik_email: user.email }),
        base44.entities.Cjelina.filter({}),
      ]);
      if (!alive) return;

      const cjelinaMap = Object.fromEntries(cjeline.map((c) => [c.id, c]));
      const built = ispiti
        .map((ispit) => {
          const domace = materijali.filter((m) => m.cjelina_id === ispit.cjelina_id);
          const otvoren =
            domace.length === 0 ||
            domace.every((m) =>
              predajeZadaca.some((p) => p.materijal_id === m.id && p.status === 'Prihvaćeno'),
            );
          return {
            ispit,
            cjelina: cjelinaMap[ispit.cjelina_id],
            predaja: predaje.find((p) => p.ispit_id === ispit.id),
            otvoren,
            preostalo: domace.filter(
              (m) => !predajeZadaca.some((p) => p.materijal_id === m.id && p.status === 'Prihvaćeno'),
            ).length,
          };
        })
        .sort((a, b) => String(a.ispit.rok || '9999').localeCompare(String(b.ispit.rok || '9999')));

      setRows(built);
      setLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, [user?.email, version]);

  const vidljivi = rows.filter((row) => razinaOf(row.cjelina) === razina);

  return (
    <div>
      <PageHeading
        eyebrow="Ispiti znanja"
        title="Ispiti znanja"
        description="Ispit po cjelini otvara se nakon što prihvatiš sve zadaće te cjeline."
      />

      {loading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : vidljivi.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Za {razina} još nema dodijeljenih ispita znanja.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {vidljivi.map(({ ispit, cjelina, predaja, otvoren, preostalo }) => (
            <article key={ispit.id} className="shell-card flex flex-col rounded-xl px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="shell-label">{cjelina?.naziv || 'Ispit znanja'}</p>
                  <h2 className="mt-1 font-display text-base font-semibold text-foreground">{ispit.naziv}</h2>
                </div>
                {predaja ? (
                  <StatusBadge status={predaja.status} />
                ) : otvoren ? (
                  <StatusBadge status="Za riješiti" />
                ) : (
                  <StatusBadge status="Zaključano" />
                )}
              </div>

              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {ispit.rok && (
                  <p className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                    Rok: {formatDate(ispit.rok)}
                  </p>
                )}
                {ispit.vremensko_ogranicenje > 0 && (
                  <p className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {ispit.vremensko_ogranicenje} minuta
                  </p>
                )}
                {predaja && typeof predaja.bodovi === 'number' && predaja.maks_bodovi > 0 && (
                  <p className="font-mono tabular-nums text-foreground">
                    Rezultat: {predaja.bodovi}/{predaja.maks_bodovi}
                  </p>
                )}
              </div>

              <div className="mt-4 flex-1" />

              {otvoren || predaja ? (
                <button
                  type="button"
                  onClick={() => setOpenRow({ ispit, cjelina, predaja })}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  {predaja ? 'Pregledaj rezultat' : 'Otvori ispit'}
                </button>
              ) : (
                <p className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Završi još {preostalo} {preostalo === 1 ? 'zadaću' : 'zadaće'} u ovoj cjelini.
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {openRow && (
        <PredajaDialog
          open={!!openRow}
          onClose={() => setOpenRow(null)}
          vrsta="ispit"
          naslov={openRow.ispit.naziv}
          opis={openRow.ispit.sadrzaj}
          meta={{ ispit_id: openRow.ispit.id, cjelina_id: openRow.ispit.cjelina_id }}
          predaja={openRow.predaja}
          onSaved={() => setVersion((value) => value + 1)}
        />
      )}
    </div>
  );
}