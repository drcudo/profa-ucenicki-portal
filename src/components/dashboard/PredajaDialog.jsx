import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2, Paperclip, Sparkles, Upload, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '@/components/dashboard/StatusBadge';
import FilePreviewDialog from '@/components/dashboard/FilePreviewDialog';
import { formatDate, uploadPrivate } from '@/lib/ucenje';

export default function PredajaDialog({ open, onClose, vrsta, naslov, opis, meta, predaja, onSaved }) {
  const { user } = useAuth();
  const entity = vrsta === 'ispit' ? base44.entities.PredajaIspita : base44.entities.Predaja;
  const funkcija = vrsta === 'ispit' ? 'ocjeniIspit' : 'ocjeniZadacu';

  const [tekst, setTekst] = useState('');
  const [datoteke, setDatoteke] = useState([]);
  const [current, setCurrent] = useState(predaja || null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!open) return;
    setCurrent(predaja || null);
    setTekst(predaja?.tekst_odgovora || '');
    setDatoteke(predaja?.datoteke || []);
    setError('');
  }, [open, predaja]);

  const dodajDatoteke = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of files) uploaded.push(await uploadPrivate(file));
      setDatoteke((prev) => [...prev, ...uploaded]);
    } catch {
      setError('Učitavanje datoteke nije uspjelo. Pokušajte ponovno.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const predaj = async () => {
    if (!tekst.trim() && datoteke.length === 0) {
      setError('Upišite odgovor ili priložite fotografiju rješenja.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...meta,
        ucenik_email: user.email,
        ucenik_ime: user.full_name || '',
        naziv: naslov,
        tekst_odgovora: tekst.trim(),
        datoteke,
        status: 'AI pregledava',
      };
      let id = current?.id;
      if (id) {
        await entity.update(id, { ...payload, pokusaj: (current.pokusaj || 1) + 1 });
      } else {
        const created = await entity.create({ ...payload, pokusaj: 1 });
        id = created.id;
      }
      setCurrent({ ...(current || {}), ...payload, id });
      const response = await base44.functions.invoke(funkcija, { predaja_id: id });
      const fresh = await entity.get(id);
      setCurrent(fresh);
      onSaved?.();
      if (response.data?.error) setError(response.data.error);
    } catch (err) {
      setError(err?.response?.data?.error || 'Slanje nije uspjelo. Pokušajte ponovno.');
    } finally {
      setSubmitting(false);
    }
  };

  const ocjenjuje = submitting;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8 text-base">{naslov}</DialogTitle>
          <DialogDescription>
            {vrsta === 'ispit' ? 'Predaj svoje rješenje ispita.' : 'Upiši odgovore i priloži fotografije postupka.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {opis && (
            <div className="rounded-lg bg-secondary/30 px-4 py-3">
              <p className="shell-label mb-1.5">Zadaci</p>
              <p className="whitespace-pre-line text-sm text-foreground/90">{opis}</p>
            </div>
          )}

          {current && current.status !== 'AI pregledava' && (
            <div className="rounded-lg border border-border/70 px-4 py-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={current.status} />
                {typeof current.bodovi === 'number' && current.maks_bodovi > 0 && (
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {current.bodovi}/{current.maks_bodovi} bodova
                  </span>
                )}
                <span className="font-mono text-xs text-muted-foreground">
                  Pokušaj {current.pokusaj || 1}
                </span>
              </div>
              {current.ai_izvjesce && (
                <p className="text-sm text-foreground/90">{current.ai_izvjesce}</p>
              )}
              {current.ai_tocno?.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {current.ai_tocno.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {current.ai_greske?.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {current.ai_greske.map((greska, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                      <span>
                        <span className="font-medium text-foreground">{greska.zadatak}:</span>{' '}
                        <span className="text-foreground/80">{greska.opis}</span>
                        {greska.savjet && (
                          <span className="mt-0.5 block text-muted-foreground">Savjet: {greska.savjet}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {current.nastavnicka_napomena && (
                <p className="mt-3 rounded-md bg-secondary/40 px-3 py-2 text-sm text-foreground/90">
                  Napomena profesora: {current.nastavnicka_napomena}
                </p>
              )}
            </div>
          )}

          {current?.datoteke?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {current.datoteke.map((file) => (
                <button
                  key={file.file_uri}
                  type="button"
                  onClick={() => setPreview(file)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-secondary/50 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
                >
                  <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                  {file.file_name || 'Prilog'}
                </button>
              ))}
            </div>
          )}

          {ocjenjuje ? (
            <div className="flex items-center gap-3 rounded-lg bg-primary/5 px-4 py-4 text-sm text-foreground/90">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
              AI pregledava tvoje rješenje. Pričekaj trenutak…
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="odgovor" className="mb-1.5 block text-sm font-medium">
                  Tvoj odgovor
                </label>
                <textarea
                  id="odgovor"
                  rows={5}
                  value={tekst}
                  onChange={(event) => setTekst(event.target.value)}
                  placeholder="Upiši konačne odgovore ili kratki postupak."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-medium">Fotografije ili PDF rješenja</span>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="h-4 w-4" aria-hidden="true" />
                  )}
                  {uploading ? 'Učitavam…' : 'Priloži datoteku'}
                  <input type="file" multiple accept="image/*,application/pdf" onChange={dodajDatoteke} className="hidden" disabled={uploading} />
                </label>
                {datoteke.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {datoteke.map((file, index) => (
                      <li key={`${file.file_uri}-${index}`} className="inline-flex items-center gap-1.5 rounded-md bg-secondary/50 px-2.5 py-1.5 text-xs">
                        {file.file_name || 'Prilog'}
                        <button
                          type="button"
                          aria-label="Ukloni datoteku"
                          onClick={() => setDatoteke((prev) => prev.filter((_, i) => i !== index))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={predaj}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {current ? 'Predaj ispravak' : 'Predaj i pokreni AI provjeru'}
                </button>
                {current && (
                  <span className="text-xs text-muted-foreground">
                    Predano {formatDate(current.updated_date || current.created_date)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <FilePreviewDialog file={preview} onClose={() => setPreview(null)} />
    </Dialog>
  );
}