import { useEffect, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeading from '@/components/dashboard/PageHeading';
import StatusBadge from '@/components/dashboard/StatusBadge';
import PredajaReviewDialog from '@/components/dashboard/teacher/PredajaReviewDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDate } from '@/lib/ucenje';

function Feed({ items, loading, empty, onOpen }) {
  if (loading) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }
  return (
    <ul className="space-y-2.5">
      {items.map((predaja) => (
        <li key={predaja.id} className="shell-card flex flex-wrap items-center gap-3 rounded-xl px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{predaja.naziv || 'Predaja'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {predaja.ucenik_ime || predaja.ucenik_email} · {formatDate(predaja.updated_date || predaja.created_date)}
            </p>
          </div>
          {typeof predaja.bodovi === 'number' && predaja.maks_bodovi > 0 && (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {predaja.bodovi}/{predaja.maks_bodovi}
            </span>
          )}
          <StatusBadge status={predaja.status} />
          <button
            type="button"
            onClick={() => onOpen(predaja)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/70 px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Pregledaj
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function Predaje() {
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [zadace, setZadace] = useState([]);
  const [ispiti, setIspiti] = useState([]);
  const [review, setReview] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      base44.entities.Predaja.list({ sort: '-created_date', limit: 100 }),
      base44.entities.PredajaIspita.list({ sort: '-created_date', limit: 100 }),
    ])
      .then(([a, b]) => {
        if (!alive) return;
        setZadace(a.items ?? []);
        setIspiti(b.items ?? []);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [version]);

  return (
    <div>
      <PageHeading
        eyebrow="AI pregledi"
        title="AI pregledi predaja"
        description="Sve AI-ocjenjene zadaće i ispiti. Povratnu informaciju i bodove možete ispraviti ručno."
      />

      <Tabs defaultValue="zadace">
        <TabsList>
          <TabsTrigger value="zadace">Domaće zadaće ({zadace.length})</TabsTrigger>
          <TabsTrigger value="ispiti">Ispiti znanja ({ispiti.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="zadace" className="mt-4">
          <Feed
            items={zadace}
            loading={loading}
            empty="Još nema predanih zadaća."
            onOpen={(predaja) => setReview({ vrsta: 'zadaca', predaja })}
          />
        </TabsContent>
        <TabsContent value="ispiti" className="mt-4">
          <Feed
            items={ispiti}
            loading={loading}
            empty="Još nema predanih ispita."
            onOpen={(predaja) => setReview({ vrsta: 'ispit', predaja })}
          />
        </TabsContent>
      </Tabs>

      {review && (
        <PredajaReviewDialog
          vrsta={review.vrsta}
          predaja={review.predaja}
          onClose={() => setReview(null)}
          onSaved={() => setVersion((value) => value + 1)}
        />
      )}
    </div>
  );
}