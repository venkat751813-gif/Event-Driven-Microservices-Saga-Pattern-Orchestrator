const styles: Record<string, string> = {
  healthy: 'bg-teal-400/10 text-teal-300 border-teal-400/30',
  degraded: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  down: 'bg-rose-400/10 text-rose-300 border-rose-400/30',
  draft: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/25',
  published: 'bg-teal-400/10 text-teal-300 border-teal-400/30',
  archived: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  pending: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/25',
  running: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  compensating: 'bg-orange-400/10 text-orange-300 border-orange-400/30',
  completed: 'bg-teal-400/10 text-teal-300 border-teal-400/30',
  failed: 'bg-rose-400/10 text-rose-300 border-rose-400/30',
  compensated: 'bg-violet-400/10 text-violet-300 border-violet-400/30',
  orchestrated: 'bg-amber-400/10 text-amber-200 border-amber-400/25',
  choreographed: 'bg-sky-400/10 text-sky-300 border-sky-400/30',
  success: 'bg-teal-400/10 text-teal-300 border-teal-400/30',
  failure: 'bg-rose-400/10 text-rose-300 border-rose-400/30',
  emit: 'bg-sky-400/10 text-sky-300 border-sky-400/30',
  consume: 'bg-teal-400/10 text-teal-300 border-teal-400/30',
  compensate: 'bg-orange-400/10 text-orange-300 border-orange-400/30',
};

export default function StatusBadge({ value }: { value: string }) {
  const cls = styles[value] || 'bg-zinc-400/10 text-zinc-300 border-zinc-400/25';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-[0.16em] font-medium ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {value}
    </span>
  );
}
