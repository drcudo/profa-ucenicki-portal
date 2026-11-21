import { useEffect, useState } from 'react';
import { Loader2, Paperclip, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { uploadPrivate } from '@/lib/ucenje';

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function ExamDialog({ open, onClose, cjelina, ispit, kljuc, onSaved }) {
  const [form, setForm] = useState({
    naziv: '',
    opis: '',
    sadrzaj: '',
    rok: '',
    vremensko_ogranicenje: 90,
    maks_bodovi: 50,
    rjesenje: '',
  });
  const [attachment, setAttachment] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      naziv: ispit?.naziv || '',
      opis: ispit?.opis || '',
      sadrzaj: ispit?.sadrzaj || '',
      rok: ispit?.rok || '',
      vremensko_ogranicenje: ispit?.vremensko_ogranicenje ?? 90,
      maks_bodovi: ispit?.maks_bodovi ?? 50,
      rjesenje: kljuc?.tekst || '',
    });
    setAttachment(ispit?.file_uri ? { file_uri: ispit.file_uri, file_name: ispit.file_name } : null);
    setFile(null);
    setError('');
  }, [open, ispit, kljuc]);

  const save = async () => {
    if (!form.naziv.trim()) {
      setError('Unesite naziv ispita.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let savedFile = attachment;
      if (file) savedFile = await uploadPrivate(file);
      const payload = {
        cjelina_id: cjelina.id,
        naziv: form.naziv.trim(),
        opis: form.opis.trim(),
        sadrzaj: form.sadrzaj.trim(),
        rok: form.rok,
        vremensko_ogranicenje: Number(form.vremensko_ogranicenje) || 0,
        maks_bodovi: Number(form.maks_bodovi) || 0,
        file_uri: savedFile?.file_uri || '',
        file_name: savedFile?.file_name || '',
      };
      let id = ispit?.id;
      if (id) {
        await base44.entities.Ispit.update(id, payload);
      } else {
        const created = await base44.entities.Ispit.create(payload);
        id = created.id;
      }
      const tekst = form.rjesenje.trim();
      if (kljuc?.id) {
        await base44.entities.KljucOdgovora.update(kljuc.id, { tekst });
      } else if (tekst) {
        await base44.entities.KljucOdgovora.create({ ispit_id: id, tekst });
      }
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
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ispit ? 'Uredi ispit' : 'Novi ispit znanja'}</DialogTitle>
          <DialogDescription>{cjelina?.naziv}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label htmlFor="ispit-naziv" className="mb-1.5 block text-sm font-medium">Naziv</label>
            <input
              id="ispit-naziv"
              value={form.naziv}
              onChange={(event) => setForm({ ...form, naziv: event.target.value })}
              className={fieldClass}
              placeholder="npr. Ispit znanja — Funkcije i grafovi"
            />
          </div>

          <div>
            <label htmlFor="ispit-opis" className="mb-1.5 block text-sm font-medium">Upute za učenike</label>
            <textarea
              id="ispit-opis"
              rows={2}
              value={form.opis}
              onChange={(event) => setForm({ ...form, opis: event.target.value })}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="ispit-sadrzaj" className="mb-1.5 block text-sm font-medium">Zadaci</label>
            <textarea
              id="ispit-sadrzaj"
              rows={5}
              value={form.sadrzaj}
              onChange={(event) => setForm({ ...form, sadrzaj: event.target.value })}
              className={fieldClass}
              placeholder="Tekst ispitnih zadataka"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">Ispit u PDF-u (neobavezno)</span>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground">
              <Paperclip className="h-4 w-4" aria-hidden="true" />
              {file ? file.name : 'Odaberi datoteku'}
              <input
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
            {attachment && !file && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-secondary/50 px-2.5 py-1.5 text-xs">
                {attachment.file_name || 'Privitak'}
                <button
                  type="button"
                  aria-label="Ukloni datoteku"
                  onClick={() => setAttachment(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="ispit-rok" className="mb-1.5 block text-sm font-medium">Rok</label>
              <input
                id="ispit-rok"
                type="date"
                value={form.rok}
                onChange={(event) => setForm({ ...form, rok: event.target.value })}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="ispit-vrijeme" className="mb-1.5 block text-sm font-medium">Minuta</label>
              <input
                id="ispit-vrijeme"
                type="number"
                min="0"
                value={form.vremensko_ogranicenje}
                onChange={(event) => setForm({ ...form, vremensko_ogranicenje: event.target.value })}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="ispit-bodovi" className="mb-1.5 block text-sm font-medium">Maks. bodova</label>
              <input
                id="ispit-bodovi"
                type="number"
                min="0"
                value={form.maks_bodovi}
                onChange={(event) => setForm({ ...form, maks_bodovi: event.target.value })}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="ispit-kljuc" className="mb-1.5 block text-sm font-medium">
              Službeno rješenje (vidi samo nastavnik)
            </label>
            <textarea
              id="ispit-kljuc"
              rows={4}
              value={form.rjesenje}
              onChange={(event) => setForm({ ...form, rjesenje: event.target.value })}
              className={fieldClass}
              placeholder="Ključ odgovora koji AI koristi za ocjenjivanje"
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
            Spremi ispit
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}