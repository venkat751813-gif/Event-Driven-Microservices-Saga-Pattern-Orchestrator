import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Play, Plus, Trash2, Workflow } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { Saga } from '../lib/types';
import StatusBadge from '../components/StatusBadge';

export default function Sagas() {
  const [items, setItems] = useState<Saga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setItems(await apiFetch<Saga[]>('/api/sagas'));
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load sagas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true);
    try {
      const saga = await apiFetch<Saga>('/api/sagas', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Untitled saga',
          description: 'New distributed transaction',
          pattern: 'orchestrated',
          status: 'draft',
        }),
      });
      navigate(`/app/sagas/${saga.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not create saga');
      setCreating(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this saga and its steps? Executions are kept.')) return;
    try {
      await apiFetch('/api/sagas', { method: 'DELETE', body: JSON.stringify({ id }) });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Definitions</p>
          <h1 className="font-display font-extrabold text-3xl mt-1">Saga catalog</h1>
        </div>
        <button onClick={create} disabled={creating} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-[#1a1003] text-sm font-semibold disabled:opacity-60">
          <Plus size={16} /> {creating ? 'Forging…' : 'New saga'}
        </button>
      </div>

      {error && <p className="text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-3 text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map((s) => (
            <div key={s.id} className="rounded-2xl border border-white/8 bg-[#10131a] p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-amber-400/10 text-amber-300 flex items-center justify-center">
                    <Workflow size={18} />
                  </div>
                  <div className="min-w-0">
                    <Link to={`/app/sagas/${s.id}`} className="font-display font-bold hover:text-amber-200 block truncate">{s.name}</Link>
                    <p className="text-xs text-zinc-500 line-clamp-2">{s.description}</p>
                  </div>
                </div>
                <button onClick={() => remove(s.id)} className="text-zinc-600 hover:text-rose-300"><Trash2 size={14} /></button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge value={s.pattern} />
                <StatusBadge value={s.status} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`/app/sagas/${s.id}`} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs hover:bg-white/5">Design</Link>
                <Link to={`/app/sagas/${s.id}/run`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400/15 text-amber-200 text-xs">
                  <Play size={12} /> Run
                </Link>
                <Link to={`/app/download/${s.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-xs hover:bg-white/5">
                  <Download size={12} /> Download
                </Link>
              </div>
            </div>
          ))}
          {!items.length && <p className="text-zinc-500 text-sm col-span-full py-10 text-center">No sagas yet. Forge the first one.</p>}
        </div>
      )}
    </div>
  );
}
