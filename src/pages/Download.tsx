import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download as DownloadIcon, FileCode, FileJson, FileText } from 'lucide-react';
import { apiFetch, downloadText } from '../lib/api';
import type { Saga } from '../lib/types';

interface Artifact {
  filename: string;
  mime: string;
  content: string;
}

const formats = [
  { id: 'json', label: 'Saga JSON', icon: FileJson, hint: 'Canonical definition' },
  { id: 'yaml', label: 'YAML spec', icon: FileText, hint: 'GitOps-friendly' },
  { id: 'java', label: 'Spring Boot Java', icon: FileCode, hint: 'Eventuate-style orchestrator' },
  { id: 'typescript', label: 'TypeScript', icon: FileCode, hint: 'Runnable saga class' },
  { id: 'mermaid', label: 'Mermaid diagram', icon: FileText, hint: 'Sequence + flowchart' },
];

export default function Download() {
  const { sagaId } = useParams();
  const [sagas, setSagas] = useState<Saga[]>([]);
  const [selected, setSelected] = useState(sagaId || '');
  const [preview, setPreview] = useState<Artifact | null>(null);
  const [fmt, setFmt] = useState('json');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<Saga[]>('/api/sagas')
      .then((rows) => {
        setSagas(rows);
        setSelected((cur) => cur || (sagaId || (rows[0] ? String(rows[0].id) : '')));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sagaId]);

  useEffect(() => {
    if (!selected) return;
    setBusy(true);
    apiFetch<Artifact>(`/api/export?saga_id=${selected}&format=${fmt}`)
      .then(setPreview)
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  }, [selected, fmt]);

  const pull = async (format: string) => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const art = await apiFetch<Artifact>(`/api/export?saga_id=${selected}&format=${format}`);
      downloadText(art.filename, art.content, art.mime);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const pullAll = async () => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const pack = await apiFetch<{ artifacts: Record<string, Artifact> }>(`/api/export?saga_id=${selected}&format=all`);
      for (const art of Object.values(pack.artifacts || {})) {
        downloadText(art.filename, art.content, art.mime);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Pack failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" /></div>;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Artifacts</p>
          <h1 className="font-display font-extrabold text-3xl mt-1">Download pack</h1>
          <p className="text-sm text-zinc-500 mt-1">Export a saga as code you can drop into a service repo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="rounded-xl bg-[#10131a] border border-white/10 px-3 py-2 text-sm min-w-48">
            {!sagas.length && <option value="">No sagas</option>}
            {sagas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={pullAll} disabled={!selected || busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-[#1a1003] text-sm font-semibold disabled:opacity-50">
            <DownloadIcon size={14} /> Download all
          </button>
        </div>
      </div>

      {error && <p className="text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-3 text-sm">{error}</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {formats.map((f) => {
          const Icon = f.icon;
          const active = fmt === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFmt(f.id)}
              className={`text-left rounded-2xl border p-4 transition ${
                active ? 'border-amber-400/50 bg-amber-400/10' : 'border-white/8 bg-[#10131a] hover:border-white/20'
              }`}
            >
              <Icon size={18} className="text-amber-300 mb-3" />
              <p className="font-display font-bold text-sm">{f.label}</p>
              <p className="text-[11px] text-zinc-500 mt-1">{f.hint}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#10131a] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <p className="font-mono text-xs text-zinc-400">{preview?.filename || 'preview'}</p>
          <button onClick={() => pull(fmt)} disabled={!preview || busy} className="inline-flex items-center gap-1 text-xs text-amber-300 disabled:opacity-40">
            <DownloadIcon size={12} /> Save file
          </button>
        </div>
        <pre className="p-5 text-[11px] leading-relaxed font-mono text-zinc-300 overflow-auto max-h-[520px]">
          {busy && !preview ? 'Generating…' : preview?.content || 'Select a saga to preview.'}
        </pre>
      </div>
    </div>
  );
}
