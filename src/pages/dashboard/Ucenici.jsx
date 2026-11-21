import { useEffect, useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeading from '@/components/dashboard/PageHeading';
import RazinaTabs from '@/components/dashboard/RazinaTabs';
import { DEFAULT_RAZINA, RAZINE } from '@/lib/razine';
import { formatDate } from '@/lib/ucenje';

export default function Ucenici() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [razina, setRazina] = useState(DEFAULT_RAZINA);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    base44.entities.User.list()
      .then((items) => {
        if (alive) setUsers(items || []);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [version]);

  const pozovi = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSending(true);
    try {
      const response = await base44.functions.invoke('pozoviUcenika', { email, razina });
      if (response.data?.error) {
        setError(response.data.error);
      } else {
        setMessage(`Pozivnica je poslana na ${response.data?.email || email} — razina: ${razina}.`);
        setEmail('');
        setVersion((value) => value + 1);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Pozivnica nije poslana. Provjerite adresu i pokušajte ponovno.');
    } finally {
      setSending(false);
    }
  };

  const promijeniRazinu = async (ucenik, novaRazina) => {
    setUsers((trenutni) => trenutni.map((item) => (item.id === ucenik.id ? { ...item, razina: novaRazina } : item)));
    await base44.entities.User.update(ucenik.id, { razina: novaRazina });
  };

  const ucenici = users.filter((user) => user.role !== 'admin');

  return (
    <div>
      <PageHeading
        eyebrow="Učenici"
        title="Učenici"
        description="Pozovite učenika e-mailom i odredite njegovu razinu. Svaki učenik ima samo jednu razinu, onu koju je odabrao pri upisu."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="shell-card rounded-xl px-4 py-4 lg:col-span-2">
          <h2 className="font-display text-base font-semibold">Pozovi učenika</h2>
          <form onSubmit={pozovi} className="mt-3 space-y-3">
            <div>
              <label htmlFor="ucenik-email" className="mb-1.5 block text-sm font-medium">E-mail adresa</label>
              <input
                id="ucenik-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ucenik@primjer.hr"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <p className="mb-1.5 block text-sm font-medium">Razina učenika</p>
              <RazinaTabs value={razina} onChange={setRazina} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-success">{message}</p>}
            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
              Pošalji pozivnicu
            </button>
          </form>
        </section>

        <section className="lg:col-span-3">
          <h2 className="mb-3 font-display text-base font-semibold">
            Popis učenika <span className="font-mono text-xs text-muted-foreground">({ucenici.length})</span>
          </h2>
          {loading ? (
            <div className="grid place-items-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : ucenici.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              Još nema učenika. Pošaljite prvu pozivnicu.
            </div>
          ) : (
            <ul className="shell-card divide-y divide-border/60 overflow-hidden rounded-xl">
              {ucenici.map((ucenik) => (
                <li key={ucenik.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary/60 font-mono text-[11px] font-medium uppercase text-foreground">
                    {(ucenik.full_name || ucenik.email || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{ucenik.full_name || ucenik.email}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[ucenik.email, formatDate(ucenik.created_date)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <label className="sr-only" htmlFor={`razina-${ucenik.id}`}>
                    Razina učenika {ucenik.full_name || ucenik.email}
                  </label>
                  <select
                    id={`razina-${ucenik.id}`}
                    value={ucenik.razina || ''}
                    onChange={(event) => promijeniRazinu(ucenik, event.target.value)}
                    className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="" disabled>
                      Odaberi razinu
                    </option>
                    {RAZINE.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.value}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}