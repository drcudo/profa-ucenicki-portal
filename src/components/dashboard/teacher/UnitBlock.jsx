import { FileText, Pencil, Plus, Trash2, Upload } from 'lucide-react';

const kategorijaStyle = {
  'Za predavanje': 'bg-primary/10 text-primary',
  'Domaća zadaća': 'bg-secondary text-secondary-foreground',
  'Dodatni listići i zadaci': 'bg-warning/15 text-warning',
};

function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
    >
      {children}
    </button>
  );
}

export default function UnitBlock({
  cjelina,
  lekcije,
  materijali,
  ispiti,
  onAddExam,
  onEditExam,
  onDeleteExam,
  onEditUnit,
  onDeleteUnit,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  onBulk,
}) {
  return (
    <section className="shell-card rounded-xl px-4 py-4 sm:px-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="shell-label">Cjelina {cjelina.redoslijed ?? 1} · {cjelina.razina || 'A razina'}</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-foreground">{cjelina.naziv}</h2>
          {cjelina.opis && <p className="mt-0.5 text-sm text-muted-foreground">{cjelina.opis}</p>}
        </div>
        <div className="flex items-center gap-1">
          <IconButton label="Uredi cjelinu" onClick={onEditUnit}><Pencil className="h-4 w-4" /></IconButton>
          <IconButton label="Obriši cjelinu" onClick={onDeleteUnit}><Trash2 className="h-4 w-4" /></IconButton>
        </div>
      </header>

      <div className="mt-3 space-y-2">
        {lekcije.map((lekcija) => {
          const lessonMaterials = materijali.filter((m) => m.lekcija_id === lekcija.id);
          return (
            <div key={lekcija.id} className="rounded-lg border border-border/70 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{lekcija.naziv}</p>
                  {lekcija.sazetak && <p className="mt-0.5 text-xs text-muted-foreground">{lekcija.sazetak}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton label="Dodaj materijal" onClick={() => onAddMaterial(lekcija)}><Plus className="h-4 w-4" /></IconButton>
                  <IconButton label="Učitaj listiće" onClick={() => onBulk(lekcija)}><Upload className="h-4 w-4" /></IconButton>
                  <IconButton label="Uredi lekciju" onClick={() => onEditLesson(lekcija)}><Pencil className="h-4 w-4" /></IconButton>
                  <IconButton label="Obriši lekciju" onClick={() => onDeleteLesson(lekcija)}><Trash2 className="h-4 w-4" /></IconButton>
                </div>
              </div>

              {lessonMaterials.length > 0 && (
                <ul className="mt-2 divide-y divide-border/60 border-t border-border/60">
                  {lessonMaterials.map((materijal) => (
                    <li key={materijal.id} className="flex items-center gap-2 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${kategorijaStyle[materijal.kategorija] || 'bg-secondary'}`}>
                        {materijal.kategorija}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{materijal.naziv}</span>
                      {materijal.file_uri && <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                      <IconButton label="Uredi materijal" onClick={() => onEditMaterial(materijal)}><Pencil className="h-3.5 w-3.5" /></IconButton>
                      <IconButton label="Obriši materijal" onClick={() => onDeleteMaterial(materijal)}><Trash2 className="h-3.5 w-3.5" /></IconButton>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAddLesson}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Dodaj lekciju
        </button>
      </div>

      <div className="mt-4 border-t border-border/60 pt-3">
        <p className="shell-label mb-2">Ispiti znanja</p>
        {ispiti.length > 0 && (
          <ul className="mb-2 divide-y divide-border/60">
            {ispiti.map((ispit) => (
              <li key={ispit.id} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{ispit.naziv}</span>
                {ispit.rok && (
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{ispit.rok}</span>
                )}
                <IconButton label="Uredi ispit" onClick={() => onEditExam(ispit)}><Pencil className="h-3.5 w-3.5" /></IconButton>
                <IconButton label="Obriši ispit" onClick={() => onDeleteExam(ispit)}><Trash2 className="h-3.5 w-3.5" /></IconButton>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={onAddExam}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Dodaj ispit
        </button>
      </div>
    </section>
  );
}