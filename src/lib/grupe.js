import { base44 } from '@/api/base44Client';

export const NACINI_GRUPE = ['Ručno', 'Po razini'];

export const imeUcenika = (ucenik) => ucenik?.full_name || ucenik?.email || '';

export function clanoviGrupe(grupa, ucenici) {
  if (!grupa) return [];
  if (grupa.nacin === 'Po razini') {
    return ucenici.filter((ucenik) => ucenik.razina === grupa.razina);
  }
  const emails = new Set(grupa.clanovi || []);
  return ucenici.filter((ucenik) => emails.has(ucenik.email));
}

const kljucStavke = (dodjela) =>
  [dodjela.tip, dodjela.lekcija_id || '', dodjela.materijal_id || '', dodjela.ispit_id || ''].join('|');

// Dodjele napravljene grupi prenose se na nove članove i uklanjaju onima koji su izašli.
export async function uskladiDodjeleGrupe(grupa, stariEmails, noviEmails, ucenici) {
  const dodjele = await base44.entities.Dodjela.filter({ grupa_id: grupa.id });
  if (dodjele.length === 0) return;

  const izasli = stariEmails.filter((email) => !noviEmails.includes(email));
  const usli = noviEmails.filter((email) => !stariEmails.includes(email));

  if (izasli.length) {
    await Promise.all(
      dodjele.filter((d) => izasli.includes(d.ucenik_email)).map((d) => base44.entities.Dodjela.delete(d.id)),
    );
  }

  if (usli.length === 0) return;

  const sabloni = [];
  const vidjeno = new Set();
  dodjele.forEach((dodjela) => {
    const kljuc = kljucStavke(dodjela);
    if (vidjeno.has(kljuc)) return;
    vidjeno.add(kljuc);
    sabloni.push(dodjela);
  });

  const imena = Object.fromEntries(ucenici.map((u) => [u.email, imeUcenika(u)]));
  const nove = [];
  usli.forEach((email) => {
    sabloni.forEach((sablon) => {
      const kljuc = kljucStavke(sablon);
      if (dodjele.some((d) => d.ucenik_email === email && kljucStavke(d) === kljuc)) return;
      nove.push({
        tip: sablon.tip,
        cjelina_id: sablon.cjelina_id || '',
        lekcija_id: sablon.lekcija_id || '',
        materijal_id: sablon.materijal_id || '',
        ispit_id: sablon.ispit_id || '',
        rok: sablon.rok || '',
        napomena: sablon.napomena || '',
        grupa_id: grupa.id,
        grupa_naziv: grupa.naziv,
        ucenik_email: email,
        ucenik_ime: imena[email] || email,
      });
    });
  });

  if (nove.length) await base44.entities.Dodjela.bulkCreate(nove);
}

export async function spremiGrupu({ grupa, naziv, nacin, razina, clanovi }, ucenici) {
  const stariEmails = grupa?.clanovi || [];
  const payload = {
    naziv: naziv.trim(),
    nacin,
    razina: nacin === 'Po razini' ? razina : '',
    clanovi,
  };

  const spremljena = grupa
    ? await base44.entities.Grupa.update(grupa.id, payload)
    : await base44.entities.Grupa.create(payload);

  if (grupa && grupa.naziv !== payload.naziv) {
    await base44.entities.Dodjela.updateMany({ grupa_id: grupa.id }, { $set: { grupa_naziv: payload.naziv } });
  }

  await uskladiDodjeleGrupe({ ...spremljena, naziv: payload.naziv }, stariEmails, clanovi, ucenici);
  return spremljena;
}

// Grupe po razini same prate učenike s tom razinom.
export async function osvjeziGrupe(grupe, ucenici) {
  const rezultat = [];
  for (const grupa of grupe) {
    if (grupa.nacin !== 'Po razini') {
      rezultat.push(grupa);
      continue;
    }
    const emails = clanoviGrupe(grupa, ucenici).map((u) => u.email);
    const stari = grupa.clanovi || [];
    const nepromijenjeno = emails.length === stari.length && emails.every((email) => stari.includes(email));
    if (nepromijenjeno) {
      rezultat.push(grupa);
      continue;
    }
    await base44.entities.Grupa.update(grupa.id, { clanovi: emails });
    await uskladiDodjeleGrupe({ ...grupa, clanovi: emails }, stari, emails, ucenici);
    rezultat.push({ ...grupa, clanovi: emails });
  }
  return rezultat;
}

export async function obrisiGrupu(grupa) {
  await base44.entities.Dodjela.updateMany({ grupa_id: grupa.id }, { $set: { grupa_id: '', grupa_naziv: '' } });
  await base44.entities.Grupa.delete(grupa.id);
}