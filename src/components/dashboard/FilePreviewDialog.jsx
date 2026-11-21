import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import { signedUrl } from '@/lib/ucenje';

export default function FilePreviewDialog({ file, onClose }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file?.file_uri) {
      setUrl('');
      return;
    }
    let alive = true;
    setLoading(true);
    setUrl('');
    signedUrl(file.file_uri)
      .then((value) => {
        if (alive) setUrl(value);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [file]);

  const name = file?.file_name || 'Datoteka';
  const isImage = /\.(png|jpe?g|webp|gif|avif)$/i.test(name);

  return (
    <Dialog open={!!file} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-base">{name}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-auto rounded-lg bg-secondary/30">
          {loading && (
            <div className="grid h-64 place-items-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {!loading && url && isImage && (
            <Image src={url} alt={name} fittingType="fit" className="max-h-[65vh] w-full" />
          )}
          {!loading && url && !isImage && (
            <iframe src={url} title={name} className="h-[65vh] w-full" />
          )}
          {!loading && !url && (
            <div className="grid h-40 place-items-center px-6 text-center text-sm text-muted-foreground">
              Datoteku nije moguće prikazati. Pokušajte je preuzeti.
            </div>
          )}
        </div>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Preuzmi datoteku
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}