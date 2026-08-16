import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Play, Plus, Save, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { Saga, SagaStep, Service } from '../lib/types';
import SagaFlow from '../components/SagaFlow';
import StatusBadge from '../components/StatusBadge';

const blankStep = {
  name: '',
  action: '',
  event_success: '',
  event_failure: '',
  compensate_action: '',
  payload_schema: '{}',
  timeout_ms: 5000,
  retry_count: 0,
  service_id: null as number | null,
};

export default function Designer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saga, setSaga] = useState<Saga | null>(null);
  const [steps, setSteps] = useState<SagaStep[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<SagaStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newStep, setNewStep] = useState(blankStep);
  const [meta, setMeta] = useState({ name: '', description: '', pattern: 'orchestrated', status: 'draft' });

  const load = async () => {
    try {
      const [s, svcs] = await Promise.all([
        apiFetch<Saga>(`/api/sagas?id=${id}`),
        apiFetch<Service[]>('/api/services'),
      ]);
      setSaga(s);
      setSteps(s.steps || []);
      setServices(svcs);
      setMeta({ name: s.name, description: s.description, pattern: s.pattern, status: s.status });
      setSelected((prev) => {
        if (!prev) return (s.steps || [])[0] || null;
        return (s.steps || []).find((x) => x.id === prev.id) || (s.steps || [])[0] || null;
      });
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load saga');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const saveMeta = async () => {
    if (!meta.name.trim()) { setError('Saga name is required.'); return; }
    setBusy(true);
    try {
      await apiFetch('/api/sagas', { method: 'PUT', body: JSON.stringify({ id: Number(id), ...meta }) });
      setNotice('Saga definition saved.');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const addStep = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStep.name.trim()) { setError('Step name is required.'); return; }
    setBusy(true);
    try {
      await apiFetch('/api/steps', {
        method: 'POST',
        body: JSON.stringify({ ...newStep, saga_id: Number(id) }),
      });
      setNewStep(blankStep);
      setAdding(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not add step');
    } finally {
      setBusy(false);
    }
  };

  const saveStep = async () => {
    if (!selected) return;
    if (!selected.name.trim()) { setError('Step name is required.'); return; }
    setBusy(true);
    try {
      await apiFetch('/api/steps', { method: 'PUT', body: JSON.stringify(selected) });
      setNotice('Step updated.');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const deleteStep = async (stepId: number) => {
    if (!confirm('Remove this step?')) return;
    setBusy(true);
    try {
      await apiFetch('/api/steps', { method: 'DELETE', body: JSON.stringify({ id: stepId }) });
      setSelected(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const move = async (step: SagaStep, dir: -1 | 1) => {
    const idx = steps.findIndex((s) => s.id === step.id);
    const swap = steps[idx + dir];
    if (!swap) return;
    setBusy(true);
    try {
      await apiFetch('/api/steps', { method: 'PUT', body: JSON.stringify({ id: step.id, step_order: swap.step_order }) });
      await apiFetch('/api/steps', { method: 'PUT', body: JSON.stringify({ id: swap.id, step_order: step.step_order }) });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Reorder failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" /></div>;
  }
  if (!saga) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400">Saga not found.</p>
        <button onClick={() => navigate('/app/sagas')} className="mt-4 text-amber-300 text-sm">Back to catalog</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Designer</p>
          <h1 className="font-display font-extrabold text-3xl mt-1">{meta.name || 'Untitled saga'}</h1>
          <div className="mt-2 flex gap-2">
            <StatusBadge value={meta.pattern} />
            <StatusBadge value={meta.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={saveMeta} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-[#1a1003] text-sm font-semibold">
            <Save size={14} /> Save definition
          </button>
          <Link to={`/app/sagas/${id}/run`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm">
            <Play size={14} /> Run
          </Link>
          <Link to={`/app/download/${id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm">Download</Link>
        </div>
      </div>

      {error && <p className="text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-3 text-sm">{error}</p>}
      {notice && <p className="text-teal-300 bg-teal-400/10 border border-teal-400/20 rounded-xl px-4 py-3 text-sm">{notice}</p>}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/8 bg-[#10131a] p-5 space-y-3">
          <h2 className="font-display font-bold">Metadata</h2>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Name</span>
            <input value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-amber-400/50" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Description</span>
            <textarea value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm min-h-20 outline-none focus:border-amber-400/50" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Pattern</span>
              <select value={meta.pattern} onChange={(e) => setMeta({ ...meta, pattern: e.target.value })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm">
                <option value="orchestrated">orchestrated</option>
                <option value="choreographed">choreographed</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Status</span>
              <select value={meta.status} onChange={(e) => setMeta({ ...meta, status: e.target.value })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm">
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </label>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#10131a] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold">Participant flow</h2>
            <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1 text-xs text-amber-300">
              <Plus size={14} /> Add step
            </button>
          </div>
          <SagaFlow steps={steps} services={services} selectedId={selected?.id} onSelect={setSelected} />
          {adding && (
            <form onSubmit={addStep} className="mt-5 grid md:grid-cols-2 gap-3 border-t border-white/5 pt-4">
              <input placeholder="Step name" value={newStep.name} onChange={(e) => setNewStep({ ...newStep, name: e.target.value })} className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm" />
              <select value={newStep.service_id ?? ''} onChange={(e) => setNewStep({ ...newStep, service_id: e.target.value ? Number(e.target.value) : null })} className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm">
                <option value="">Select service</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input placeholder="Command / action" value={newStep.action} onChange={(e) => setNewStep({ ...newStep, action: e.target.value })} className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono" />
              <input placeholder="Compensate action" value={newStep.compensate_action} onChange={(e) => setNewStep({ ...newStep, compensate_action: e.target.value })} className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono" />
              <input placeholder="Success event" value={newStep.event_success} onChange={(e) => setNewStep({ ...newStep, event_success: e.target.value })} className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono" />
              <input placeholder="Failure event" value={newStep.event_failure} onChange={(e) => setNewStep({ ...newStep, event_failure: e.target.value })} className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono" />
              <div className="md:col-span-2 flex gap-2">
                <button disabled={busy} className="px-4 py-2 rounded-xl bg-amber-400 text-[#1a1003] text-sm font-semibold">Add participant</button>
                <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 rounded-xl border border-white/10 text-sm">Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {selected && (
        <div className="rounded-2xl border border-white/8 bg-[#10131a] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-display font-bold">Step {selected.step_order} · {selected.name}</h2>
            <div className="flex gap-2">
              <button onClick={() => move(selected, -1)} className="p-2 rounded-lg border border-white/10"><ArrowUp size={14} /></button>
              <button onClick={() => move(selected, 1)} className="p-2 rounded-lg border border-white/10"><ArrowDown size={14} /></button>
              <button onClick={() => deleteStep(selected.id)} className="p-2 rounded-lg border border-rose-400/30 text-rose-300"><Trash2 size={14} /></button>
              <button onClick={saveStep} disabled={busy} className="px-3 py-2 rounded-lg bg-amber-400 text-[#1a1003] text-sm font-semibold">Save step</button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Name</span>
              <input value={selected.name} onChange={(e) => setSelected({ ...selected, name: e.target.value })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Service</span>
              <select value={selected.service_id ?? ''} onChange={(e) => setSelected({ ...selected, service_id: e.target.value ? Number(e.target.value) : null })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm">
                <option value="">Unassigned</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Action</span>
              <input value={selected.action} onChange={(e) => setSelected({ ...selected, action: e.target.value })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Success event</span>
              <input value={selected.event_success} onChange={(e) => setSelected({ ...selected, event_success: e.target.value })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Failure event</span>
              <input value={selected.event_failure} onChange={(e) => setSelected({ ...selected, event_failure: e.target.value })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Compensate</span>
              <input value={selected.compensate_action} onChange={(e) => setSelected({ ...selected, compensate_action: e.target.value })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Timeout ms</span>
              <input type="number" value={selected.timeout_ms} onChange={(e) => setSelected({ ...selected, timeout_ms: Number(e.target.value) })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Retries</span>
              <input type="number" value={selected.retry_count} onChange={(e) => setSelected({ ...selected, retry_count: Number(e.target.value) })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono" />
            </label>
            <label className="block md:col-span-2 lg:col-span-1">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Payload schema</span>
              <textarea value={selected.payload_schema} onChange={(e) => setSelected({ ...selected, payload_schema: e.target.value })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono min-h-16" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
