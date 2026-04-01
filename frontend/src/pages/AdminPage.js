import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import api from '../utils/api';
import './AdminPage.css';

const TABS = ['Overview', 'Users', 'Draw Engine', 'Charities', 'Winners', 'Reports'];

export default function AdminPage() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [winners, setWinners] = useState([]);
  const [charities, setCharities] = useState([]);
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  // Draw engine state
  const [drawConfig, setDrawConfig] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), drawType: 'random' });
  const [simulationResult, setSimulationResult] = useState(null);
  const [drawLoading, setDrawLoading] = useState(false);

  // Charity form
  const [showCharityForm, setShowCharityForm] = useState(false);
  const [charityForm, setCharityForm] = useState({ name: '', description: '', shortDescription: '', category: 'other', website: '', isFeatured: false });

  const loadStats = useCallback(async () => {
    try { const r = await api.get('/admin/stats'); setStats(r.data.stats); } catch {}
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set('search', userSearch);
      if (userStatusFilter) params.set('status', userStatusFilter);
      const r = await api.get(`/admin/users?${params}&limit=30`);
      setUsers(r.data.users || []);
    } catch {}
  }, [userSearch, userStatusFilter]);

  const loadWinners = useCallback(async () => {
    try { const r = await api.get('/admin/winners?status=submitted'); setWinners(r.data.winners || []); } catch {}
  }, []);

  const loadCharities = useCallback(async () => {
    try { const r = await api.get('/charities'); setCharities(r.data.charities || []); } catch {}
  }, []);

  const loadDraws = useCallback(async () => {
    try { const r = await api.get('/draws'); setDraws(r.data.draws || []); } catch {}
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (tab === 'Users') loadUsers(); }, [tab, loadUsers]);
  useEffect(() => { if (tab === 'Winners') loadWinners(); }, [tab, loadWinners]);
  useEffect(() => { if (tab === 'Charities') loadCharities(); }, [tab, loadCharities]);
  useEffect(() => { if (tab === 'Draw Engine') loadDraws(); }, [tab, loadDraws]);

  useEffect(() => {
    if (tab === 'Users') {
      const t = setTimeout(loadUsers, 350);
      return () => clearTimeout(t);
    }
  }, [userSearch, userStatusFilter, loadUsers, tab]);

  // Draw actions
  const handleSimulate = async () => {
    setDrawLoading(true);
    try {
      const r = await api.post('/draws/simulate', drawConfig);
      setSimulationResult(r.data);
      toast.success('Simulation complete! Review before publishing.');
    } catch (err) { toast.error(err.response?.data?.message || 'Simulation failed.'); }
    finally { setDrawLoading(false); }
  };

  const handlePublish = async () => {
    if (!window.confirm(`Publish the ${drawConfig.month}/${drawConfig.year} draw? This cannot be undone.`)) return;
    setDrawLoading(true);
    try {
      const r = await api.post('/draws/publish', { month: drawConfig.month, year: drawConfig.year });
      toast.success(`Draw published! ${r.data.winnersCount} winner(s) found.`);
      setSimulationResult(null);
      loadStats();
      loadDraws();
    } catch (err) { toast.error(err.response?.data?.message || 'Publish failed.'); }
    finally { setDrawLoading(false); }
  };

  // Winner actions
  const handleVerify = async (drawId, winnerId, action) => {
    try {
      await api.put(`/admin/winners/${drawId}/${winnerId}/verify`, { action });
      toast.success(`Winner ${action}d.`);
      loadWinners();
    } catch { toast.error('Action failed.'); }
  };

  const handleMarkPaid = async (drawId, winnerId) => {
    try {
      await api.put(`/admin/winners/${drawId}/${winnerId}/pay`);
      toast.success('Marked as paid!');
      loadWinners();
      loadStats();
    } catch { toast.error('Failed to mark as paid.'); }
  };

  const handleCreateCharity = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/charities', charityForm);
      toast.success('Charity created!');
      setShowCharityForm(false);
      setCharityForm({ name: '', description: '', shortDescription: '', category: 'other', website: '', isFeatured: false });
      loadCharities();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create charity.'); }
    finally { setLoading(false); }
  };

  const handleDeleteCharity = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try { await api.delete(`/charities/${id}`); toast.success('Charity deactivated.'); loadCharities(); }
    catch { toast.error('Failed to deactivate.'); }
  };

  const handleToggleFeatured = async (c) => {
    try { await api.put(`/charities/${c._id}`, { isFeatured: !c.isFeatured }); loadCharities(); }
    catch { toast.error('Failed to update.'); }
  };

  const handleUpdateSubscription = async (userId, status) => {
    try {
      await api.put(`/admin/users/${userId}`, { 'subscription.status': status });
      toast.success('Subscription updated.');
      loadUsers();
    } catch { toast.error('Failed to update.'); }
  };

  const monthName = (m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="container">
          <div className="admin-title-row">
            <div>
              <div className="section-tag" style={{ display: 'inline-flex', marginBottom: '8px' }}>Admin Panel</div>
              <h1 className="display-md">GolfGive <span className="text-accent">Control Centre</span></h1>
            </div>
            <div className="admin-header-stats">
              {stats && (
                <>
                  <div className="admin-quick-stat">
                    <span className="admin-quick-val">{stats.activeSubscribers}</span>
                    <span className="admin-quick-label">Active</span>
                  </div>
                  <div className="admin-quick-stat">
                    <span className="admin-quick-val text-gold">£{stats.totalPrizePool?.toFixed(0)}</span>
                    <span className="admin-quick-label">Prize Pool</span>
                  </div>
                  <div className="admin-quick-stat">
                    <span className="admin-quick-val" style={{ color: stats.pendingVerifications > 0 ? '#ef4444' : 'var(--text-primary)' }}>
                      {stats.pendingVerifications}
                    </span>
                    <span className="admin-quick-label">Pending</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container admin-body">
        <div className="admin-layout">
          {/* Sidebar nav */}
          <nav className="admin-nav">
            {TABS.map(t => (
              <button key={t} className={`admin-nav-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'Overview' && '📊 '}
                {t === 'Users' && '👥 '}
                {t === 'Draw Engine' && '🎯 '}
                {t === 'Charities' && '💚 '}
                {t === 'Winners' && '🏆 '}
                {t === 'Reports' && '📈 '}
                {t}
                {t === 'Winners' && stats?.pendingVerifications > 0 && (
                  <span className="nav-badge">{stats.pendingVerifications}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Main content */}
          <div className="admin-content">

            {/* OVERVIEW */}
            {tab === 'Overview' && (
              <div className="animate-fade-up">
                <h2 className="admin-section-title">Platform Overview</h2>
                {stats ? (
                  <div className="admin-stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon">👥</div>
                      <div className="stat-value">{stats.totalUsers}</div>
                      <div className="stat-label">Total Users</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">✅</div>
                      <div className="stat-value">{stats.activeSubscribers}</div>
                      <div className="stat-label">Active Subscribers</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">💰</div>
                      <div className="stat-value">£{stats.totalPrizePool?.toFixed(0)}</div>
                      <div className="stat-label">Latest Prize Pool</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">💚</div>
                      <div className="stat-value">{stats.totalCharities}</div>
                      <div className="stat-label">Active Charities</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">⏳</div>
                      <div className="stat-value" style={{ color: stats.pendingVerifications > 0 ? '#ef4444' : 'var(--text-primary)' }}>
                        {stats.pendingVerifications}
                      </div>
                      <div className="stat-label">Pending Verifications</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">📊</div>
                      <div className="stat-value">{stats.avgCharityContribution}%</div>
                      <div className="stat-label">Avg Charity %</div>
                    </div>
                  </div>
                ) : <div className="page-loading" style={{ minHeight: '200px' }}><div className="spinner" /></div>}

                {stats?.pendingVerifications > 0 && (
                  <div className="alert alert-warning" style={{ marginTop: '24px' }}>
                    ⚠️ You have <strong>{stats.pendingVerifications}</strong> winner submission(s) awaiting review.
                    <button className="btn btn-gold btn-sm" style={{ marginLeft: '16px' }} onClick={() => setTab('Winners')}>Review Now</button>
                  </div>
                )}
              </div>
            )}

            {/* USERS */}
            {tab === 'Users' && (
              <div className="animate-fade-up">
                <h2 className="admin-section-title">User Management</h2>
                <div className="admin-filters">
                  <input type="text" className="form-input" placeholder="🔍 Search users…"
                    value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ maxWidth: '300px' }} />
                  <select className="form-select" value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value)} style={{ maxWidth: '180px' }}>
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="lapsed">Lapsed</option>
                  </select>
                </div>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Charity</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No users found</td></tr>
                      ) : users.map(u => (
                        <tr key={u._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="winner-avatar" style={{ flexShrink: 0 }}>
                                {u.firstName?.[0]}{u.lastName?.[0]}
                              </div>
                              <span style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                          <td style={{ textTransform: 'capitalize' }}>{u.subscription?.plan || '—'}</td>
                          <td>
                            <span className={`badge ${
                              u.subscription?.status === 'active' ? 'badge-green' :
                              u.subscription?.status === 'cancelled' ? 'badge-red' :
                              u.subscription?.status === 'lapsed' ? 'badge-gold' : 'badge-gray'
                            }`}>{u.subscription?.status || 'inactive'}</span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {u.charity?.selected?.name || '—'}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {format(new Date(u.createdAt), 'dd MMM yy')}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {u.subscription?.status !== 'active' && (
                                <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateSubscription(u._id, 'active')}>Activate</button>
                              )}
                              {u.subscription?.status === 'active' && (
                                <button className="btn btn-danger btn-sm" onClick={() => handleUpdateSubscription(u._id, 'cancelled')}>Cancel</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DRAW ENGINE */}
            {tab === 'Draw Engine' && (
              <div className="animate-fade-up">
                <h2 className="admin-section-title">Draw Engine</h2>

                <div className="draw-engine-grid">
                  <div className="card draw-config-card">
                    <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Configure Draw</h3>
                    <div className="form-group">
                      <label className="form-label">Month</label>
                      <select className="form-select" value={drawConfig.month} onChange={e => setDrawConfig(d => ({ ...d, month: parseInt(e.target.value) }))}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>{monthName(m)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginTop: '12px' }}>
                      <label className="form-label">Year</label>
                      <input type="number" className="form-input" value={drawConfig.year}
                        onChange={e => setDrawConfig(d => ({ ...d, year: parseInt(e.target.value) }))} min="2024" max="2030" />
                    </div>
                    <div className="form-group" style={{ marginTop: '12px' }}>
                      <label className="form-label">Draw Type</label>
                      <select className="form-select" value={drawConfig.drawType} onChange={e => setDrawConfig(d => ({ ...d, drawType: e.target.value }))}>
                        <option value="random">Random (Lottery Style)</option>
                        <option value="algorithmic">Algorithmic (Score-Weighted)</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                      <button className="btn btn-secondary" onClick={handleSimulate} disabled={drawLoading}>
                        {drawLoading ? '⏳ Running…' : '▶ Run Simulation'}
                      </button>
                      {simulationResult && (
                        <button className="btn btn-primary" onClick={handlePublish} disabled={drawLoading}>
                          📢 Publish Draw
                        </button>
                      )}
                    </div>
                  </div>

                  {simulationResult && (
                    <div className="card draw-sim-card">
                      <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
                        Simulation Results
                        <span className="badge badge-gold" style={{ marginLeft: '12px' }}>Preview</span>
                      </h3>
                      <div className="sim-numbers">
                        {simulationResult.draw.drawnNumbers.map(n => (
                          <div key={n} className="score-ball lg">{n}</div>
                        ))}
                      </div>
                      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="sim-stat">
                          <span>🥇 5-Match Winners</span>
                          <strong>{simulationResult.matchSummary.fiveMatch}</strong>
                        </div>
                        <div className="sim-stat">
                          <span>🥈 4-Match Winners</span>
                          <strong>{simulationResult.matchSummary.fourMatch}</strong>
                        </div>
                        <div className="sim-stat">
                          <span>🥉 3-Match Winners</span>
                          <strong>{simulationResult.matchSummary.threeMatch}</strong>
                        </div>
                        <div className="sim-stat">
                          <span>👥 Total Subscribers</span>
                          <strong>{simulationResult.draw.totalSubscribers}</strong>
                        </div>
                        <div className="sim-stat">
                          <span>💰 Prize Pool</span>
                          <strong style={{ color: 'var(--accent-gold)' }}>£{simulationResult.draw.totalPrizePool?.toFixed(2)}</strong>
                        </div>
                        <div className="sim-stat">
                          <span>🔄 Jackpot Rollover?</span>
                          <strong>{simulationResult.matchSummary.fiveMatch === 0 ? 'Yes' : 'No'}</strong>
                        </div>
                      </div>
                      <div className="alert alert-warning" style={{ marginTop: '16px', fontSize: '0.82rem' }}>
                        ⚠️ Publishing will lock this draw and notify all winners. This cannot be reversed.
                      </div>
                    </div>
                  )}
                </div>

                {/* Past draws */}
                {draws.length > 0 && (
                  <div style={{ marginTop: '32px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Past Draws</h3>
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr><th>Period</th><th>Drawn Numbers</th><th>Subscribers</th><th>Prize Pool</th><th>Winners</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {draws.map(d => (
                            <tr key={d._id}>
                              <td style={{ fontWeight: 600 }}>{monthName(d.month)} {d.year}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {d.drawnNumbers.map(n => <div key={n} className="score-ball" style={{ width: 28, height: 28, fontSize: '0.72rem' }}>{n}</div>)}
                                </div>
                              </td>
                              <td>{d.totalSubscribers}</td>
                              <td style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>£{d.totalPrizePool?.toFixed(2)}</td>
                              <td>{d.winners?.length || 0}</td>
                              <td><span className="badge badge-green">{d.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CHARITIES */}
            {tab === 'Charities' && (
              <div className="animate-fade-up">
                <div className="flex-between" style={{ marginBottom: '24px' }}>
                  <h2 className="admin-section-title" style={{ marginBottom: 0 }}>Charity Management</h2>
                  <button className="btn btn-primary" onClick={() => setShowCharityForm(!showCharityForm)}>
                    {showCharityForm ? '✕ Cancel' : '+ Add Charity'}
                  </button>
                </div>

                {showCharityForm && (
                  <div className="card" style={{ marginBottom: '28px', padding: '28px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '20px' }}>New Charity</h3>
                    <form onSubmit={handleCreateCharity}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">Charity Name *</label>
                          <input type="text" className="form-input" required value={charityForm.name}
                            onChange={e => setCharityForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Category</label>
                          <select className="form-select" value={charityForm.category}
                            onChange={e => setCharityForm(f => ({ ...f, category: e.target.value }))}>
                            {['health','education','environment','sports','community','other'].map(c => (
                              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                          <label className="form-label">Short Description</label>
                          <input type="text" className="form-input" placeholder="One-liner for cards"
                            value={charityForm.shortDescription}
                            onChange={e => setCharityForm(f => ({ ...f, shortDescription: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                          <label className="form-label">Full Description *</label>
                          <textarea className="form-textarea" required value={charityForm.description}
                            onChange={e => setCharityForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Website URL</label>
                          <input type="url" className="form-input" placeholder="https://…"
                            value={charityForm.website}
                            onChange={e => setCharityForm(f => ({ ...f, website: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ justifyContent: 'center' }}>
                          <label className="form-label">Featured?</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                            <input type="checkbox" checked={charityForm.isFeatured}
                              onChange={e => setCharityForm(f => ({ ...f, isFeatured: e.target.checked }))} />
                            <span style={{ fontSize: '0.9rem' }}>Show as featured charity</span>
                          </label>
                        </div>
                      </div>
                      <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                          {loading ? 'Creating…' : 'Create Charity'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setShowCharityForm(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr><th>Charity</th><th>Category</th><th>Supporters</th><th>Total Received</th><th>Featured</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {charities.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No charities yet. Add one above.</td></tr>
                      ) : charities.map(c => (
                        <tr key={c._id}>
                          <td>
                            <div>
                              <div style={{ fontWeight: 600 }}>{c.name}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.shortDescription?.substring(0, 50)}…</div>
                            </div>
                          </td>
                          <td><span className="badge badge-gray">{c.category}</span></td>
                          <td>{c.subscriberCount || 0}</td>
                          <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>£{(c.totalReceived || 0).toFixed(2)}</td>
                          <td>
                            <button className={`badge ${c.isFeatured ? 'badge-gold' : 'badge-gray'}`}
                              style={{ cursor: 'pointer', border: 'none', background: 'inherit' }}
                              onClick={() => handleToggleFeatured(c)}>
                              {c.isFeatured ? '⭐ Yes' : 'No'}
                            </button>
                          </td>
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCharity(c._id, c.name)}>
                              Deactivate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* WINNERS */}
            {tab === 'Winners' && (
              <div className="animate-fade-up">
                <h2 className="admin-section-title">Winner Verification</h2>
                {winners.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🏆</div>
                    <h3>No pending verifications</h3>
                    <p>When winners submit their proof screenshots, they'll appear here for review.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {winners.map((item, i) => (
                      <div key={i} className="card winner-verify-card">
                        <div className="winner-verify-header">
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                              {item.winner.user?.firstName} {item.winner.user?.lastName}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.winner.user?.email}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                              £{(item.winner.prizeAmount || 0).toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.winner.matchType}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
                          {item.winner.matchedNumbers?.map(n => <div key={n} className="score-ball matched" style={{ width: 36, height: 36 }}>{n}</div>)}
                        </div>
                        {item.winner.proofUrl && (
                          <div style={{ marginBottom: '12px' }}>
                            <span className="form-label">Proof Screenshot URL:</span>
                            <a href={item.winner.proofUrl} target="_blank" rel="noreferrer" className="proof-link">
                              {item.winner.proofUrl}
                            </a>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleVerify(item.drawId, item.winner._id, 'approve')}>
                            ✓ Approve & Notify
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleVerify(item.drawId, item.winner._id, 'reject')}>
                            ✕ Reject
                          </button>
                          {item.winner.verificationStatus === 'approved' && item.winner.paymentStatus !== 'paid' && (
                            <button className="btn btn-gold btn-sm" onClick={() => handleMarkPaid(item.drawId, item.winner._id)}>
                              💳 Mark as Paid
                            </button>
                          )}
                        </div>
                        <div style={{ marginTop: '8px' }}>
                          <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>Draw: {monthName(item.month)} {item.year}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REPORTS */}
            {tab === 'Reports' && (
              <div className="animate-fade-up">
                <h2 className="admin-section-title">Reports & Analytics</h2>
                {stats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                    <div className="card">
                      <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Subscriber Overview</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { label: 'Total Registered Users', val: stats.totalUsers },
                          { label: 'Active Subscribers', val: stats.activeSubscribers, accent: 'var(--accent-green)' },
                          { label: 'Inactive / Lapsed', val: stats.totalUsers - stats.activeSubscribers },
                          { label: 'Conversion Rate', val: `${((stats.activeSubscribers / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}%`, accent: 'var(--accent-gold)' },
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{item.label}</span>
                            <span style={{ fontWeight: 700, color: item.accent || 'var(--text-primary)' }}>{item.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card">
                      <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Financial Summary</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { label: 'Latest Monthly Prize Pool', val: `£${stats.totalPrizePool?.toFixed(2)}`, accent: 'var(--accent-gold)' },
                          { label: 'Estimated Monthly Revenue', val: `£${(stats.activeSubscribers * 9.99).toFixed(2)}` },
                          { label: 'Avg Charity Contribution %', val: `${stats.avgCharityContribution}%`, accent: 'var(--accent-green)' },
                          { label: 'Est. Monthly Charity Total', val: `£${(stats.activeSubscribers * 9.99 * (stats.avgCharityContribution / 100)).toFixed(2)}`, accent: 'var(--accent-green)' },
                          { label: 'Pending Verifications', val: stats.pendingVerifications, accent: stats.pendingVerifications > 0 ? '#ef4444' : undefined },
                          { label: 'Active Charities', val: stats.totalCharities },
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{item.label}</span>
                            <span style={{ fontWeight: 700, color: item.accent || 'var(--text-primary)' }}>{item.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
