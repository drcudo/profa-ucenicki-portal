import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { RAZINE, DEFAULT_RAZINA } from '@/lib/razine';

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function UnitDialog({ open, onClose, cjelina, razina, onSaved }) {
  const [form, setForm] = useState({ naziv: '', opis: '', razina: DEFAULT_RAZINA, redoslijed: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      naziv: cjelina?.naziv || '',
      opis: cjelina?.opis || '',
      razina: cjelina?.razina || razina || DEFAULT_RAZINA,
      redoslijed: cjelina?.redoslijed ?? 1,
    });
    setError('');
  }, [open, cjelina, razina]);

  const save = async () => {
    if (!form.naziv.trim()) {
      setError('Unesite naziv cjeline.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        naziv: form.naziv.trim(),
        opis: form.opis.trim(),
        razina: form.razina,
        redoslijed: Number(form.redoslijed) || 1,
      };
      if (cjelina?.id) await base44.entities.Cjelina.update(cjelina.id, payload);
      else await base44.entities.Cjelina.create(payload);
      onSaved();
      onClose();
    } catch {
      setError('Spremanje nije uspjelo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{cjelina ? 'Uredi cjelinu' : 'Nova cjelina'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label htmlFor="cjelina-naziv" className="mb-1.5 block text-sm font-medium">Naziv</label>
            <input
              id="cjelina-naziv"
              value={form.naziv}
              onChange={(event) => setForm({ ...form, naziv: event.target.value })}
              className={fieldClass}
              placeholder="npr. Funkcije i grafovi"
            />
          </div>
          <div>
            <label htmlFor="cjelina-opis" className="mb-1.5 block text-sm font-medium">Opis</label>
            <textarea
              id="cjelina-opis"
              rows={3}
              value={form.opis}
              onChange={(event) => setForm({ ...form, opis: event.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="cjelina-razina" className="mb-1.5 block text-sm font-medium">Razina</label>
            <select
              id="cjelina-razina"
              value={form.razina}
              onChange={(event) => setForm({ ...form, razina: event.target.value })}
              className={fieldClass}
            >
              {RAZINE.map((item) => (
                <option key={item.value} value={item.value}>{item.opis}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cjelina-red" className="mb-1.5 block text-sm font-medium">Redoslijed</label>
            <input
              id="cjelina-red"
              type="number"
              min="1"
              value={form.redoslijed}
              onChange={(event) => setForm({ ...form, redoslijed: event.target.value })}
              className={fieldClass}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Spremi cjelinu
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}