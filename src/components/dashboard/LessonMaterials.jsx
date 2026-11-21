import { FileText } from 'lucide-react';

function Section({ title, items, onOpenFile }) {
  return (
    <div>
      <p className="shell-label mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nema materijala u ovoj sekciji.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((materijal) => (
            <li key={materijal.id} className="rounded-lg bg-secondary/30 px-3 py-2.5">
              <p className="text-sm font-medium text-foreground">{materijal.naziv}</p>
              {materijal.sadrzaj && (
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{materijal.sadrzaj}</p>
              )}
              {materijal.file_uri && (
                <button
                  type="button"
                  onClick={() => onOpenFile(materijal)}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {materijal.file_name || 'Otvori datoteku'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function LessonMaterials({ materijali, onOpenFile }) {
  return (
    <div className="space-y-4 pb-2">
      <Section
        title="Materijali s predavanja"
        items={materijali.filter((m) => m.kategorija === 'Za predavanje')}
        onOpenFile={onOpenFile}
      />
      <Section
        title="Dodatni listići i zadaci"
        items={materijali.filter((m) => m.kategorija === 'Dodatni listići i zadaci')}
        onOpenFile={onOpenFile}
      />
    </div>
  );
}