import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ocjeniPredaju } from '../../shared/ocjenjivanje.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { predaja_id } = await req.json().catch(() => ({}));
    if (!predaja_id) return Response.json({ error: 'predaja_id je obavezan.' }, { status: 400 });

    const result = await ocjeniPredaju(base44, { vrsta: 'zadaca', predajaId: predaja_id, user });
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}