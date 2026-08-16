import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Play } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { Execution, Saga, Service } from '../lib/types';
import SagaFlow from '../components/SagaFlow';
import StatusBadge from '../components/StatusBadge';

export default function RunSaga() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saga, setSaga] = useState<Saga | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [payload, setPayload] = useState('{\n  "orderId": "ORD-10042",\n  "customerId": "C-8841",\n  "amount": 249.00\n}');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<Execution[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch<Saga>(`/api/sagas?id=${id}`),
      apiFetch<Service[]>('/api/services'),
      apiFetch<Execution[]>(`/api/executions?saga_id=${id}`),
    ])
      .then(([s, sv, ex]) => {
        setSaga(s);
        setServices(sv);
        setRecent(ex.slice(0, 6));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const start = async () => {
    setError('');
    let parsed: unknown = payload;
    try { parsed = JSON.parse(payload); } catch { setError('Payload must be valid JSON.'); return; }
    if (!saga?.steps?.length) { setError('This saga has no steps.'); return; }
    setBusy(true);
    try {
      const exec = await apiFetch<Execution>('/api/execute', {
        method: 'POST',
        body: JSON.stringify({ action: 'start', saga_id: Number(id), payload: parsed }),
      });
      navigate(`/app/executions/${exec.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" /></div>;
  if (!saga) return <p className="text-zinc-400">Saga not found.</p>;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Launch pad</p>
        <h1 className="font-display font-extrabold text-3xl mt-1">Run {saga.name}</h1>
        <div className="mt-2 flex gap-2"><StatusBadge value={saga.pattern} /><StatusBadge value={saga.status} /></div>
      </div>

      {error && <p className="text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-3 text-sm">{error}</p>}

      <div className="rounded-2xl border border-white/8 bg-[#10131a] p-5">
        <h2 className="font-display font-bold mb-4">Forward path</h2>
        <SagaFlow steps={saga.steps || []} services={services} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/8 bg-[#10131a] p-5">
          <h2 className="font-display font-bold mb-3">Start payload</h2>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            className="w-full min-h-48 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono outline-none focus:border-amber-400/50"
          />
          <button onClick={start} disabled={busy} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-[#1a1003] font-semibold text-sm disabled:opacity-60">
            <Play size={14} /> {busy ? 'Dispatching…' : 'Start execution'}
          </button>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#10131a] p-5">
          <h2 className="font-display font-bold mb-3">Recent for this saga</h2>
          <div className="space-y-2">
            {recent.map((ex) => (
              <Link key={ex.id} to={`/app/executions/${ex.id}`} className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2 hover:bg-white/3">
                <span className="font-mono text-[11px] text-zinc-400 truncate">{ex.correlation_id}</span>
                <StatusBadge value={ex.status} />
              </Link>
            ))}
            {!recent.length && <p className="text-sm text-zinc-500">No prior runs.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
