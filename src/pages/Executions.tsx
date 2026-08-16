import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { Execution, Saga } from '../lib/types';
import StatusBadge from '../components/StatusBadge';

export default function Executions() {
  const [items, setItems] = useState<Execution[]>([]);
  const [sagas, setSagas] = useState<Saga[]>([]);
  const [status, setStatus] = useState('');
  const [sagaId, setSagaId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const qs = new URLSearchParams();
      if (status) qs.set('status', status);
      if (sagaId) qs.set('saga_id', sagaId);
      const [ex, sg] = await Promise.all([
        apiFetch<Execution[]>(`/api/executions?${qs.toString()}`),
        apiFetch<Saga[]>('/api/sagas'),
      ]);
      setItems(ex);
      setSagas(sg);
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load executions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status, sagaId]);

  const remove = async (id: number) => {
    if (!confirm('Delete this execution and its event log?')) return;
    try {
      await apiFetch('/api/executions', { method: 'DELETE', body: JSON.stringify({ id }) });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Runtime</p>
        <h1 className="font-display font-extrabold text-3xl mt-1">Executions</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl bg-[#10131a] border border-white/10 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {['running', 'completed', 'failed', 'compensating', 'compensated'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sagaId} onChange={(e) => setSagaId(e.target.value)} className="rounded-xl bg-[#10131a] border border-white/10 px-3 py-2 text-sm">
          <option value="">All sagas</option>
          {sagas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {error && <p className="text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-3 text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" /></div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-[#10131a] overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.4fr_1.2fr_auto_auto_auto] gap-3 px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-zinc-500 border-b border-white/5">
            <span>Saga</span><span>Correlation</span><span>Status</span><span>Step</span><span></span>
          </div>
          {items.map((ex) => (
            <div key={ex.id} className="grid md:grid-cols-[1.4fr_1.2fr_auto_auto_auto] gap-2 md:gap-3 items-center px-5 py-3 border-b border-white/5">
              <Link to={`/app/executions/${ex.id}`} className="text-sm font-medium hover:text-amber-200 truncate">{ex.saga_name || `Saga #${ex.saga_id}`}</Link>
              <span className="font-mono text-[11px] text-zinc-500 truncate">{ex.correlation_id}</span>
              <StatusBadge value={ex.status} />
              <span className="font-mono text-xs text-zinc-400">#{ex.current_step}</span>
              <button onClick={() => remove(ex.id)} className="justify-self-end text-zinc-600 hover:text-rose-300"><Trash2 size={14} /></button>
            </div>
          ))}
          {!items.length && <p className="text-sm text-zinc-500 py-12 text-center">No executions match these filters.</p>}
        </div>
      )}
    </div>
  );
}
