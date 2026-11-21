import { Users } from 'lucide-react';
import UceniciChecklist from '@/components/dashboard/UceniciChecklist';
import { clanoviGrupe } from '@/lib/grupe';

export default function PrimateljiPicker({ ucenici, grupe, uceniciValue, grupeValue, onUceniciChange, onGrupeChange }) {
  const toggleGrupa = (id) => {
    onGrupeChange(grupeValue.includes(id) ? grupeValue.filter((item) => item !== id) : [...grupeValue, id]);
  };

  const izGrupa = new Set();
  grupeValue.forEach((id) => {
    const grupa = grupe.find((item) => item.id === id);
    clanoviGrupe(grupa, ucenici).forEach((ucenik) => izGrupa.add(ucenik.email));
  });
  const ukupno = new Set([...uceniciValue, ...izGrupa]).size;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Primatelji</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUceniciChange(ucenici.map((ucenik) => ucenik.email))}
            className="text-xs text-primary hover:underline"
          >
            Svi učenici
          </button>
          <button
            type="button"
            onClick={() => {
              onUceniciChange([]);
              onGrupeChange([]);
            }}
            className="text-xs text-muted-foreground hover:underline"
          >
            Očisti
          </button>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{ukupno} odabrano</span>
        </div>
      </div>

      {grupe.length > 0 && (
        <div className="mb-2.5">
          <p className="mb-1.5 text-xs text-muted-foreground">Grupe</p>
          <div className="flex flex-wrap gap-1.5">
            {grupe.map((grupa) => {
              const active = grupeValue.includes(grupa.id);
              const broj = clanoviGrupe(grupa, ucenici).length;
              return (
                <button
                  key={grupa.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleGrupa(grupa.id)}
                  className={
                    active
                      ? 'inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground'
                      : 'inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground'
                  }
                >
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {grupa.naziv}
                  <span className="font-mono tabular-nums opacity-70">{broj}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <UceniciChecklist
        ucenici={ucenici}
        value={uceniciValue}
        onChange={onUceniciChange}
        emptyText="Pozovite učenike na stranici Učenici."
      />

      <p className="mt-1.5 text-xs text-muted-foreground">
        Grupnu dodjelu dobivaju i učenici koji se grupi pridruže kasnije.
      </p>
    </div>
  );
}