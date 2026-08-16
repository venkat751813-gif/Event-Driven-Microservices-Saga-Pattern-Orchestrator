import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, ArrowRight, Download, GitBranch, Radio,
  Shield, Workflow, Zap,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { Stats } from '../lib/types';
import { useAuth } from '../contexts/AuthContext.tsx';

export default function Landing() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiFetch<Stats>('/api/stats').then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <div className="min-h-screen bg-[#07080b] text-zinc-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="/images/hero.png"
          alt=""
          className="absolute inset-0 w-full h-[92vh] object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07080b]/30 via-[#07080b]/75 to-[#07080b]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,163,23,0.12),transparent_55%)]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-300 to-orange-600 flex items-center justify-center shadow-[0_0_24px_rgba(232,163,23,0.4)]">
            <Activity size={18} className="text-[#1a1003]" />
          </div>
          <div>
            <p className="font-display font-extrabold tracking-[0.2em] text-sm">SAGAFORGE</p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">Event Saga Orchestrator</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/app/guide" className="hidden sm:inline text-xs uppercase tracking-[0.18em] text-zinc-400 hover:text-white">Guide</Link>
          <Link
            to={user ? '/app' : '/login'}
            className="px-4 py-2 rounded-full bg-amber-400 text-[#1a1003] text-xs font-semibold tracking-[0.14em] uppercase hover:bg-amber-300"
          >
            {user ? 'Open Forge' : 'Enter Forge'}
          </Link>
        </div>
      </header>

      <section className="relative z-10 px-6 md:px-10 pt-16 md:pt-24 pb-20 max-w-6xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] uppercase tracking-[0.35em] text-amber-300/80 mb-5"
        >
          Distributed transactions · Compensating actions · Event bus
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display font-extrabold text-5xl md:text-7xl leading-[0.95] max-w-4xl"
        >
          Orchestrate sagas.<br />
          <span className="text-amber-300">Download the code.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-6 max-w-xl text-zinc-400 text-lg leading-relaxed"
        >
          Design event-driven microservice workflows, run them against a live orchestrator,
          watch compensating transactions fire, then export Java, TypeScript, YAML, or Mermaid.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <Link
            to={user ? '/app' : '/login'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-400 text-[#1a1003] font-semibold hover:bg-amber-300"
          >
            Launch orchestrator <ArrowRight size={16} />
          </Link>
          <Link
            to={user ? '/app/download' : '/login'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 text-zinc-200 hover:bg-white/5"
          >
            <Download size={16} /> Download pack
          </Link>
        </motion.div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
          {[
            [stats?.sagas ?? '—', 'Sagas'],
            [stats?.services ?? '—', 'Services'],
            [stats?.executions ?? '—', 'Executions'],
            [stats?.publishedSagas ?? '—', 'Published'],
          ].map(([n, l]) => (
            <div key={String(l)} className="rounded-2xl border border-white/8 bg-white/3 px-4 py-4 backdrop-blur">
              <p className="font-display text-3xl font-bold text-amber-200">{n}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 md:px-10 pb-24 max-w-6xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 mb-8">How the forge works</p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Workflow, title: 'Design the saga', body: 'Compose orchestrated or choreographed steps. Bind each participant, command, success/failure event, timeout, and compensating action.' },
            { icon: Zap, title: 'Run the transaction', body: 'Start an execution. Step through success or failure. The orchestrator emits events and automatically rolls back completed work.' },
            { icon: Download, title: 'Export & ship', body: 'Download JSON, YAML, Spring Boot Java, Node/TypeScript, or a Mermaid sequence diagram. Drop it into your repo.' },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/8 bg-[#10131a] p-6">
              <c.icon className="text-amber-300 mb-4" size={22} />
              <h3 className="font-display font-bold text-lg mb-2">{c.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-4">
          {[
            { icon: Radio, title: 'Event bus log', body: 'Every command, domain event, and compensate action is persisted. Replay the timeline of any correlation id.' },
            { icon: GitBranch, title: 'Compensation graph', body: 'Failure does not leave partial writes. Prior steps invert in reverse order until the saga is compensated.' },
            { icon: Shield, title: 'Service registry', body: 'Register the bounded contexts that participate. Health, owners, and endpoints travel with every export.' },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/8 bg-[#10131a] p-6">
              <c.icon className="text-teal-300 mb-4" size={22} />
              <h3 className="font-display font-bold text-lg mb-2">{c.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 px-6 md:px-10 py-8 border-t border-white/5 text-[11px] uppercase tracking-[0.2em] text-zinc-600 flex flex-wrap justify-between gap-3">
        <span>SagaForge · Event-driven saga pattern orchestrator</span>
        <span>Orchestration · Choreography · Compensation</span>
      </footer>
    </div>
  );
}
