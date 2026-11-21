import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import UceniciChecklist from '@/components/dashboard/UceniciChecklist';
import { RAZINE } from '@/lib/razine';
import { NACINI_GRUPE, clanoviGrupe, imeUcenika, spremiGrupu } from '@/lib/grupe';
import { cn } from '@/lib/utils';

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function GrupaDialog({ open, grupa, ucenici, onClose, onSaved }) {
  const [naziv, setNaziv] = useState('');
  const [nacin, setNacin] = useState(NACINI_GRUPE[0]);
  const [razina, setRazina] = useState(RAZINE[0].value);
  const [clanovi, setClanovi] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNaziv(grupa?.naziv || '');
    setNacin(grupa?.nacin || NACINI_GRUPE[0]);
    setRazina(grupa?.razina || RAZINE[0].value);
    setClanovi(grupa?.clanovi || []);
    setError('');
  }, [open, grupa]);

  const poRazini = clanoviGrupe({ nacin: 'Po razini', razina }, ucenici);
  const clanoviZaSpremanje = nacin === 'Po razini' ? poRazini.map((ucenik) => ucenik.email) : clanovi;

  const spremi = async () => {
    setError('');
    if (!naziv.trim()) {
      setError('Unesite naziv grupe.');
      return;
    }
    if (clanoviZaSpremanje.length === 0) {
      setError('Odaberite barem jednog učenika.');
      return;
    }
    setSaving(true);
    try {
      await spremiGrupu({ grupa, naziv, nacin, razina, clanovi: clanoviZaSpremanje }, ucenici);
      onSaved();
      onClose();
    } catch {
      setError('Grupa nije spremljena. Pokušajte ponovno.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{grupa ? 'Uredi grupu' : 'Nova grupa'}</DialogTitle>
          <DialogDescription>
            Učenici u istoj grupi dobivaju iste materijale kad gradivo dodijelite grupi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label htmlFor="grupa-naziv" className="mb-1.5 block text-sm font-medium">
              Naziv grupe
            </label>
            <input
              id="grupa-naziv"
              value={naziv}
              onChange={(event) => setNaziv(event.target.value)}
              placeholder="npr. Matura A — grupa 1"
              className={fieldClass}
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium">Način članstva</p>
            <div className="inline-flex gap-1 rounded-lg bg-secondary/50 p-1" role="group" aria-label="Način članstva">
              {NACINI_GRUPE.map((opcija) => (
                <button
                  key={opcija}
                  type="button"
                  aria-pressed={nacin === opcija}
                  onClick={() => setNacin(opcija)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    nacin === opcija ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {opcija}
                </button>
              ))}
            </div>
          </div>

          {nacin === 'Po razini' ? (
            <div>
              <label htmlFor="grupa-razina" className="mb-1.5 block text-sm font-medium">
                Razina
              </label>
              <select
                id="grupa-razina"
                value={razina}
                onChange={(event) => setRazina(event.target.value)}
                className={fieldClass}
              >
                {RAZINE.map((opcija) => (
                  <option key={opcija.value} value={opcija.value}>
                    {opcija.value}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Grupa automatski sadrži sve učenike s razinom {razina} ({poRazini.length}).
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-sm font-medium">Članovi</p>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {clanovi.length} odabrano
                </span>
              </div>
              <UceniciChecklist
                ucenici={ucenici}
                value={clanovi}
                onChange={setClanovi}
                emptyText="Pozovite učenike na stranici Učenici."
              />
            </div>
          )}

          {nacin === 'Po razini' && poRazini.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {poRazini.map((ucenik) => (
                <span
                  key={ucenik.email}
                  className="rounded-full bg-secondary/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {imeUcenika(ucenik)}
                </span>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Odustani
          </button>
          <button
            type="button"
            onClick={spremi}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Spremi grupu
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}