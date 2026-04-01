import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './CharitiesPage.css';

const CATEGORIES = ['all', 'health', 'education', 'environment', 'sports', 'community', 'other'];

export default function CharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    api.get(`/charities?${params}`).then(r => setCharities(r.data.charities || [])).catch(() => setCharities([])).finally(() => setLoading(false));
  }, [category, search]);

  const featured = charities.filter(c => c.isFeatured);
  const rest = charities.filter(c => !c.isFeatured);

  return (
    <div className="charities-page">
      <div className="charities-header">
        <div className="container">
          <div className="section-tag" style={{ display: 'inline-flex' }}>Our Charities</div>
          <h1 className="display-lg" style={{ marginTop: '16px' }}>
            Causes that <span className="text-accent">matter</span>
          </h1>
          <p className="text-secondary" style={{ marginTop: '12px', maxWidth: '500px' }}>
            Every GolfGive subscriber supports a charity. Browse our vetted partners and choose the cause closest to your heart.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        {/* Filters */}
        <div className="charities-filters">
          <input
            type="text" className="form-input" placeholder="🔍 Search charities…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '340px' }}
          />
          <div className="category-tabs">
            {CATEGORIES.map(cat => (
              <button key={cat} className={`cat-tab ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>⭐ Featured Charities</h2>
            </div>
            <div className="charities-featured-grid">
              {featured.map(c => <CharityCard key={c._id} charity={c} featured />)}
            </div>
          </div>
        )}

        {/* All */}
        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : rest.length === 0 && featured.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌿</div>
            <h3>No charities found</h3>
            <p>Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="charities-grid">
            {rest.map(c => <CharityCard key={c._id} charity={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function CharityCard({ charity, featured }) {
  return (
    <Link to={`/charities/${charity._id}`} className={`charity-card-link card card-hover ${featured ? 'charity-card-feat' : ''}`}>
      <div className="charity-card-img">
        {charity.logo ? <img src={charity.logo} alt={charity.name} /> : <span>🌿</span>}
      </div>
      <div className="charity-card-body">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span className="badge badge-green">{charity.category}</span>
          {charity.isFeatured && <span className="badge badge-gold">Featured</span>}
        </div>
        <h3>{charity.name}</h3>
        <p>{charity.shortDescription || charity.description?.substring(0, 120)}…</p>
        <div className="charity-card-stats">
          <span>👥 {charity.subscriberCount || 0} supporters</span>
          {charity.events?.length > 0 && <span>📅 {charity.events.length} upcoming events</span>}
        </div>
      </div>
    </Link>
  );
}
