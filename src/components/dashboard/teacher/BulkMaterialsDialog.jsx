import { useEffect, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { KATEGORIJE, uploadPrivate } from '@/lib/ucenje';

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function BulkMaterialsDialog({ open, onClose, lekcija, cjelinaId, onSaved }) {
  const [files, setFiles] = useState([]);
  const [kategorija, setKategorija] = useState('Dodatni listići i zadaci');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setFiles([]);
    setKategorija('Dodatni listići i zadaci');
    setError('');
  }, [open]);

  const save = async () => {
    if (files.length === 0) {
      setError('Odaberite barem jednu datoteku.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      for (const file of files) {
        const uploaded = await uploadPrivate(file);
        await base44.entities.Materijal.create({
          lekcija_id: lekcija.id,
          cjelina_id: cjelinaId,
          naziv: file.name.replace(/\.[^.]+$/, ''),
          kategorija,
          file_uri: uploaded.file_uri,
          file_name: uploaded.file_name,
          redoslijed: 1,
        });
      }
      onSaved();
      onClose();
    } catch {
      setError('Učitavanje nije uspjelo. Pokušajte ponovno.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Učitaj listiće</DialogTitle>
          <DialogDescription>{lekcija?.naziv}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label htmlFor="bulk-kat" className="mb-1.5 block text-sm font-medium">Kategorija</label>
            <select
              id="bulk-kat"
              value={kategorija}
              onChange={(event) => setKategorija(event.target.value)}
              className={fieldClass}
            >
              {KATEGORIJE.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground">
            <Upload className="h-5 w-5" aria-hidden="true" />
            Odaberi više PDF-ova ili slika
            <input
              type="file"
              multiple
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
            />
          </label>

          {files.length > 0 && (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
              {files.map((file) => (
                <li key={file.name} className="truncate rounded-md bg-secondary/40 px-2.5 py-1.5">
                  {file.name}
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Učitaj {files.length > 0 ? `${files.length} ` : ''}datoteka
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}