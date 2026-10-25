import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EagleMark from '../components/EagleMark';

export default function Login() {
  const navigate = useNavigate();
  const { login, admin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (admin) navigate('/', { replace: true });
  }, [admin, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-lg bg-blue-600 items-center justify-center text-white mb-4">
            <EagleMark size={22} />
          </div>
          <h1 className="text-xl font-semibold text-slate-100">Sign in to EagleCourier</h1>
          <p className="text-sm text-slate-500 mt-1">Admin console access</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition" placeholder="you@eaglecourier.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition" placeholder="••••••••" />
          </div>
          {error && <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded-md px-3 py-2">{error}</div>}
          <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-md transition-colors">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-600 mt-6">© {new Date().getFullYear()} EagleCourier International</p>
      </div>
    </div>
  );
}