import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Target, FileCheck2, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeading from '@/components/dashboard/PageHeading';
import StatTile from '@/components/dashboard/StatTile';
import UnitBarChart from '@/components/dashboard/napredak/UnitBarChart';
import ScoreTrendChart from '@/components/dashboard/napredak/ScoreTrendChart';
import UnitReportList from '@/components/dashboard/napredak/UnitReportList';
import { buildNapredak, unitChartData, trendChartData } from '@/lib/napredakReport';
import { useRazina } from '@/lib/RazinaContext';

export default function Napredak() {
  const { user } = useAuth();
  const { razina } = useRazina();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState({ rows: [], graded: [], stats: {} });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!user?.email) return;
      setLoading(true);
      const [dodjele, cjeline, lekcije, materijali, ispiti, predaje, predajeIspita] = await Promise.all([
        base44.entities.Dodjela.filter({ ucenik_email: user.email }),
        base44.entities.Cjelina.list(),
        base44.entities.Lekcija.list(),
        base44.entities.Materijal.list(),
        base44.entities.Ispit.list(),
        base44.entities.Predaja.filter({ ucenik_email: user.email }),
        base44.entities.PredajaIspita.filter({ ucenik_email: user.email }),
      ]);
      if (!alive) return;
      setReport(
        buildNapredak({
          cjeline: cjeline || [],
          lekcije: lekcije || [],
          materijali: materijali || [],
          ispiti: ispiti || [],
          dodjele: dodjele || [],
          predaje: predaje || [],
          predajeIspita: predajeIspita || [],
          razina,
        }),
      );
      setLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, [user?.email, razina]);

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const { rows, graded, stats } = report;
  const barData = unitChartData(rows);
  const trendData = trendChartData(graded);

  return (
    <div>
      <PageHeading
        eyebrow="Izvještaji"
        title="Napredak po cjelinama"
        description={`Grafovi uspješnosti za ${razina} izrađeni su iz ocijenjenih zadaća i ispita znanja. Postotak pokazuje udio osvojenih bodova u pojedinoj cjelini.`}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Prosječna uspješnost"
          value={stats.prosjek === null ? '—' : `${stats.prosjek}%`}
          hint="Prema svim ocijenjenim radovima"
          icon={TrendingUp}
        />
        <StatTile
          label="Riješene cjeline"
          value={`${stats.rijesene ?? 0}/${stats.cjeline ?? 0}`}
          hint="Sve obveze prihvaćene"
          icon={Target}
        />
        <StatTile
          label="Ocijenjeni radovi"
          value={String(stats.ocjenjeno ?? 0)}
          hint="Zadaće i ispiti znanja"
          icon={FileCheck2}
        />
        <StatTile
          label="Najbolja cjelina"
          value={stats.najbolja ? `${stats.najbolja.pct}%` : '—'}
          hint={stats.najbolja?.naziv || 'Još nema ocjena'}
          icon={Trophy}
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Za {razina} još nema dodijeljenog gradiva. Kad profesor dodijeli zadaće i ispite, ovdje će se pojaviti
          grafovi uspješnosti po cjelinama.
        </div>
      ) : (
        <>
          <section className="shell-card mb-6 rounded-xl p-4">
            <p className="shell-label">Uspješnost po cjelinama</p>
            <p className="mb-2 mt-1 text-sm text-muted-foreground">
              Postotak osvojenih bodova u svakoj cjelini. Cjeline ispod 50 % označene su narančastom bojom.
            </p>
            {barData.length === 0 ? (
              <p className="grid h-64 place-items-center text-sm text-muted-foreground">
                Još nema ocijenjenih radova za graf.
              </p>
            ) : (
              <UnitBarChart data={barData} />
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="shell-card rounded-xl p-4">
              <p className="shell-label">Kretanje uspješnosti</p>
              <p className="mb-2 mt-1 text-sm text-muted-foreground">
                Rezultati po redu predaje, od najstarijeg rada.
              </p>
              {trendData.length === 0 ? (
                <p className="grid h-64 place-items-center text-sm text-muted-foreground">
                  Graf se prikazuje nakon prve ocjene.
                </p>
              ) : (
                <ScoreTrendChart data={trendData} />
              )}
            </section>

            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Detalji po cjelinama</h2>
              <UnitReportList rows={rows} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}