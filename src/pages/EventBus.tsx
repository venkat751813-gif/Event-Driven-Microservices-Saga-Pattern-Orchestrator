import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { BusEvent, Saga } from '../lib/types';
import EventRow from '../components/EventRow';

export default function EventBus() {
  const [events, setEvents] = useState<BusEvent[]>([]);
  const [sagas, setSagas] = useState<Saga[]>([]);
  const [sagaId, setSagaId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const qs = sagaId ? `?saga_id=${sagaId}&limit=200` : '?limit=200';
      const [ev, sg] = await Promise.all([
        apiFetch<BusEvent[]>(`/api/events${qs}`),
        apiFetch<Saga[]>('/api/sagas'),
      ]);
      setEvents(ev);
      setSagas(sg);
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [sagaId]);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Stream</p>
          <h1 className="font-display font-extrabold text-3xl mt-1 flex items-center gap-2">
            <Radio size={22} className="text-teal-300" /> Event bus
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Live tail · refreshes every 4s</p>
        </div>
        <select value={sagaId} onChange={(e) => setSagaId(e.target.value)} className="rounded-xl bg-[#10131a] border border-white/10 px-3 py-2 text-sm">
          <option value="">All sagas</option>
          {sagas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {error && <p className="text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-3 text-sm">{error}</p>}

      <div className="rounded-2xl border border-white/8 bg-[#10131a] p-5">
        {loading && !events.length ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" /></div>
        ) : (
          events.map((ev) => <EventRow key={ev.id} event={ev} />)
        )}
        {!loading && !events.length && <p className="text-sm text-zinc-500 py-10 text-center">The bus is quiet.</p>}
      </div>
    </div>
  );
}
