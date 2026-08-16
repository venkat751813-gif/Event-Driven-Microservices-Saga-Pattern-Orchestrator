import type { SagaStep, Service } from '../lib/types';

interface Props {
  steps: SagaStep[];
  services?: Service[];
  currentStep?: number;
  status?: string;
  selectedId?: number | null;
  onSelect?: (step: SagaStep) => void;
}

function nodeState(step: SagaStep, currentStep?: number, status?: string) {
  if (!status || currentStep === undefined) return 'idle';
  if (status === 'completed') return 'done';
  if (status === 'failed' && step.step_order === currentStep) return 'fail';
  if (status === 'compensated' || status === 'compensating') {
    if (step.step_order < currentStep) return 'rolled';
    if (step.step_order === currentStep) return 'fail';
    return 'idle';
  }
  if (step.step_order < currentStep) return 'done';
  if (step.step_order === currentStep) return 'active';
  return 'idle';
}

const ring: Record<string, string> = {
  idle: 'border-white/10 bg-[#12151c]',
  active: 'border-amber-400 bg-amber-400/10 shadow-[0_0_32px_rgba(232,163,23,0.25)]',
  done: 'border-teal-400/50 bg-teal-400/10',
  fail: 'border-rose-400 bg-rose-400/10',
  rolled: 'border-violet-400/50 bg-violet-400/10',
};

export default function SagaFlow({ steps, services = [], currentStep, status, selectedId, onSelect }: Props) {
  if (!steps.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center text-sm text-zinc-500">
        No steps yet. Add a participant to begin the choreography.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-stretch gap-0 min-w-max px-1">
        {steps.map((step, i) => {
          const svc = services.find((s) => s.id === step.service_id);
          const state = nodeState(step, currentStep, status);
          const selected = selectedId === step.id;
          return (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => onSelect?.(step)}
                className={`w-52 text-left rounded-2xl border p-4 transition ${ring[state]} ${selected ? 'ring-2 ring-amber-300/70' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-500">
                    {String(step.step_order).padStart(2, '0')}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: svc?.color || '#e8a317' }}
                  />
                </div>
                <p className="font-display font-semibold text-sm leading-tight mb-1">{step.name}</p>
                <p className="text-[11px] text-zinc-500 truncate">{svc?.name || 'Unassigned service'}</p>
                <p className="mt-3 font-mono text-[10px] text-amber-200/80 truncate">{step.action || 'command'}</p>
                <p className="mt-1 font-mono text-[10px] text-zinc-600 truncate">
                  ↩ {step.compensate_action || 'no compensate'}
                </p>
              </button>
              {i < steps.length - 1 && (
                <div className="w-10 flex flex-col items-center justify-center px-1">
                  <div className={`h-px w-full ${state === 'done' ? 'bg-teal-400/60' : 'bg-white/10'}`} />
                  <span className="text-[9px] text-zinc-600 mt-1 font-mono">evt</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
