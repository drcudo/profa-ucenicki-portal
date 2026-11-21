export const RAZINE = [
  { value: 'A razina', kratko: 'A', opis: 'Državna matura — A razina' },
  { value: 'B razina', kratko: 'B', opis: 'Državna matura — B razina' },
  { value: 'Nacionalni ispit', kratko: 'NI', opis: 'Nacionalni ispit' },
  { value: 'Individualne instrukcije', kratko: 'II', opis: 'Individualne instrukcije' },
];

export const RAZINA_VALUES = RAZINE.map((razina) => razina.value);

export const DEFAULT_RAZINA = RAZINA_VALUES[0];

export const razinaOf = (cjelina) => cjelina?.razina || DEFAULT_RAZINA;