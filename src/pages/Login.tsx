import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { useAuth } from '../contexts/AuthContext.tsx';

export default function Login() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('demo@sagaforge.dev');
  const [password, setPassword] = useState('sagaforge123');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/app" replace />;

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (isSignUp) {
        const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-zinc-100 flex items-center justify-center px-4 relative overflow-hidden">
      <img src="/images/hero.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-[#07080b]/80" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#10131a]/90 backdrop-blur-xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <Link to="/" className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-300 to-orange-600 flex items-center justify-center">
            <Activity size={18} className="text-[#1a1003]" />
          </div>
          <div>
            <p className="font-display font-extrabold tracking-[0.2em] text-sm">SAGAFORGE</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Sign in to the forge</p>
          </div>
        </Link>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-amber-400/50"
              placeholder="you@company.dev"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-amber-400/50"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-xl px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-amber-400 text-[#1a1003] font-semibold text-sm disabled:opacity-60"
          >
            {busy ? 'Working…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-zinc-600 text-xs">
          <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={() => signInWithGoogle('SagaForge')}
          className="w-full py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm hover:bg-white/10"
        >
          Sign in with Google
        </button>

        <button
          type="button"
          onClick={() => { setIsSignUp((v) => !v); setError(''); }}
          className="mt-5 w-full text-xs text-zinc-500 hover:text-zinc-300"
        >
          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Create one'}
        </button>

        <p className="mt-6 text-[11px] text-zinc-600 leading-relaxed">
          Demo desk: <span className="text-zinc-400">demo@sagaforge.dev</span> / <span className="text-zinc-400">sagaforge123</span>
        </p>
      </div>
    </div>
  );
}
