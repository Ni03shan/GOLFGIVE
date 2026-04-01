import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './AuthPages.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', charityId: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get('/charities').then(r => setCharities(r.data.charities || [])).catch(() => {});
  }, []);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: '' }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.email) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleNext = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const user = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        charityId: form.charityId || null
      });
      toast.success(`Welcome to GolfGive, ${user.firstName}! 🎉`);
      navigate('/subscribe');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>
      <div className="auth-card auth-card-wide animate-fade-up">
        <div className="auth-logo">⛳ <span>GolfGive</span></div>

        {/* Progress */}
        <div className="reg-steps">
          <div className={`reg-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
            <div className="reg-step-dot">{step > 1 ? '✓' : '1'}</div>
            <span>Your Details</span>
          </div>
          <div className="reg-step-line" />
          <div className={`reg-step ${step >= 2 ? 'active' : ''}`}>
            <div className="reg-step-dot">2</div>
            <span>Choose Charity</span>
          </div>
        </div>

        {step === 1 && (
          <>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-sub">Join thousands of golfers making an impact</p>
            <div className="auth-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="John" value={form.firstName} onChange={set('firstName')} />
                  {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className={`form-input ${errors.lastName ? 'input-error' : ''}`}
                    placeholder="Doe" value={form.lastName} onChange={set('lastName')} />
                  {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className={`form-input ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com" value={form.email} onChange={set('email')} />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className={`form-input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Min. 6 characters" value={form.password} onChange={set('password')} />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} />
                {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
              </div>
              <button type="button" className="btn btn-primary btn-full btn-lg" onClick={handleNext}>
                Continue →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="auth-title">Choose your charity</h1>
            <p className="auth-sub">At least 10% of your subscription will go to your chosen cause. You can change this anytime.</p>
            <div className="charity-select-grid">
              {charities.slice(0, 6).map(c => (
                <button
                  key={c._id}
                  type="button"
                  className={`charity-select-btn ${form.charityId === c._id ? 'selected' : ''}`}
                  onClick={() => setForm(f => ({ ...f, charityId: c._id }))}
                >
                  <span className="charity-select-icon">{c.logo ? '🏥' : '🌿'}</span>
                  <span className="charity-select-name">{c.name}</span>
                  <span className="charity-select-cat">{c.category}</span>
                  {form.charityId === c._id && <span className="charity-select-check">✓</span>}
                </button>
              ))}
            </div>
            {charities.length === 0 && (
              <p className="text-muted" style={{textAlign:'center',padding:'20px'}}>Loading charities… you can also choose later in your dashboard.</p>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button type="button" className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating account…' : form.charityId ? 'Create Account & Subscribe' : 'Skip & Create Account'}
              </button>
            </div>
          </>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
