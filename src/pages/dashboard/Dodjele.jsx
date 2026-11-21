import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Send, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeading from '@/components/dashboard/PageHeading';
import PrimateljiPicker from '@/components/dashboard/dodjele/PrimateljiPicker';
import { formatDate, sortByOrder } from '@/lib/ucenje';
import { clanoviGrupe, imeUcenika, osvjeziGrupe } from '@/lib/grupe';

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

const TIPOVI = ['Lekcija', 'Domaća zadaća', 'Ispit znanja'];

export default function Dodjele() {
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [ucenici, setUcenici] = useState([]);
  const [grupe, setGrupe] = useState([]);
  const [cjeline, setCjeline] = useState([]);
  const [lekcije, setLekcije] = useState([]);
  const [materijali, setMaterijali] = useState([]);
  const [ispiti, setIspiti] = useState([]);
  const [dodjele, setDodjele] = useState([]);

  const [form, setForm] = useState({ tip: 'Lekcija', cjelinaId: '', lekcijaId: '', materijalId: '', ispitId: '', rok: '' });
  const [odabraniUcenici, setOdabraniUcenici] = useState([]);
  const [odabraneGrupe, setOdabraneGrupe] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      const [users, units, lessons, mats, exams, assignments, grupeLista] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Cjelina.list(),
        base44.entities.Lekcija.list(),
        base44.entities.Materijal.list(),
        base44.entities.Ispit.list(),
        base44.entities.Dodjela.list({ sort: '-created_date', limit: 60 }),
        base44.entities.Grupa.list({ sort: 'naziv' }),
      ]);
      const uceniciLista = (users || []).filter((u) => u.role !== 'admin');
      const osvjezene = await osvjeziGrupe(grupeLista?.items ?? [], uceniciLista);
      if (!alive) return;
      setUcenici(uceniciLista);
      setGrupe(osvjezene);
      setCjeline(sortByOrder(units || []));
      setLekcije(sortByOrder(lessons || []));
      setMaterijali(sortByOrder(mats || []));
      setIspiti(sortByOrder(exams || []));
      setDodjele(assignments.items ?? []);
      setLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, [version]);

  const unitLessons = useMemo(
    () => lekcije.filter((l) => !form.cjelinaId || l.cjelina_id === form.cjelinaId),
    [lekcije, form.cjelinaId],
  );
  const unitHomework = useMemo(
    () =>
      materijali.filter(
        (m) => m.kategorija === 'Domaća zadaća' && (!form.cjelinaId || m.cjelina_id === form.cjelinaId),
      ),
    [materijali, form.cjelinaId],
  );
  const unitExams = useMemo(
    () => ispiti.filter((i) => !form.cjelinaId || i.cjelina_id === form.cjelinaId),
    [ispiti, form.cjelinaId],
  );

  const nazivStavke = (dodjela) => {
    if (dodjela.tip === 'Lekcija') return lekcije.find((l) => l.id === dodjela.lekcija_id)?.naziv || 'Lekcija';
    if (dodjela.tip === 'Domaća zadaća') return materijali.find((m) => m.id === dodjela.materijal_id)?.naziv || 'Domaća zadaća';
    return ispiti.find((i) => i.id === dodjela.ispit_id)?.naziv || 'Ispit znanja';
  };

  const dodijeli = async () => {
    setError('');
    setMessage('');

    const izGrupa = new Map();
    odabraneGrupe.forEach((id) => {
      const grupa = grupe.find((item) => item.id === id);
      if (!grupa) return;
      clanoviGrupe(grupa, ucenici).forEach((ucenik) => {
        if (!izGrupa.has(ucenik.email)) izGrupa.set(ucenik.email, grupa);
      });
    });
    const primatelji = [...new Set([...odabraniUcenici, ...izGrupa.keys()])];

    if (primatelji.length === 0) {
      setError('Odaberite barem jednog učenika ili grupu.');
      return;
    }

    const payloadBase = { tip: form.tip, rok: form.rok || '', cjelina_id: form.cjelinaId || '' };

    if (form.tip === 'Lekcija') {
      const lekcija = lekcije.find((l) => l.id === form.lekcijaId);
      if (!lekcija) {
        setError('Odaberite lekciju.');
        return;
      }
      payloadBase.lekcija_id = lekcija.id;
      payloadBase.cjelina_id = lekcija.cjelina_id;
    } else if (form.tip === 'Domaća zadaća') {
      const materijal = materijali.find((m) => m.id === form.materijalId);
      if (!materijal) {
        setError('Odaberite zadaću.');
        return;
      }
      payloadBase.materijal_id = materijal.id;
      payloadBase.lekcija_id = materijal.lekcija_id;
      payloadBase.cjelina_id = materijal.cjelina_id;
    } else {
      const ispit = ispiti.find((i) => i.id === form.ispitId);
      if (!ispit) {
        setError('Odaberite ispit.');
        return;
      }
      payloadBase.ispit_id = ispit.id;
      payloadBase.cjelina_id = ispit.cjelina_id;
    }

    const imena = Object.fromEntries(ucenici.map((ucenik) => [ucenik.email, imeUcenika(ucenik)]));

    setSaving(true);
    try {
      await base44.entities.Dodjela.bulkCreate(
        primatelji.map((email) => {
          const grupa = odabraniUcenici.includes(email) ? null : izGrupa.get(email);
          return {
            ...payloadBase,
            ucenik_email: email,
            ucenik_ime: imena[email] || email,
            grupa_id: grupa?.id || '',
            grupa_naziv: grupa?.naziv || '',
          };
        }),
      );
      setMessage(`Dodijeljeno: ${primatelji.length} ${primatelji.length === 1 ? 'učenik' : 'učenika'}.`);
      setVersion((value) => value + 1);
    } catch {
      setError('Dodjela nije uspjela. Pokušajte ponovno.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeading
        eyebrow="Dodjele"
        title="Dodjela gradiva"
        description="Odaberite jednog ili više učenika, ili cijelu grupu — svi članovi dobivaju isto gradivo."
      >
        <Link
          to="/dashboard/grupe"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground hover:bg-secondary/50"
        >
          <Users className="h-4 w-4" aria-hidden="true" />
          Uredi grupe
        </Link>
      </PageHeading>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="shell-card rounded-xl px-4 py-4 lg:col-span-2">
          <h2 className="font-display text-base font-semibold">Nova dodjela</h2>
          <div className="mt-3 space-y-3">
            <PrimateljiPicker
              ucenici={ucenici}
              grupe={grupe}
              uceniciValue={odabraniUcenici}
              grupeValue={odabraneGrupe}
              onUceniciChange={setOdabraniUcenici}
              onGrupeChange={setOdabraneGrupe}
            />

            <div>
              <label htmlFor="dod-tip" className="mb-1.5 block text-sm font-medium">Što dodjeljujete</label>
              <select
                id="dod-tip"
                value={form.tip}
                onChange={(event) => setForm({ ...form, tip: event.target.value, lekcijaId: '', materijalId: '', ispitId: '' })}
                className={fieldClass}
              >
                {TIPOVI.map((tip) => (
                  <option key={tip} value={tip}>{tip}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dod-cjelina" className="mb-1.5 block text-sm font-medium">Cjelina</label>
              <select
                id="dod-cjelina"
                value={form.cjelinaId}
                onChange={(event) => setForm({ ...form, cjelinaId: event.target.value, lekcijaId: '', materijalId: '', ispitId: '' })}
                className={fieldClass}
              >
                <option value="">Sve cjeline</option>
                {cjeline.map((cjelina) => (
                  <option key={cjelina.id} value={cjelina.id}>{cjelina.naziv}</option>
                ))}
              </select>
            </div>

            {form.tip === 'Lekcija' && (
              <div>
                <label htmlFor="dod-lekcija" className="mb-1.5 block text-sm font-medium">Lekcija</label>
                <select
                  id="dod-lekcija"
                  value={form.lekcijaId}
                  onChange={(event) => setForm({ ...form, lekcijaId: event.target.value })}
                  className={fieldClass}
                >
                  <option value="">Odaberite lekciju</option>
                  {unitLessons.map((lekcija) => (
                    <option key={lekcija.id} value={lekcija.id}>{lekcija.naziv}</option>
                  ))}
                </select>
              </div>
            )}

            {form.tip === 'Domaća zadaća' && (
              <div>
                <label htmlFor="dod-zadaca" className="mb-1.5 block text-sm font-medium">Zadaća</label>
                <select
                  id="dod-zadaca"
                  value={form.materijalId}
                  onChange={(event) => setForm({ ...form, materijalId: event.target.value })}
                  className={fieldClass}
                >
                  <option value="">Odaberite zadaću</option>
                  {unitHomework.map((materijal) => (
                    <option key={materijal.id} value={materijal.id}>{materijal.naziv}</option>
                  ))}
                </select>
              </div>
            )}

            {form.tip === 'Ispit znanja' && (
              <div>
                <label htmlFor="dod-ispit" className="mb-1.5 block text-sm font-medium">Ispit</label>
                <select
                  id="dod-ispit"
                  value={form.ispitId}
                  onChange={(event) => setForm({ ...form, ispitId: event.target.value })}
                  className={fieldClass}
                >
                  <option value="">Odaberite ispit</option>
                  {unitExams.map((ispit) => (
                    <option key={ispit.id} value={ispit.id}>{ispit.naziv}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="dod-rok" className="mb-1.5 block text-sm font-medium">Rok (neobavezno)</label>
              <input
                id="dod-rok"
                type="date"
                value={form.rok}
                onChange={(event) => setForm({ ...form, rok: event.target.value })}
                className={fieldClass}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-success">{message}</p>}

            <button
              type="button"
              onClick={dodijeli}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              Dodijeli
            </button>
          </div>
        </section>

        <section className="lg:col-span-3">
          <h2 className="mb-3 font-display text-base font-semibold">Posljednje dodjele</h2>
          {loading ? (
            <div className="grid place-items-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : dodjele.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              Još nema dodjela.
            </div>
          ) : (
            <ul className="shell-card divide-y divide-border/60 overflow-hidden rounded-xl">
              {dodjele.map((dodjela) => (
                <li key={dodjela.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{nazivStavke(dodjela)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {dodjela.ucenik_ime || dodjela.ucenik_email}
                      {dodjela.rok ? ` · rok ${formatDate(dodjela.rok)}` : ''}
                    </p>
                  </div>
                  {dodjela.grupa_naziv && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {dodjela.grupa_naziv}
                    </span>
                  )}
                  <span className="rounded bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {dodjela.tip}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}