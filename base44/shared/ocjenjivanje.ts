const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['Prihvaćeno', 'Potreban ispravak'] },
    izvjesce: { type: 'string' },
    tocni: { type: 'array', items: { type: 'string' } },
    greske: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          zadatak: { type: 'string' },
          opis: { type: 'string' },
          savjet: { type: 'string' },
        },
        required: ['zadatak', 'opis', 'savjet'],
      },
    },
    bodovi: { type: 'number' },
    maks_bodovi: { type: 'number' },
  },
  required: ['status', 'izvjesce', 'tocni', 'greske', 'bodovi', 'maks_bodovi'],
};

const ENTITY = { zadaca: 'Predaja', ispit: 'PredajaIspita' };

async function signedUrls(base44, files) {
  const urls = [];
  for (const file of files ?? []) {
    if (!file?.file_uri) continue;
    try {
      const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: file.file_uri,
        expires_in: 900,
      });
      if (signed_url) urls.push(signed_url);
    } catch (error) {
      // datoteka koja se ne može otvoriti ne smije blokirati ocjenjivanje
    }
  }
  return urls;
}

function buildPrompt({ vrsta, naziv, sadrzaj, kljuc, odgovor, imaPriloga }) {
  const vrstaTekst = vrsta === 'ispit' ? 'ispit znanja' : 'domaću zadaću';
  return `Ti si iskusan, poticajan profesor matematike koji pregledava ${vrstaTekst}.

NAZIV: ${naziv || 'bez naziva'}

ZADACI (tekst koji je nastavnik zadao):
${sadrzaj || '(zadaci se nalaze u priloženoj datoteci)'}

SLUŽBENI KLJUČ ODGOVORA (strogo povjerljivo, koristi ga samo za provjeru i nikada ga ne prepisuj u cjelini):
${kljuc || '(nastavnik nije unio ključ — procijeni rješenje matematički)'}

UČENIKOV PISANI ODGOVOR:
${odgovor || '(učenik nije upisao tekstualni odgovor)'}
${imaPriloga ? 'U prilogu su fotografije ili PDF učeničkog rukopisnog postupka — obavezno ih pregledaj.' : ''}

UPUTE:
- Usporedi učenikov rad sa službenim ključem zadatak po zadatku.
- U polju "tocni" navedi oznake točno riješenih zadataka (npr. "1. zadatak").
- U polju "greske" za svaki netočan zadatak navedi što nije u redu i kratak savjet koji vodi prema rješenju, ali NIKADA ne otkrivaj cijeli postupak ni konačno rješenje.
- Ako su svi zadaci točni, status je "Prihvaćeno". Ako postoji barem jedna greška, status je "Potreban ispravak".
- "izvjesce" su 2 do 3 kratke, ohrabrujuće rečenice na hrvatskom jeziku.
- "bodovi" i "maks_bodovi" procijeni prema broju zadataka (svaki zadatak nosi jednak broj bodova), osim ako je nastavnik naveo drugačije.
- Odgovori isključivo na hrvatskom jeziku.`;
}

export async function ocjeniPredaju(base44, { vrsta, predajaId, user }) {
  const entityName = ENTITY[vrsta];
  const Predaje = base44.asServiceRole.entities[entityName];

  const predaja = await Predaje.get(predajaId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
  if (!predaja) return { status: 404, body: { error: 'Predaja nije pronađena.' } };

  if (user.role !== 'admin' && predaja.ucenik_email !== user.email) {
    return { status: 403, body: { error: 'Nemate pristup ovoj predaji.' } };
  }

  let sadrzaj = '';
  let naziv = predaja.naziv || '';
  let maksBodovi = Number(predaja.maks_bodovi) || 0;
  let kljucQuery = {};

  if (vrsta === 'ispit') {
    const ispit = await base44.asServiceRole.entities.Ispit
      .get(predaja.ispit_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (ispit) {
      sadrzaj = ispit.sadrzaj || '';
      naziv = ispit.naziv || naziv;
      maksBodovi = Number(ispit.maks_bodovi) || maksBodovi;
    }
    kljucQuery = { ispit_id: predaja.ispit_id };
  } else {
    const materijal = await base44.asServiceRole.entities.Materijal
      .get(predaja.materijal_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (materijal) {
      sadrzaj = materijal.sadrzaj || '';
      naziv = materijal.naziv || naziv;
    }
    kljucQuery = { materijal_id: predaja.materijal_id };
  }

  const kljucevi = await base44.asServiceRole.entities.KljucOdgovora.filter(kljucQuery);
  const kljuc = (kljucevi || []).map((row) => row.tekst).filter(Boolean).join('\n\n');

  await Predaje.update(predajaId, { status: 'AI pregledava' });

  const fileUrls = await signedUrls(base44, predaja.datoteke);

  const prompt = buildPrompt({
    vrsta,
    naziv,
    sadrzaj,
    kljuc,
    odgovor: predaja.tekst_odgovora,
    imaPriloga: fileUrls.length > 0,
  });

  const payload = { prompt, response_json_schema: RESPONSE_SCHEMA };
  if (fileUrls.length > 0) payload.file_urls = fileUrls;

  const ocjena = await base44.asServiceRole.integrations.Core.InvokeLLM(payload);

  const status = ocjena?.status === 'Prihvaćeno' ? 'Prihvaćeno' : 'Potreban ispravak';
  const bodovi = Number(ocjena?.bodovi) || 0;
  const maks = Number(ocjena?.maks_bodovi) || maksBodovi || 0;

  await Predaje.update(predajaId, {
    status,
    ai_izvjesce: ocjena?.izvjesce || '',
    ai_tocno: Array.isArray(ocjena?.tocni) ? ocjena.tocni : [],
    ai_greske: Array.isArray(ocjena?.greske) ? ocjena.greske : [],
    bodovi,
    maks_bodovi: maks,
  });

  return { status: 200, body: { ok: true, status, bodovi, maks_bodovi: maks } };
}