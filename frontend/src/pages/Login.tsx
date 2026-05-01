import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ArrowRight } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data.data;
      setAuth(user, accessToken);
      qc.setQueryData(['me'], user);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Left Side: Visuals */}
      <div className="auth-visual-side">
        <div style={{ position: 'absolute', top: '40px', left: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--brand-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>FlowDesk</span>
        </div>

        {/* Glowing Crystal Asset (SVG) */}
        <div style={{ position: 'relative', width: '300px', height: '400px', filter: 'drop-shadow(0 0 30px rgba(68, 226, 215, 0.4))' }}>
          <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#44e2d7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <path d="M100 20 L160 70 L160 130 L100 180 L40 130 L40 70 Z" fill="url(#crystalGrad)" />
            <path d="M100 20 L100 180 M40 70 L160 70 M40 130 L160 130" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          </svg>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="auth-form-side">
        <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '48px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Welcome back</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px' }}>Log in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Email Address</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Password</label>
                <Link to="#" style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Forgot?</Link>
              </div>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: '13px', padding: '10px 12px', backgroundColor: 'rgba(255,180,171,0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,180,171,0.2)' }}>{error}</div>}

            <Button type="submit" fullWidth disabled={isLoading} style={{ marginTop: '8px', height: '44px', fontWeight: 600 }}>
              {isLoading ? 'Signing in...' : 'Continue'}
              {!isLoading && <ArrowRight size={16} style={{ marginLeft: '8px' }} />}
            </Button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
