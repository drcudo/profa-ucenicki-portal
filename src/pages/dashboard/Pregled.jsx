import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarClock, ClipboardList, FileCheck2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useRazina } from '@/lib/RazinaContext';
import { razinaOf } from '@/lib/razine';
import PageHeading from '@/components/dashboard/PageHeading';
import StatTile from '@/components/dashboard/StatTile';
import ProgressBar from '@/components/dashboard/ProgressBar';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { formatDate } from '@/lib/ucenje';

export default function Pregled() {
  const { user } = useAuth();
  const { razina } = useRazina();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!user?.email) return;
      setLoading(true);
      const dodjele = await base44.entities.Dodjela.filter({ ucenik_email: user.email });
      const lessonIds = [...new Set(dodjele.filter((d) => d.tip === 'Lekcija').map((d) => d.lekcija_id).filter(Boolean))];
      const homeworkIds = [...new Set(dodjele.filter((d) => d.tip === 'Domaća zadaća').map((d) => d.materijal_id).filter(Boolean))];
      const examIds = [...new Set(dodjele.filter((d) => d.tip === 'Ispit znanja').map((d) => d.ispit_id).filter(Boolean))];

      const [lekcije, materijali, predaje, ispiti, cjeline] = await Promise.all([
        lessonIds.length ? base44.entities.Lekcija.filter({ id: { $in: lessonIds } }) : [],
        homeworkIds.length ? base44.entities.Materijal.filter({ id: { $in: homeworkIds } }) : [],
        base44.entities.Predaja.filter({ ucenik_email: user.email }),
        examIds.length ? base44.entities.Ispit.filter({ id: { $in: examIds } }) : [],
        base44.entities.Cjelina.list(),
      ]);
      if (!alive) return;
      setData({
        dodjele: dodjele || [],
        lekcije: lekcije || [],
        materijali: materijali || [],
        predaje: predaje || [],
        ispiti: ispiti || [],
        cjeline: cjeline || [],
      });
      setLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, [user?.email]);

  const view = useMemo(() => {
    if (!data) return null;
    const matById = Object.fromEntries(data.materijali.map((m) => [m.id, m]));
    const lekById = Object.fromEntries(data.lekcije.map((l) => [l.id, l]));
    const ispitById = Object.fromEntries(data.ispiti.map((i) => [i.id, i]));
    const cjelinaById = Object.fromEntries(data.cjeline.map((c) => [c.id, c]));

    const cjelinaZaDodjelu = (dodjela) => {
      if (dodjela.tip === 'Domaća zadaća') {
        const materijal = matById[dodjela.materijal_id];
        return materijal?.cjelina_id || lekById[materijal?.lekcija_id]?.cjelina_id || null;
      }
      if (dodjela.tip === 'Ispit znanja') return ispitById[dodjela.ispit_id]?.cjelina_id || null;
      return lekById[dodjela.lekcija_id]?.cjelina_id || null;
    };
    const naRazini = (cjelinaId) => razinaOf(cjelinaById[cjelinaId]) === razina;

    const dodjele = data.dodjele.filter((dodjela) => naRazini(cjelinaZaDodjelu(dodjela)));
    const homeworkDodjele = dodjele.filter((d) => d.tip === 'Domaća zadaća');
    const predajaMap = Object.fromEntries(data.predaje.map((p) => [p.materijal_id, p]));

    const unitRows = data.cjeline
      .filter((cjelina) => razinaOf(cjelina) === razina)
      .map((cjelina) => {
        const unitLessons = data.lekcije.filter((l) => l.cjelina_id === cjelina.id);
        const unitHomework = data.materijali.filter(
          (m) => m.cjelina_id === cjelina.id || lekById[m.lekcija_id]?.cjelina_id === cjelina.id,
        );
        const accepted = unitHomework.filter((m) => predajaMap[m.id]?.status === 'Prihvaćeno').length;
        return {
          cjelina,
          lekcija: unitLessons.length,
          zadaca: unitHomework.length,
          prihvaceno: accepted,
          pct: unitHomework.length ? Math.round((accepted / unitHomework.length) * 100) : 0,
        };
      })
      .filter((row) => row.lekcija > 0 || row.zadaca > 0)
      .sort((a, b) => (a.cjelina.redoslijed ?? 0) - (b.cjelina.redoslijed ?? 0));

    const rokoviRows = homeworkDodjele
      .map((dodjela) => {
        const materijal = matById[dodjela.materijal_id];
        const predaja = predajaMap[dodjela.materijal_id];
        return {
          id: dodjela.id,
          naziv: materijal?.naziv || 'Domaća zadaća',
          rok: dodjela.rok,
          status: predaja?.status || 'Za riješiti',
          cjelina: cjelinaById[materijal?.cjelina_id]?.naziv,
        };
      })
      .sort((a, b) => String(a.rok || '9999').localeCompare(String(b.rok || '9999')));

    const sljedeci = data.ispiti
      .filter((ispit) => naRazini(ispit.cjelina_id))
      .sort((a, b) => String(a.rok || '9999').localeCompare(String(b.rok || '9999')))[0];

    const predajeRazina = data.predaje.filter((p) => naRazini(matById[p.materijal_id]?.cjelina_id));
    const sBodovima = predajeRazina.filter((p) => p.maks_bodovi > 0);
    const prosjek = sBodovima.length
      ? Math.round(
          (sBodovima.reduce((sum, p) => sum + (p.bodovi || 0) / p.maks_bodovi, 0) / sBodovima.length) * 100,
        )
      : null;

    const ukupno = homeworkDodjele.length;
    const rijeseno = homeworkDodjele.filter((d) => predajaMap[d.materijal_id]?.status === 'Prihvaćeno').length;

    return {
      cjeline: unitRows,
      rokovi: rokoviRows.slice(0, 5),
      ispit: sljedeci || null,
      stats: {
        zaRijesiti: homeworkDodjele.filter(
          (d) => !predajaMap[d.materijal_id] || predajaMap[d.materijal_id].status === 'AI pregledava',
        ).length,
        ispravak: homeworkDodjele.filter((d) => predajaMap[d.materijal_id]?.status === 'Potreban ispravak').length,
        prosjek,
        napredak: ukupno ? Math.round((rijeseno / ukupno) * 100) : 0,
        rijeseno,
        ukupno,
      },
    };
  }, [data, razina]);

  const ime = (user?.full_name || '').split(' ')[0];

  if (loading || !view) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const { cjeline, rokovi, ispit, stats } = view;

  return (
    <div>
      <PageHeading
        eyebrow={`Pregled · ${razina}`}
        title={ime ? `Dobar dan, ${ime}!` : 'Dobar dan!'}
        description="Ovdje vidiš svoj napredak po cjelinama, rokove zadaća i sljedeći ispit znanja za svoju razinu."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Ukupan napredak"
          value={`${stats.napredak}%`}
          hint={stats.ukupno ? `${stats.rijeseno} od ${stats.ukupno} zadaća` : 'Još nema zadaća'}
          icon={BookOpen}
        />
        <StatTile
          label="Zadaće za riješiti"
          value={String(stats.zaRijesiti)}
          hint={stats.ispravak ? `${stats.ispravak} čeka ispravak` : 'Sve predano'}
          icon={ClipboardList}
        />
        <StatTile
          label="Prosječan rezultat"
          value={stats.prosjek === null ? '—' : `${stats.prosjek}%`}
          hint="Prema ocijenjenim predajama"
          icon={FileCheck2}
        />
        <StatTile
          label="Sljedeći ispit"
          value={ispit?.rok ? formatDate(ispit.rok) : '—'}
          hint={ispit?.naziv || 'Nema zakazanog ispita'}
          icon={CalendarClock}
        />
      </div>

      {cjeline.length === 0 && rokovi.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Za {razina} ti još nije dodijeljeno gradivo. Kad profesor dodijeli lekcije i zadaće, ovdje ćeš vidjeti svoj
          napredak.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Napredak po cjelinama</h2>
            <div className="space-y-3">
              {cjeline.map((row) => (
                <div key={row.cjelina.id} className="shell-card rounded-xl px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{row.cjelina.naziv}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.lekcija} {row.lekcija === 1 ? 'lekcija' : 'lekcija'} · {row.zadaca} zadaća
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {row.prihvaceno}/{row.zadaca}
                    </span>
                  </div>
                  <ProgressBar value={row.pct} className="mt-3" />
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Rokovi zadaća</h2>
              {rokovi.length === 0 ? (
                <p className="text-sm text-muted-foreground">Trenutno nema zadanih rokova.</p>
              ) : (
                <ul className="shell-card divide-y divide-border/60 overflow-hidden rounded-xl">
                  {rokovi.map((rok) => (
                    <li key={rok.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{rok.naziv}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[rok.cjelina, rok.rok ? `rok ${formatDate(rok.rok)}` : null].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <StatusBadge status={rok.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {ispit && (
              <section className="shell-card rounded-xl px-4 py-4">
                <p className="shell-label mb-2">Sljedeći ispit znanja</p>
                <p className="font-display text-base font-semibold text-foreground">{ispit.naziv}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[ispit.rok ? formatDate(ispit.rok) : null, ispit.vremensko_ogranicenje ? `${ispit.vremensko_ogranicenje} minuta` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}