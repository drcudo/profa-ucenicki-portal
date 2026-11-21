import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeading from '@/components/dashboard/PageHeading';
import LessonMaterials from '@/components/dashboard/LessonMaterials';
import FilePreviewDialog from '@/components/dashboard/FilePreviewDialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { sortByOrder } from '@/lib/ucenje';
import { razinaOf } from '@/lib/razine';
import { useRazina } from '@/lib/RazinaContext';

export default function Udzbenik() {
  const { user } = useAuth();
  const { razina } = useRazina();
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim().toLowerCase();

  const [loading, setLoading] = useState(true);
  const [cjeline, setCjeline] = useState([]);
  const [lekcije, setLekcije] = useState([]);
  const [materijali, setMaterijali] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!user?.email) return;
      setLoading(true);
      const dodjele = await base44.entities.Dodjela.filter({ ucenik_email: user.email, tip: 'Lekcija' });
      const lessonIds = [...new Set(dodjele.map((d) => d.lekcija_id).filter(Boolean))];
      if (lessonIds.length === 0) {
        if (alive) {
          setCjeline([]);
          setLekcije([]);
          setMaterijali([]);
          setLoading(false);
        }
        return;
      }
      const [sveLekcije, sviMaterijali] = await Promise.all([
        base44.entities.Lekcija.filter({ id: { $in: lessonIds } }),
        base44.entities.Materijal.filter({ lekcija_id: { $in: lessonIds } }),
      ]);
      const cjelinaIds = [...new Set(sveLekcije.map((l) => l.cjelina_id).filter(Boolean))];
      const sveCjeline = cjelinaIds.length
        ? await base44.entities.Cjelina.filter({ id: { $in: cjelinaIds } })
        : [];
      if (!alive) return;
      setCjeline(sortByOrder(sveCjeline));
      setLekcije(sortByOrder(sveLekcije));
      setMaterijali(sortByOrder(sviMaterijali));
      setLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, [user?.email]);

  const matcher = (text) => !query || String(text || '').toLowerCase().includes(query);
  const vidljiveCjeline = cjeline.filter((cjelina) => razinaOf(cjelina) === razina);

  return (
    <div>
      <PageHeading
        eyebrow="Udžbenik"
        title="Udžbenik i lekcije"
        description="Materijali s predavanja i dodatni listići za sve lekcije koje su ti dodijeljene."
      />

      {query && (
        <p className="mb-4 text-sm text-muted-foreground">
          Rezultati pretrage za „{searchParams.get('q')}”.
        </p>
      )}

      {loading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : vidljiveCjeline.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Za {razina} još nema dodijeljenih lekcija.
        </div>
      ) : (
        <div className="space-y-4">
          {vidljiveCjeline.map((cjelina) => {
            const unitLessons = lekcije.filter(
              (lekcija) =>
                lekcija.cjelina_id === cjelina.id &&
                (matcher(lekcija.naziv) ||
                  matcher(lekcija.sazetak) ||
                  materijali.some((m) => m.lekcija_id === lekcija.id && matcher(m.naziv))),
            );
            if (unitLessons.length === 0) return null;
            return (
              <section key={cjelina.id} className="shell-card rounded-xl px-4 py-4 sm:px-5">
                <h2 className="font-display text-lg font-semibold text-foreground">{cjelina.naziv}</h2>
                {cjelina.opis && <p className="mt-0.5 text-sm text-muted-foreground">{cjelina.opis}</p>}
                <Accordion type="multiple" className="mt-3">
                  {unitLessons.map((lekcija) => (
                    <AccordionItem key={lekcija.id} value={lekcija.id} className="border-border/70">
                      <AccordionTrigger className="py-3 text-left text-sm font-medium hover:no-underline">
                        <span>
                          {lekcija.naziv}
                          {lekcija.sazetak && (
                            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                              {lekcija.sazetak}
                            </span>
                          )}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <LessonMaterials
                          materijali={materijali.filter((m) => m.lekcija_id === lekcija.id)}
                          onOpenFile={setFile}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            );
          })}
        </div>
      )}

      <FilePreviewDialog file={file} onClose={() => setFile(null)} />
    </div>
  );
}