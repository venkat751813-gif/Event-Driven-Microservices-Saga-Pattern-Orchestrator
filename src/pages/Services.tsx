import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { Service } from '../lib/types';
import StatusBadge from '../components/StatusBadge';

const empty = { name: '', slug: '', description: '', endpoint: '', status: 'healthy', color: '#e8a317', owner: '' };

export default function Services() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const data = await apiFetch<Service[]>('/api/services');
      setItems(data);
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.slug.trim()) {
      setFormError('Name and slug are required.');
      return;
    }
    setBusy(true);
    try {
      await apiFetch('/api/services', { method: 'POST', body: JSON.stringify(form) });
      setOpen(false);
      setForm(empty);
      await load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not create service');
    } finally {
      setBusy(false);
    }
  };

  const cycleStatus = async (svc: Service) => {
    const next = svc.status === 'healthy' ? 'degraded' : svc.status === 'degraded' ? 'down' : 'healthy';
    try {
      await apiFetch('/api/services', { method: 'PUT', body: JSON.stringify({ id: svc.id, status: next }) });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Remove this service from the registry?')) return;
    try {
      await apiFetch('/api/services', { method: 'DELETE', body: JSON.stringify({ id }) });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Registry</p>
          <h1 className="font-display font-extrabold text-3xl mt-1">Participating services</h1>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-[#1a1003] text-sm font-semibold">
          <Plus size={16} /> Register service
        </button>
      </div>

      {error && <p className="text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-3 text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((s) => (
            <div key={s.id} className="rounded-2xl border border-white/8 bg-[#10131a] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-9 w-9 rounded-xl shrink-0" style={{ background: s.color }} />
                  <div className="min-w-0">
                    <p className="font-display font-bold truncate">{s.name}</p>
                    <p className="font-mono text-[11px] text-zinc-500 truncate">{s.slug}</p>
                  </div>
                </div>
                <button onClick={() => remove(s.id)} className="text-zinc-600 hover:text-rose-300"><Trash2 size={14} /></button>
              </div>
              <p className="text-sm text-zinc-400 mt-3 line-clamp-2">{s.description}</p>
              <p className="font-mono text-[11px] text-zinc-500 mt-3 truncate">{s.endpoint || 'no endpoint'}</p>
              <div className="mt-4 flex items-center justify-between">
                <button onClick={() => cycleStatus(s)} title="Cycle health">
                  <StatusBadge value={s.status} />
                </button>
                <span className="text-[11px] text-zinc-600">{s.owner}</span>
              </div>
            </div>
          ))}
          {!items.length && <p className="text-zinc-500 text-sm col-span-full py-10 text-center">No services registered.</p>}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#10131a] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg">Register service</h2>
              <button type="button" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            {[
              ['name', 'Name', 'Payment Service'],
              ['slug', 'Slug', 'payment'],
              ['endpoint', 'Endpoint', 'http://payment.svc.local/v1'],
              ['owner', 'Owner', 'payments-team'],
            ].map(([k, label, ph]) => (
              <label key={k} className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</span>
                <input
                  value={(form as Record<string, string>)[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  placeholder={ph}
                  className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-amber-400/50"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-amber-400/50 min-h-20"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                >
                  <option value="healthy">healthy</option>
                  <option value="degraded">degraded</option>
                  <option value="down">down</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Color</span>
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="mt-1 h-10 w-full rounded-xl bg-transparent" />
              </label>
            </div>
            {formError && <p className="text-sm text-rose-300">{formError}</p>}
            <button disabled={busy} className="w-full py-2.5 rounded-xl bg-amber-400 text-[#1a1003] font-semibold text-sm">
              {busy ? 'Saving…' : 'Add to registry'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
