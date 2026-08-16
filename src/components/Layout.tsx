import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity, Boxes, Download, GitBranch, LayoutDashboard,
  LogOut, Radio, BookOpen, Workflow, Menu, X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext.tsx';

const links = [
  { to: '/app', label: 'Control Room', icon: LayoutDashboard, end: true },
  { to: '/app/sagas', label: 'Sagas', icon: Workflow },
  { to: '/app/services', label: 'Services', icon: Boxes },
  { to: '/app/executions', label: 'Executions', icon: GitBranch },
  { to: '/app/events', label: 'Event Bus', icon: Radio },
  { to: '/app/download', label: 'Download Pack', icon: Download },
  { to: '/app/guide', label: 'Saga Guide', icon: BookOpen },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const nav = (
    <nav className="flex flex-col gap-1 px-3">
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                isActive
                  ? 'bg-amber-400/10 text-amber-200 border border-amber-400/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <Icon size={16} />
            {l.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#07080b] text-zinc-100 flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0b0d12]">
        <div className="px-5 py-6 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-300 to-orange-600 flex items-center justify-center shadow-[0_0_24px_rgba(232,163,23,0.35)]">
            <Activity size={18} className="text-[#1a1003]" />
          </div>
          <div>
            <p className="font-display font-extrabold tracking-[0.18em] text-sm">SAGAFORGE</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Saga Orchestrator</p>
          </div>
        </div>
        {nav}
        <div className="mt-auto p-4 border-t border-white/5">
          <p className="text-[11px] text-zinc-500 truncate px-2 mb-3">{user?.email}</p>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0b0d12]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-300 to-orange-600 flex items-center justify-center">
              <Activity size={16} className="text-[#1a1003]" />
            </div>
            <span className="font-display font-extrabold tracking-[0.16em] text-sm">SAGAFORGE</span>
          </div>
          <button onClick={() => setOpen((v) => !v)} className="p-2 text-zinc-300">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>
        {open && (
          <div className="lg:hidden border-b border-white/5 bg-[#0b0d12] py-3">
            {nav}
            <div className="px-6 pt-3">
              <button onClick={signOut} className="text-sm text-zinc-400">Sign out</button>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
