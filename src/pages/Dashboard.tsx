import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Boxes, GitBranch, Radio, Workflow } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { Stats } from '../lib/types';
import StatusBadge from '../components/StatusBadge';
import EventRow from '../components/EventRow';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<Stats>('/api/stats')
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-3">{error}</p>;
  }

  const cards = [
    { label: 'Sagas', value: stats?.sagas ?? 0, icon: Workflow, to: '/app/sagas' },
    { label: 'Services', value: stats?.services ?? 0, icon: Boxes, to: '/app/services' },
    { label: 'Executions', value: stats?.executions ?? 0, icon: GitBranch, to: '/app/executions' },
    { label: 'Healthy nodes', value: stats?.healthyServices ?? 0, icon: Activity, to: '/app/services' },
  ];

  const statuses = ['running', 'completed', 'compensating', 'compensated', 'failed'];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Control room</p>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl mt-1">Live saga operations</h1>
        <p className="text-zinc-500 mt-2 text-sm">Watch definitions, executions, and the event bus from one desk.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-2xl border border-white/8 bg-[#10131a] p-5 hover:border-amber-400/30 transition">
            <c.icon size={16} className="text-amber-300 mb-4" />
            <p className="font-display text-3xl font-bold">{c.value}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#10131a] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold">Recent executions</h2>
            <Link to="/app/executions" className="text-xs text-amber-300">View all</Link>
          </div>
          <div className="space-y-2">
            {(stats?.recentExecutions || []).length === 0 && (
              <p className="text-sm text-zinc-500 py-8 text-center">No executions yet. Start a saga from the designer.</p>
            )}
            {(stats?.recentExecutions || []).map((ex) => (
              <Link
                key={ex.id}
                to={`/app/executions/${ex.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 px-3 py-3 hover:bg-white/3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{ex.saga_name || `Saga #${ex.saga_id}`}</p>
                  <p className="font-mono text-[10px] text-zinc-500 truncate">{ex.correlation_id}</p>
                </div>
                <StatusBadge value={ex.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#10131a] p-5">
          <h2 className="font-display font-bold mb-4">Status mix</h2>
          <div className="space-y-3">
            {statuses.map((s) => {
              const n = stats?.byStatus?.[s] || 0;
              const max = Math.max(1, ...(statuses.map((k) => stats?.byStatus?.[k] || 0)));
              return (
                <div key={s}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="uppercase tracking-[0.16em] text-zinc-400">{s}</span>
                    <span className="font-mono text-zinc-300">{n}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                      style={{ width: `${(n / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#10131a] p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display font-bold flex items-center gap-2"><Radio size={16} className="text-teal-300" /> Event bus</h2>
          <Link to="/app/events" className="text-xs text-amber-300">Open stream</Link>
        </div>
        {(stats?.recentEvents || []).map((ev) => (
          <EventRow key={ev.id} event={ev} />
        ))}
        {!stats?.recentEvents?.length && <p className="text-sm text-zinc-500 py-8 text-center">Bus is quiet.</p>}
      </div>
    </div>
  );
}
