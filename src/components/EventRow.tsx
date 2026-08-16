import type { BusEvent } from '../lib/types';
import StatusBadge from './StatusBadge';

export default function EventRow({ event }: { event: BusEvent }) {
  const ts = event.created_at ? new Date(event.created_at).toLocaleTimeString() : '';
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-start py-3 border-b border-white/5">
      <div className="font-mono text-[10px] text-zinc-500 pt-0.5 w-16">{ts}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-mono text-xs text-amber-200/90">{event.event_name}</span>
          <StatusBadge value={event.direction} />
          <StatusBadge value={event.status} />
        </div>
        <p className="text-xs text-zinc-400 truncate">{event.message}</p>
        <p className="font-mono text-[10px] text-zinc-600 mt-1">{event.event_type}</p>
      </div>
      <div className="font-mono text-[10px] text-zinc-500">{event.duration_ms}ms</div>
    </div>
  );
}
