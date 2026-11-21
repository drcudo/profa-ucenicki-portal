import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeading from '@/components/dashboard/PageHeading';
import GrupaCard from '@/components/dashboard/grupe/GrupaCard';
import GrupaDialog from '@/components/dashboard/grupe/GrupaDialog';
import ConfirmDialog from '@/components/dashboard/ConfirmDialog';
import { obrisiGrupu, osvjeziGrupe } from '@/lib/grupe';

export default function Grupe() {
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [ucenici, setUcenici] = useState([]);
  const [grupe, setGrupe] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const bump = () => setVersion((value) => value + 1);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      const [users, grupeLista] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Grupa.list({ sort: 'naziv' }),
      ]);
      const uceniciLista = (users || []).filter((u) => u.role !== 'admin');
      const osvjezene = await osvjeziGrupe(grupeLista?.items ?? [], uceniciLista);
      if (!alive) return;
      setUcenici(uceniciLista);
      setGrupe(osvjezene);
      setLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, [version]);

  return (
    <div>
      <PageHeading
        eyebrow="Grupe"
        title="Grupe učenika"
        description="Učenici u istoj grupi dobivaju iste materijale. Grupa može nastati ručnim odabirom ili pratiti razinu programa."
      >
        <button
          type="button"
          onClick={() => setDialog({})}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova grupa
        </button>
      </PageHeading>

      {loading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : grupe.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Još nema grupa. Stvorite prvu grupu i dodijelite joj gradivo na stranici Dodjele.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {grupe.map((grupa) => (
            <GrupaCard
              key={grupa.id}
              grupa={grupa}
              ucenici={ucenici}
              onEdit={() => setDialog({ grupa })}
              onDelete={() =>
                setConfirm({
                  title: 'Obriši grupu?',
                  description: `Grupa „${grupa.naziv}“ bit će obrisana. Već dodijeljeno gradivo ostaje učenicima kao osobna dodjela.`,
                  action: () => obrisiGrupu(grupa),
                })
              }
            />
          ))}
        </div>
      )}

      <GrupaDialog
        open={!!dialog}
        grupa={dialog?.grupa}
        ucenici={ucenici}
        onClose={() => setDialog(null)}
        onSaved={bump}
      />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        description={confirm?.description}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await confirm.action();
          setConfirm(null);
          bump();
        }}
      />
    </div>
  );
}