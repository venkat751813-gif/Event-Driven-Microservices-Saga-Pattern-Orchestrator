import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Play, X } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { Execution as Exec, Service } from '../lib/types';
import SagaFlow from '../components/SagaFlow';
import StatusBadge from '../components/StatusBadge';
import EventRow from '../components/EventRow';

export default function Execution() {
  const { id } = useParams();
  const [exec, setExec] = useState<Exec | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [e, sv] = await Promise.all([
        apiFetch<Exec>(`/api/executions?id=${id}`),
        apiFetch<Service[]>('/api/services'),
      ]);
      setExec(e);
      setServices(sv);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load execution');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const act = async (action: 'succeed' | 'fail' | 'autorun') => {
    setBusy(true);
    setError('');
    try {
      await apiFetch('/api/execute', {
        method: 'POST',
        body: JSON.stringify({ action, execution_id: Number(id) }),
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" /></div>;
  if (!exec) return <p className="text-zinc-400">Execution not found.</p>;

  const live = exec.status === 'running';

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Execution</p>
          <h1 className="font-display font-extrabold text-3xl mt-1">{exec.saga_name || exec.saga?.name || 'Saga run'}</h1>
          <p className="font-mono text-xs text-zinc-500 mt-1">{exec.correlation_id}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge value={exec.status} />
            {exec.saga && <StatusBadge value={exec.saga.pattern} />}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={!live || busy} onClick={() => act('succeed')} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-400/15 text-teal-200 text-sm disabled:opacity-40">
            <Check size={14} /> Succeed step
          </button>
          <button disabled={!live || busy} onClick={() => act('fail')} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-400/15 text-rose-200 text-sm disabled:opacity-40">
            <X size={14} /> Fail + compensate
          </button>
          <button disabled={!live || busy} onClick={() => act('autorun')} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-400 text-[#1a1003] text-sm font-semibold disabled:opacity-40">
            <Play size={14} /> Auto-run happy path
          </button>
        </div>
      </div>

      {error && <p className="text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-3 text-sm">{error}</p>}

      <div className="rounded-2xl border border-white/8 bg-[#10131a] p-5">
        <h2 className="font-display font-bold mb-4">Timeline</h2>
        <SagaFlow
          steps={exec.steps || []}
          services={services}
          currentStep={exec.current_step}
          status={exec.status}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/8 bg-[#10131a] p-5">
          <h2 className="font-display font-bold mb-3">Context</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-zinc-500">Current step</dt><dd className="font-mono">{exec.current_step}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-zinc-500">Started</dt><dd className="font-mono text-xs">{exec.started_at ? new Date(exec.started_at).toLocaleString() : '—'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-zinc-500">Finished</dt><dd className="font-mono text-xs">{exec.completed_at ? new Date(exec.completed_at).toLocaleString() : '—'}</dd></div>
          </dl>
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mt-4 mb-2">Payload</p>
          <pre className="text-[11px] font-mono text-zinc-400 bg-black/40 rounded-xl p-3 overflow-auto max-h-48">{exec.payload}</pre>
          {exec.saga_id && (
            <Link to={`/app/sagas/${exec.saga_id}`} className="inline-block mt-4 text-xs text-amber-300">Open definition →</Link>
          )}
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#10131a] p-5">
          <h2 className="font-display font-bold mb-2">Event log</h2>
          <div className="max-h-[480px] overflow-auto">
            {(exec.events || []).map((ev) => <EventRow key={ev.id} event={ev} />)}
            {!exec.events?.length && <p className="text-sm text-zinc-500 py-8 text-center">No events recorded.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
