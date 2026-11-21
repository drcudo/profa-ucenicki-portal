import { useState } from 'react';
import { Loader2, Mail, Phone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RAZINE } from '@/lib/razine';
import { formatDate } from '@/lib/ucenje';
import { cn } from '@/lib/utils';

const STATUSI = ['Novi', 'Kontaktiran', 'Zakazan', 'Otkazan'];

export default function RezervacijaDialog({ rezervacija, onClose, onSaved }) {
  const [status, setStatus] = useState(rezervacija.status || 'Novi');
  const [saving, setSaving] = useState(false);

  const spremi = async () => {
    setSaving(true);
    try {
      await base44.entities.Rezervacija.update(rezervacija.id, { status });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{rezervacija.ime}</DialogTitle>
          <DialogDescription>
            Upit zaprimljen {formatDate(rezervacija.created_date)} · termin: {rezervacija.zeljeni_termin || 'fleksibilno'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${rezervacija.email}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/60 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <Mail className="h-3.5 w-3.5" /> {rezervacija.email}
            </a>
            {rezervacija.telefon && (
              <a
                href={`tel:${rezervacija.telefon}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/60 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
              >
                <Phone className="h-3.5 w-3.5" /> {rezervacija.telefon}
              </a>
            )}
          </div>

          <div>
            <p className="shell-label mb-1">Poruka</p>
            <p className="whitespace-pre-line text-sm text-foreground">{rezervacija.poruka || 'Bez dodatne poruke.'}</p>
          </div>

          <div>
            <p className="shell-label mb-2">Status</p>
            <div className="flex flex-wrap gap-1 rounded-lg bg-secondary/50 p-1">
              {STATUSI.map((opcija) => (
                <button
                  key={opcija}
                  type="button"
                  aria-pressed={status === opcija}
                  onClick={() => setStatus(opcija)}
                  className={cn(
                    'rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors',
                    status === opcija ? 'bg-card font-medium text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {opcija}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Razina se učeniku dodjeljuje u pozivnici ({RAZINE.map((item) => item.value).join(' / ')}).
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Zatvori
          </button>
          <button
            type="button"
            onClick={spremi}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Spremi status
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}