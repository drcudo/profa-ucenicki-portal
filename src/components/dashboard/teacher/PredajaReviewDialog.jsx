import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2, Paperclip } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/dashboard/StatusBadge';
import FilePreviewDialog from '@/components/dashboard/FilePreviewDialog';

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function PredajaReviewDialog({ vrsta, predaja, onClose, onSaved }) {
  const entity = vrsta === 'ispit' ? base44.entities.PredajaIspita : base44.entities.Predaja;
  const [napomena, setNapomena] = useState('');
  const [bodovi, setBodovi] = useState('');
  const [status, setStatus] = useState('Prihvaćeno');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!predaja) return;
    setNapomena(predaja.nastavnicka_napomena || '');
    setBodovi(predaja.bodovi ?? '');
    setStatus(predaja.status === 'AI pregledava' ? 'Prihvaćeno' : predaja.status);
    setError('');
  }, [predaja]);

  const spremi = async () => {
    setSaving(true);
    setError('');
    try {
      await entity.update(predaja.id, {
        nastavnicka_napomena: napomena.trim(),
        bodovi: Number(bodovi) || 0,
        status,
      });
      onSaved?.();
      onClose();
    } catch {
      setError('Spremanje nije uspjelo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!predaja} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8 text-base">{predaja?.naziv || 'Predaja'}</DialogTitle>
          <DialogDescription>
            {predaja?.ucenik_ime || predaja?.ucenik_email}
            {predaja?.pokusaj ? ` · pokušaj ${predaja.pokusaj}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={predaja?.status} />
            {predaja?.maks_bodovi > 0 && (
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {predaja.bodovi ?? 0}/{predaja.maks_bodovi} bodova
              </span>
            )}
          </div>

          {predaja?.tekst_odgovora && (
            <div className="rounded-lg bg-secondary/30 px-4 py-3">
              <p className="shell-label mb-1.5">Odgovor učenika</p>
              <p className="whitespace-pre-line text-sm text-foreground/90">{predaja.tekst_odgovora}</p>
            </div>
          )}

          {predaja?.datoteke?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {predaja.datoteke.map((file) => (
                <button
                  key={file.file_uri}
                  type="button"
                  onClick={() => setPreview(file)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-secondary/50 px-2.5 py-1.5 text-xs font-medium hover:bg-secondary"
                >
                  <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                  {file.file_name || 'Prilog'}
                </button>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-border/70 px-4 py-3">
            <p className="shell-label mb-2">AI izvješće</p>
            {predaja?.ai_izvjesce ? (
              <p className="text-sm text-foreground/90">{predaja.ai_izvjesce}</p>
            ) : (
              <p className="text-sm text-muted-foreground">AI izvješće još nije dostupno.</p>
            )}
            {predaja?.ai_tocno?.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {predaja.ai_tocno.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
            {predaja?.ai_greske?.length > 0 && (
              <ul className="mt-3 space-y-2">
                {predaja.ai_greske.map((greska, index) => (
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
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="rev-status" className="mb-1.5 block text-sm font-medium">Status</label>
              <select
                id="rev-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={fieldClass}
              >
                <option value="Prihvaćeno">Prihvaćeno</option>
                <option value="Potreban ispravak">Potreban ispravak</option>
              </select>
            </div>
            <div>
              <label htmlFor="rev-bodovi" className="mb-1.5 block text-sm font-medium">Bodovi</label>
              <input
                id="rev-bodovi"
                type="number"
                min="0"
                value={bodovi}
                onChange={(event) => setBodovi(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="rev-napomena" className="mb-1.5 block text-sm font-medium">Napomena profesora</label>
            <textarea
              id="rev-napomena"
              rows={3}
              value={napomena}
              onChange={(event) => setNapomena(event.target.value)}
              className={fieldClass}
              placeholder="Dodatna uputa ili ispravak AI povratne informacije"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="button"
            onClick={spremi}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Spremi pregled
          </button>
        </div>
      </DialogContent>

      <FilePreviewDialog file={preview} onClose={() => setPreview(null)} />
    </Dialog>
  );
}