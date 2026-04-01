import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function CharityDetailPage() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const [charity, setCharity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/charities/${id}`).then(r => setCharity(r.data.charity)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleSelect = async () => {
    if (!user) { toast.error('Please log in first.'); return; }
    try {
      await api.put('/users/charity', { charityId: id });
      await refreshUser();
      toast.success(`You're now supporting ${charity.name}! 💚`);
    } catch { toast.error('Failed to select charity.'); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!charity) return <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}><h2>Charity not found.</h2><Link to="/charities" className="btn btn-secondary" style={{ marginTop: '20px' }}>← All Charities</Link></div>;

  const isSelected = user?.charity?.selected?._id === id || user?.charity?.selected === id;

  return (
    <div style={{ paddingTop: '72px', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '48px 0' }}>
        <div className="container">
          <Link to="/charities" className="btn btn-ghost btn-sm" style={{ marginBottom: '24px' }}>← Back to Charities</Link>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '32px', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <span className="badge badge-green">{charity.category}</span>
                {charity.isFeatured && <span className="badge badge-gold">Featured</span>}
              </div>
              <h1 className="display-md">{charity.name}</h1>
              {charity.shortDescription && <p className="text-secondary" style={{ marginTop: '12px', fontSize: '1.05rem' }}>{charity.shortDescription}</p>}
              <div style={{ display: 'flex', gap: '14px', marginTop: '24px', flexWrap: 'wrap' }}>
                {isSelected ? (
                  <span className="badge badge-green" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>✓ You're supporting this charity</span>
                ) : (
                  <button className="btn btn-primary" onClick={handleSelect}>
                    {user ? '💚 Support This Charity' : 'Sign in to Support'}
                  </button>
                )}
                {charity.website && (
                  <a href={charity.website} target="_blank" rel="noreferrer" className="btn btn-ghost">Visit Website ↗</a>
                )}
              </div>
            </div>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', overflow: 'hidden', flexShrink: 0 }}>
              {charity.logo ? <img src={charity.logo} alt={charity.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🌿'}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container" style={{ paddingTop: '48px', paddingBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>About {charity.name}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{charity.description}</p>

            {/* Events */}
            {charity.events?.length > 0 && (
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '20px' }}>📅 Upcoming Events</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {charity.events.map((ev, i) => (
                    <div key={i} className="card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <h4 style={{ fontFamily: 'var(--font-display)' }}>{ev.title}</h4>
                          {ev.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>{ev.description}</p>}
                          {ev.location && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>📍 {ev.location}</p>}
                        </div>
                        {ev.date && <span className="badge badge-blue">{format(new Date(ev.date), 'dd MMM yyyy')}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Impact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Supporters</span>
                  <span style={{ fontWeight: 700 }}>{charity.subscriberCount || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Total Received</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>£{(charity.totalReceived || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Events</span>
                  <span style={{ fontWeight: 700 }}>{charity.events?.length || 0}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>Support This Charity</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.65, marginBottom: '16px' }}>
                Subscribe to GolfGive and direct at least 10% of your subscription to {charity.name}.
              </p>
              {user ? (
                isSelected ? (
                  <p style={{ color: 'var(--accent-green)', fontSize: '0.88rem', fontWeight: 600 }}>✓ You're supporting this charity</p>
                ) : (
                  <button className="btn btn-primary btn-full" onClick={handleSelect}>Support This Charity</button>
                )
              ) : (
                <Link to="/register" className="btn btn-primary btn-full">Sign Up to Support</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
