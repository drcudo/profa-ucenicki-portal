import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeading from '@/components/dashboard/PageHeading';
import UnitBlock from '@/components/dashboard/teacher/UnitBlock';
import UnitDialog from '@/components/dashboard/teacher/UnitDialog';
import LessonDialog from '@/components/dashboard/teacher/LessonDialog';
import MaterialDialog from '@/components/dashboard/teacher/MaterialDialog';
import BulkMaterialsDialog from '@/components/dashboard/teacher/BulkMaterialsDialog';
import ExamDialog from '@/components/dashboard/teacher/ExamDialog';
import ConfirmDialog from '@/components/dashboard/ConfirmDialog';
import RazinaTabs from '@/components/dashboard/RazinaTabs';
import { sortByOrder } from '@/lib/ucenje';
import { RAZINE, razinaOf } from '@/lib/razine';

export default function Upravljanje() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [version, setVersion] = useState(0);
  const [cjeline, setCjeline] = useState([]);
  const [lekcije, setLekcije] = useState([]);
  const [materijali, setMaterijali] = useState([]);
  const [kljucevi, setKljucevi] = useState([]);
  const [ispiti, setIspiti] = useState([]);

  const [unitDialog, setUnitDialog] = useState(null);
  const [examDialog, setExamDialog] = useState(null);
  const [lessonDialog, setLessonDialog] = useState(null);
  const [materialDialog, setMaterialDialog] = useState(null);
  const [bulkDialog, setBulkDialog] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [razina, setRazina] = useState(RAZINE[0].value);

  const bump = () => setVersion((value) => value + 1);
  const vidljiveCjeline = cjeline.filter((cjelina) => razinaOf(cjelina) === razina);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      const results = await Promise.allSettled([
        base44.entities.Cjelina.list(),
        base44.entities.Lekcija.list(),
        base44.entities.Materijal.list(),
        base44.entities.KljucOdgovora.list(),
        base44.entities.Ispit.list(),
      ]);
      if (!alive) return;

      const [units, lessons, mats, keys, exams] = results.map((result) => {
        if (result.status === 'rejected') return [];
        const value = result.value;
        return Array.isArray(value) ? value : (value?.items ?? []);
      });
      const failed = results.some((result) => result.status === 'rejected');
      if (!alive) return;
      setCjeline(sortByOrder(units));
      setLekcije(sortByOrder(lessons));
      setMaterijali(sortByOrder(mats));
      setKljucevi(keys);
      setIspiti(sortByOrder(exams));
      if (failed) {
        setLoadError('Dio podataka nije uspio učitati. Pokušajte osvježiti stranicu.');
      }
      setLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, [version]);

  const obrisiCjelinu = async (cjelina) => {
    const lessonIds = lekcije.filter((l) => l.cjelina_id === cjelina.id).map((l) => l.id);
    const mats = materijali.filter((m) => lessonIds.includes(m.lekcija_id) || m.cjelina_id === cjelina.id);
    const matIds = mats.map((m) => m.id);
    const keys = kljucevi.filter((k) => matIds.includes(k.materijal_id)).map((k) => k.id);
    const unitExams = ispiti.filter((i) => i.cjelina_id === cjelina.id);
    const examKeys = kljucevi.filter((k) => unitExams.some((i) => i.id === k.ispit_id)).map((k) => k.id);
    await Promise.all([...keys, ...examKeys].map((id) => base44.entities.KljucOdgovora.delete(id)));
    await Promise.all(unitExams.map((ispit) => base44.entities.Ispit.delete(ispit.id)));
    await Promise.all(matIds.map((id) => base44.entities.Materijal.delete(id)));
    await Promise.all(lessonIds.map((id) => base44.entities.Lekcija.delete(id)));
    await base44.entities.Cjelina.delete(cjelina.id);
    bump();
  };

  const obrisiLekciju = async (lekcija) => {
    const mats = materijali.filter((m) => m.lekcija_id === lekcija.id).map((m) => m.id);
    const keys = kljucevi.filter((k) => mats.includes(k.materijal_id)).map((k) => k.id);
    await Promise.all(keys.map((id) => base44.entities.KljucOdgovora.delete(id)));
    await Promise.all(mats.map((id) => base44.entities.Materijal.delete(id)));
    await base44.entities.Lekcija.delete(lekcija.id);
    bump();
  };

  const obrisiMaterijal = async (materijal) => {
    const key = kljucevi.find((k) => k.materijal_id === materijal.id);
    if (key) await base44.entities.KljucOdgovora.delete(key.id);
    await base44.entities.Materijal.delete(materijal.id);
    bump();
  };

  const obrisiIspit = async (ispit) => {
    const key = kljucevi.find((k) => k.ispit_id === ispit.id);
    if (key) await base44.entities.KljucOdgovora.delete(key.id);
    await base44.entities.Ispit.delete(ispit.id);
    bump();
  };

  return (
    <div>
      <PageHeading
        eyebrow="Upravljanje gradivom"
        title="Upravljanje gradivom"
        description="Cjeline, lekcije, materijali i ispiti odvojeni su po razini programa."
      >
        <button
          type="button"
          onClick={() => setUnitDialog({ razina })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova cjelina
        </button>
      </PageHeading>

      <div className="mb-4">
        <RazinaTabs value={razina} onChange={setRazina} />
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : vidljiveCjeline.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Za {razina} još nema cjelina. Dodajte prvu cjelinu i zatim lekcije unutar nje.
        </div>
      ) : (
        <div className="space-y-4">
          {vidljiveCjeline.map((cjelina) => (
            <UnitBlock
              key={cjelina.id}
              cjelina={cjelina}
              lekcije={lekcije.filter((l) => l.cjelina_id === cjelina.id)}
              materijali={materijali.filter((m) => m.cjelina_id === cjelina.id || lekcije.some((l) => l.id === m.lekcija_id && l.cjelina_id === cjelina.id))}
              ispiti={ispiti.filter((i) => i.cjelina_id === cjelina.id)}
              onAddExam={() => setExamDialog({ cjelina })}
              onEditExam={(ispit) =>
                setExamDialog({
                  cjelina,
                  ispit,
                  kljuc: kljucevi.find((k) => k.ispit_id === ispit.id),
                })
              }
              onDeleteExam={(ispit) =>
                setConfirm({
                  title: 'Obriši ispit?',
                  description: `Ispit „${ispit.naziv}“ bit će trajno obrisan.`,
                  action: () => obrisiIspit(ispit),
                })
              }
              onEditUnit={() => setUnitDialog({ cjelina })}
              onDeleteUnit={() =>
                setConfirm({
                  title: 'Obriši cjelinu?',
                  description: `Cjelina „${cjelina.naziv}“ i sve njezine lekcije i materijali bit će trajno obrisani.`,
                  action: () => obrisiCjelinu(cjelina),
                })
              }
              onAddLesson={() => setLessonDialog({ cjelinaId: cjelina.id })}
              onEditLesson={(lekcija) => setLessonDialog({ cjelinaId: cjelina.id, lekcija })}
              onDeleteLesson={(lekcija) =>
                setConfirm({
                  title: 'Obriši lekciju?',
                  description: `Lekcija „${lekcija.naziv}“ i njezini materijali bit će trajno obrisani.`,
                  action: () => obrisiLekciju(lekcija),
                })
              }
              onAddMaterial={(lekcija) => setMaterialDialog({ lekcija, cjelinaId: cjelina.id })}
              onEditMaterial={(materijal) =>
                setMaterialDialog({
                  lekcija: lekcije.find((l) => l.id === materijal.lekcija_id),
                  cjelinaId: materijal.cjelina_id || cjelina.id,
                  materijal,
                  kljuc: kljucevi.find((k) => k.materijal_id === materijal.id),
                })
              }
              onDeleteMaterial={(materijal) =>
                setConfirm({
                  title: 'Obriši materijal?',
                  description: `Materijal „${materijal.naziv}“ bit će trajno obrisan.`,
                  action: () => obrisiMaterijal(materijal),
                })
              }
              onBulk={(lekcija) => setBulkDialog({ lekcija, cjelinaId: cjelina.id })}
            />
          ))}
        </div>
      )}

      <UnitDialog
        open={!!unitDialog}
        cjelina={unitDialog?.cjelina}
        razina={unitDialog?.razina || unitDialog?.cjelina?.razina || razina}
        onClose={() => setUnitDialog(null)}
        onSaved={bump}
      />
      <LessonDialog
        open={!!lessonDialog}
        cjelinaId={lessonDialog?.cjelinaId}
        lekcija={lessonDialog?.lekcija}
        onClose={() => setLessonDialog(null)}
        onSaved={bump}
      />
      {materialDialog && (
        <MaterialDialog
          open={!!materialDialog}
          lekcija={materialDialog.lekcija}
          cjelinaId={materialDialog.cjelinaId}
          materijal={materialDialog.materijal}
          kljuc={materialDialog.kljuc}
          onClose={() => setMaterialDialog(null)}
          onSaved={bump}
        />
      )}
      {examDialog && (
        <ExamDialog
          open={!!examDialog}
          cjelina={examDialog.cjelina}
          ispit={examDialog.ispit}
          kljuc={examDialog.kljuc}
          onClose={() => setExamDialog(null)}
          onSaved={bump}
        />
      )}
      {bulkDialog && (
        <BulkMaterialsDialog
          open={!!bulkDialog}
          lekcija={bulkDialog.lekcija}
          cjelinaId={bulkDialog.cjelinaId}
          onClose={() => setBulkDialog(null)}
          onSaved={bump}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        description={confirm?.description}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await confirm.action();
          setConfirm(null);
        }}
      />
    </div>
  );
}