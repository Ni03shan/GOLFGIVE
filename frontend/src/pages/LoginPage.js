import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.firstName}! 👋`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      // Show the REAL error — not a generic fallback
      const msg =
        err.response?.data?.message ||   // server returned a message (wrong password, etc.)
        err.response?.data?.errors?.[0]?.msg || // validation errors
        err.message ||                    // network error (our custom message from api.js)
        'Login failed. Please try again.';

      // Also log the full error for debugging
      console.error('[Login] Error status:', err.response?.status);
      console.error('[Login] Error data:', err.response?.data);
      console.error('[Login] Full error:', err.message);

      toast.error(msg, { autoClose: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: '' }));
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>
      <div className="auth-card animate-fade-up">
        <div className="auth-logo">⛳ <span>GolfGive</span></div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your account to continue</p>

        {/* Backend URL debug indicator — remove after fixing */}
        <div style={{
          fontSize: '0.7rem', color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
          borderRadius: '6px', padding: '6px 10px', marginBottom: '16px',
          wordBreak: 'break-all'
        }}>
          API: {process.env.REACT_APP_API_URL || '(using /api proxy — local dev)'}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email" className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com" value={form.email} onChange={set('email')}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password" className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••" value={form.password} onChange={set('password')}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading
              ? <><span className="spinner" style={{width:18,height:18,borderWidth:2}}/>Signing in… (may take 30s if server is waking)</>
              : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>
        <div className="auth-demo">
          <p className="text-muted" style={{fontSize:'0.82rem',marginBottom:'10px'}}>Demo credentials (run seed script first):</p>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            <button className="btn btn-ghost btn-sm" onClick={() => setForm({email:'player@demo.com',password:'demo1234'})}>
              👤 Player Demo
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setForm({email:'admin@golfgive.com',password:'admin1234'})}>
              🔧 Admin Demo
            </button>
          </div>
        </div>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
