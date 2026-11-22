import { useEffect, useState } from 'react';
import { Loader2, Paperclip, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { KATEGORIJE, uploadPrivate } from '@/lib/ucenje';

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function MaterialDialog({ open, onClose, lekcija, cjelinaId, materijal, kljuc, onSaved }) {
  const [form, setForm] = useState({ naziv: '', kategorija: KATEGORIJE[0], sadrzaj: '', rjesenje: '' });
  const [attachment, setAttachment] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      naziv: materijal?.naziv || '',
      kategorija: materijal?.kategorija || KATEGORIJE[0],
      sadrzaj: materijal?.sadrzaj || '',
      rjesenje: kljuc?.tekst || '',
    });
    setAttachment(materijal?.file_uri ? { file_uri: materijal.file_uri, file_name: materijal.file_name } : null);
    setFile(null);
    setError('');
  }, [open, materijal, kljuc]);

  const save = async () => {
    if (!form.naziv.trim()) {
      setError('Unesite naziv materijala.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let savedFile = attachment;
      if (file) savedFile = await uploadPrivate(file);
      const payload = {
        lekcija_id: lekcija.id,
        cjelina_id: cjelinaId,
        naziv: form.naziv.trim(),
        kategorija: form.kategorija,
        sadrzaj: form.sadrzaj.trim(),
        file_uri: savedFile?.file_uri || '',
        file_name: savedFile?.file_name || '',
      };
      let id = materijal?.id;
      if (id) {
        await base44.entities.Materijal.update(id, payload);
      } else {
        const created = await base44.entities.Materijal.create({ ...payload, redoslijed: 1 });
        id = created.id;
      }
      const tekst = form.rjesenje.trim();
      if (kljuc?.id) {
        await base44.entities.KljucOdgovora.update(kljuc.id, { tekst });
      } else if (tekst) {
        await base44.entities.KljucOdgovora.create({ materijal_id: id, tekst });
      }
      onSaved();
      onClose();
    } catch (saveError) {
      const status = saveError?.status ?? saveError?.statusCode ?? saveError?.response?.status;
      if (status === 401) {
        setError('Prijava je istekla. Prijavite se ponovno i pokušajte spremiti materijal.');
      } else if (status === 403) {
        setError('Ovaj račun nema ovlasti za unos gradiva. Prijavite se administratorskim računom.');
      } else {
        setError(saveError?.message || 'Spremanje nije uspjelo.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{materijal ? 'Uredi materijal' : 'Novi materijal ili zadatak'}</DialogTitle>
          <DialogDescription>{lekcija?.naziv}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label htmlFor="mat-naziv" className="mb-1.5 block text-sm font-medium">Naziv</label>
            <input
              id="mat-naziv"
              value={form.naziv}
              onChange={(event) => setForm({ ...form, naziv: event.target.value })}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="mat-kat" className="mb-1.5 block text-sm font-medium">Kategorija</label>
            <select
              id="mat-kat"
              value={form.kategorija}
              onChange={(event) => setForm({ ...form, kategorija: event.target.value })}
              className={fieldClass}
            >
              {KATEGORIJE.map((kategorija) => (
                <option key={kategorija} value={kategorija}>{kategorija}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mat-sadrzaj" className="mb-1.5 block text-sm font-medium">
              Zadatak ili bilješke
            </label>
            <textarea
              id="mat-sadrzaj"
              rows={4}
              value={form.sadrzaj}
              onChange={(event) => setForm({ ...form, sadrzaj: event.target.value })}
              className={fieldClass}
              placeholder="Tekst zadataka koje učenici rješavaju"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">Datoteka (PDF ili slika)</span>
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

          <div>
            <label htmlFor="mat-kljuc" className="mb-1.5 block text-sm font-medium">
              Službeno rješenje (vidi samo nastavnik)
            </label>
            <textarea
              id="mat-kljuc"
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
            Spremi materijal
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}