import { sortByOrder } from '@/lib/ucenje';
import { razinaOf } from '@/lib/razine';

const toPct = (bodovi, maks) => (maks > 0 ? Math.round(((bodovi || 0) / maks) * 100) : null);

const byId = (items) => Object.fromEntries((items || []).map((item) => [item.id, item]));

/**
 * Spaja dodjele i ocijenjene predaje u izvještaj uspješnosti po cjelinama.
 * Kad je proslijeđena razina, izvještaj obuhvaća samo cjeline te razine.
 */
export function buildNapredak({ cjeline, lekcije, materijali, ispiti, dodjele, predaje, predajeIspita, razina }) {
  const matById = byId(materijali);
  const lekById = byId(lekcije);
  const ispitById = byId(ispiti);

  const cjelinaMaterijala = (materijalId) =>
    matById[materijalId]?.cjelina_id || lekById[matById[materijalId]?.lekcija_id]?.cjelina_id || null;

  const sviOcijenjeni = [
    ...predaje
      .filter((p) => p.maks_bodovi > 0)
      .map((p) => ({
        id: p.id,
        naziv: p.naziv || matById[p.materijal_id]?.naziv || 'Domaća zadaća',
        tip: 'Domaća zadaća',
        cjelinaId: p.cjelina_id || cjelinaMaterijala(p.materijal_id) || lekById[p.lekcija_id]?.cjelina_id || null,
        pct: toPct(p.bodovi, p.maks_bodovi),
        bodovi: p.bodovi || 0,
        maks: p.maks_bodovi,
        date: p.created_date,
      })),
    ...predajeIspita
      .filter((p) => p.maks_bodovi > 0)
      .map((p) => ({
        id: p.id,
        naziv: p.naziv || ispitById[p.ispit_id]?.naziv || 'Ispit znanja',
        tip: 'Ispit znanja',
        cjelinaId: p.cjelina_id || ispitById[p.ispit_id]?.cjelina_id || null,
        pct: toPct(p.bodovi, p.maks_bodovi),
        bodovi: p.bodovi || 0,
        maks: p.maks_bodovi,
        date: p.created_date,
      })),
  ]
    .filter((item) => item.pct !== null)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const jedinice = sortByOrder(cjeline || []).filter((cjelina) => !razina || razinaOf(cjelina) === razina);
  const jedinicaIds = new Set(jedinice.map((cjelina) => cjelina.id));
  const graded = razina ? sviOcijenjeni.filter((item) => item.cjelinaId && jedinicaIds.has(item.cjelinaId)) : sviOcijenjeni;

  const predajaMap = byId(predaje);
  const ispitPredajaMap = Object.fromEntries((predajeIspita || []).map((p) => [p.ispit_id, p]));
  const dodjelaMap = {};
  const uzmi = (unitId) =>
    dodjelaMap[unitId] ||
    (dodjelaMap[unitId] = { zadace: 0, ispiti: 0, lekcije: 0, prihvaceno: 0 });

  (dodjele || []).forEach((dodjela) => {
    if (dodjela.tip === 'Domaća zadaća') {
      const unitId = cjelinaMaterijala(dodjela.materijal_id);
      if (!unitId) return;
      const bucket = uzmi(unitId);
      bucket.zadace += 1;
      if (predajaMap[dodjela.materijal_id]?.status === 'Prihvaćeno') bucket.prihvaceno += 1;
    } else if (dodjela.tip === 'Ispit znanja') {
      const unitId = ispitById[dodjela.ispit_id]?.cjelina_id;
      if (!unitId) return;
      const bucket = uzmi(unitId);
      bucket.ispiti += 1;
      if (ispitPredajaMap[dodjela.ispit_id]?.status === 'Prihvaćeno') bucket.prihvaceno += 1;
    } else {
      const unitId = lekById[dodjela.lekcija_id]?.cjelina_id;
      if (!unitId) return;
      uzmi(unitId).lekcije += 1;
    }
  });

  const rows = jedinice
    .map((cjelina) => {
      const work = graded.filter((item) => item.cjelinaId === cjelina.id);
      const bodovi = work.reduce((sum, item) => sum + item.bodovi, 0);
      const maks = work.reduce((sum, item) => sum + item.maks, 0);
      const counts = dodjelaMap[cjelina.id] || { zadace: 0, ispiti: 0, lekcije: 0, prihvaceno: 0 };
      const ukupno = counts.zadace + counts.ispiti;
      return {
        id: cjelina.id,
        naziv: cjelina.naziv,
        razina: razinaOf(cjelina),
        pct: maks > 0 ? Math.round((bodovi / maks) * 100) : null,
        ocjenjeno: work.length,
        ukupno,
        ...counts,
      };
    })
    .filter((row) => row.ukupno > 0 || row.ocjenjeno > 0);

  const ukupnoBodova = graded.reduce((sum, item) => sum + item.bodovi, 0);
  const ukupnoMaks = graded.reduce((sum, item) => sum + item.maks, 0);
  const ocijenjene = rows.filter((row) => row.pct !== null);
  const najbolja = [...ocijenjene].sort((a, b) => b.pct - a.pct)[0] || null;

  return {
    rows,
    graded,
    stats: {
      prosjek: ukupnoMaks > 0 ? Math.round((ukupnoBodova / ukupnoMaks) * 100) : null,
      ocjenjeno: graded.length,
      rijesene: rows.filter((row) => row.ukupno > 0 && row.prihvaceno >= row.ukupno).length,
      cjeline: rows.length,
      najbolja,
    },
  };
}

export function unitChartData(rows) {
  return rows
    .filter((row) => row.pct !== null)
    .map((row) => ({
      full: row.naziv,
      name: row.naziv.length > 14 ? `${row.naziv.slice(0, 13)}…` : row.naziv,
      pct: row.pct,
    }));
}

export function trendChartData(graded, limit = 12) {
  return graded.slice(-limit).map((item) => ({
    label: new Date(item.date).toLocaleDateString('hr-HR', { day: 'numeric', month: 'numeric' }),
    naziv: item.naziv,
    tip: item.tip,
    pct: item.pct,
  }));
}