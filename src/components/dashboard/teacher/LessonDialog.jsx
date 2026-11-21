import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function LessonDialog({ open, onClose, cjelinaId, lekcija, onSaved }) {
  const [form, setForm] = useState({ naziv: '', sazetak: '', redoslijed: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      naziv: lekcija?.naziv || '',
      sazetak: lekcija?.sazetak || '',
      redoslijed: lekcija?.redoslijed ?? 1,
    });
    setError('');
  }, [open, lekcija]);

  const save = async () => {
    if (!form.naziv.trim()) {
      setError('Unesite naziv lekcije.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        cjelina_id: cjelinaId,
        naziv: form.naziv.trim(),
        sazetak: form.sazetak.trim(),
        redoslijed: Number(form.redoslijed) || 1,
      };
      if (lekcija?.id) await base44.entities.Lekcija.update(lekcija.id, payload);
      else await base44.entities.Lekcija.create(payload);
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
          <DialogTitle>{lekcija ? 'Uredi lekciju' : 'Nova lekcija'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label htmlFor="lekcija-naziv" className="mb-1.5 block text-sm font-medium">Naziv</label>
            <input
              id="lekcija-naziv"
              value={form.naziv}
              onChange={(event) => setForm({ ...form, naziv: event.target.value })}
              className={fieldClass}
              placeholder="npr. Kvadratna funkcija"
            />
          </div>
          <div>
            <label htmlFor="lekcija-sazetak" className="mb-1.5 block text-sm font-medium">Sažetak</label>
            <textarea
              id="lekcija-sazetak"
              rows={3}
              value={form.sazetak}
              onChange={(event) => setForm({ ...form, sazetak: event.target.value })}
              className={fieldClass}
              placeholder="Kratki opis gradiva lekcije"
            />
          </div>
          <div>
            <label htmlFor="lekcija-red" className="mb-1.5 block text-sm font-medium">Redoslijed</label>
            <input
              id="lekcija-red"
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
            Spremi lekciju
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}