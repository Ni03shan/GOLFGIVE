import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './DashboardPage.css';

const TABS = ['Overview', 'My Scores', 'Draw Results', 'Charity', 'Winnings'];

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('Overview');
  const [scores, setScores] = useState([]);
  const [draws, setDraws] = useState([]);
  const [charities, setCharities] = useState([]);
  const [winnings, setWinnings] = useState([]);
  const [winningsTotals, setWinningsTotals] = useState({});
  const [loading, setLoading] = useState(false);
  const [scoreForm, setScoreForm] = useState({ value: '', date: '', course: '' });
  const [editingScore, setEditingScore] = useState(null);
  const [showAddScore, setShowAddScore] = useState(false);

  const loadScores = useCallback(async () => {
    try {
      const r = await api.get('/scores');
      setScores(r.data.scores || []);
    } catch {}
  }, []);

  const loadDrawResults = useCallback(async () => {
    try {
      const r = await api.get('/draws/my-results');
      setDraws(r.data.results || []);
    } catch {}
  }, []);

  const loadCharities = useCallback(async () => {
    try {
      const r = await api.get('/charities');
      setCharities(r.data.charities || []);
    } catch {}
  }, []);

  const loadWinnings = useCallback(async () => {
    try {
      const r = await api.get('/users/winnings');
      setWinnings(r.data.winnings || []);
      setWinningsTotals(r.data.totals || {});
    } catch {}
  }, []);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  useEffect(() => {
    if (tab === 'Draw Results') loadDrawResults();
    if (tab === 'Charity') loadCharities();
    if (tab === 'Winnings') loadWinnings();
  }, [tab, loadDrawResults, loadCharities, loadWinnings]);

  const isSubscribed = user?.subscription?.status === 'active';

  const handleAddScore = async (e) => {
    e.preventDefault();
    if (!scoreForm.value || !scoreForm.date) { toast.error('Score value and date are required.'); return; }
    setLoading(true);
    try {
      const r = await api.post('/scores', scoreForm);
      setScores(r.data.scores);
      setScoreForm({ value: '', date: '', course: '' });
      setShowAddScore(false);
      toast.success('Score added! 🏌️');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add score.'); }
    finally { setLoading(false); }
  };

  const handleUpdateScore = async (scoreId) => {
    setLoading(true);
    try {
      const r = await api.put(`/scores/${scoreId}`, editingScore);
      setScores(r.data.scores);
      setEditingScore(null);
      toast.success('Score updated!');
    } catch (err) { toast.error('Failed to update score.'); }
    finally { setLoading(false); }
  };

  const handleDeleteScore = async (scoreId) => {
    if (!window.confirm('Delete this score?')) return;
    try {
      const r = await api.delete(`/scores/${scoreId}`);
      setScores(r.data.scores);
      toast.success('Score removed.');
    } catch { toast.error('Failed to delete score.'); }
  };

  const handleUpdateCharity = async (charityId, pct) => {
    try {
      await api.put('/users/charity', { charityId, contributionPercentage: pct });
      await refreshUser();
      toast.success('Charity preference updated! 💚');
    } catch { toast.error('Failed to update charity.'); }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Cancel subscription? You will retain access until the end of your billing period.')) return;
    try {
      await api.post('/payments/cancel');
      await refreshUser();
      toast.success('Subscription will cancel at end of billing period.');
    } catch { toast.error('Failed to cancel subscription.'); }
  };

  const matchLabel = (n) => n === 5 ? '5-Match 🥇' : n === 4 ? '4-Match 🥈' : n === 3 ? '3-Match 🥉' : 'No Match';
  const monthName = (m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="container">
          <div className="dashboard-title-row">
            <div>
              <h1 className="display-md">Welcome back, <span className="text-accent">{user?.firstName}</span></h1>
              <p className="text-secondary" style={{ marginTop: '4px' }}>
                {isSubscribed
                  ? `Active ${user.subscription.plan} plan · Renews ${user.subscription.currentPeriodEnd ? format(new Date(user.subscription.currentPeriodEnd), 'dd MMM yyyy') : 'N/A'}`
                  : 'No active subscription'
                }
              </p>
            </div>
            {!isSubscribed && (
              <Link to="/subscribe" className="btn btn-primary">Subscribe Now →</Link>
            )}
          </div>
          <div className="dashboard-summary">
            <div className="stat-card">
              <div className="stat-icon">🏌️</div>
              <div className="stat-value">{scores.length}/5</div>
              <div className="stat-label">Scores Entered</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-value">{draws.filter(d => d.matchCount >= 3).length}</div>
              <div className="stat-label">Draws Won</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">Rs {(winningsTotals.total || 0).toFixed(2)}</div>
              <div className="stat-label">Total Won</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💚</div>
              <div className="stat-value">{user?.charity?.contributionPercentage || 10}%</div>
              <div className="stat-label">Charity Share</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '80px' }}>
        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'Overview' && (
          <div className="tab-content animate-fade-up">
            <div className="overview-grid">
              {/* Subscription Card */}
              <div className="card overview-sub-card">
                <h3 className="card-title">Subscription</h3>
                {isSubscribed ? (
                  <>
                    <div className="sub-status-row">
                      <span className="badge badge-green">Active</span>
                      <span className="text-muted" style={{fontSize:'0.85rem', textTransform:'capitalize'}}>{user.subscription.plan} Plan</span>
                    </div>
                    <div className="sub-detail">
                      <span>Renews</span>
                      <span>{user.subscription.currentPeriodEnd ? format(new Date(user.subscription.currentPeriodEnd), 'dd MMM yyyy') : '—'}</span>
                    </div>
                    {user.subscription.cancelAtPeriodEnd && (
                      <div className="alert alert-warning" style={{marginTop:'12px', fontSize:'0.82rem'}}>
                        ⚠️ Cancels at end of period
                      </div>
                    )}
                    {!user.subscription.cancelAtPeriodEnd && (
                      <button className="btn btn-danger btn-sm" style={{marginTop:'16px'}} onClick={handleCancelSubscription}>
                        Cancel Subscription
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{marginTop:'12px'}}>
                    <p className="text-muted" style={{fontSize:'0.88rem', marginBottom:'16px'}}>Subscribe to enter monthly prize draws.</p>
                    <Link to="/subscribe" className="btn btn-primary btn-full">Subscribe Now</Link>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="flex-between" style={{marginBottom:'16px'}}>
                  <h3 className="card-title">My Scores</h3>
                  {isSubscribed && <button className="btn btn-secondary btn-sm" onClick={() => { setTab('My Scores'); setShowAddScore(true); }}>+ Add Score</button>}
                </div>
                {scores.length > 0 ? (
                  <div className="scores-preview">
                    {scores.map(s => (
                      <div key={s._id} className="score-preview-item">
                        <div className="score-ball">{s.value}</div>
                        <div>
                          <div style={{fontWeight:600, fontSize:'0.88rem'}}>{s.course || 'Round'}</div>
                          <div style={{fontSize:'0.78rem', color:'var(--text-muted)'}}>{format(new Date(s.date), 'dd MMM yyyy')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted" style={{fontSize:'0.88rem'}}>No scores entered yet. {!isSubscribed ? 'Subscribe first.' : 'Add your first score!'}</p>
                )}
              </div>

              {/* Charity */}
              <div className="card">
                <h3 className="card-title">My Charity</h3>
                {user?.charity?.selected ? (
                  <div style={{marginTop:'12px'}}>
                    <div style={{fontWeight:600, marginBottom:'6px'}}>{user.charity.selected.name || 'Your charity'}</div>
                    <div style={{fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'12px'}}>
                      You're giving <strong style={{color:'var(--accent-green)'}}>{user.charity.contributionPercentage}%</strong> of your subscription
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => setTab('Charity')}>Change Charity</button>
                  </div>
                ) : (
                  <div style={{marginTop:'12px'}}>
                    <p className="text-muted" style={{fontSize:'0.88rem', marginBottom:'16px'}}>No charity selected yet.</p>
                    <button className="btn btn-secondary btn-sm" onClick={() => setTab('Charity')}>Choose Charity</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MY SCORES */}
        {tab === 'My Scores' && (
          <div className="tab-content animate-fade-up">
            <div className="scores-header">
              <div>
                <h2 style={{fontFamily:'var(--font-display)', marginBottom:'4px'}}>Your Golf Scores</h2>
                <p className="text-muted" style={{fontSize:'0.88rem'}}>Up to 5 Stableford scores (1–45). A new score replaces the oldest.</p>
              </div>
              {isSubscribed && scores.length < 5 && (
                <button className="btn btn-primary" onClick={() => setShowAddScore(!showAddScore)}>
                  {showAddScore ? 'Cancel' : '+ Add Score'}
                </button>
              )}
            </div>

            {showAddScore && isSubscribed && (
              <div className="card score-form-card animate-fade-up">
                <h3 style={{fontFamily:'var(--font-display)', marginBottom:'20px'}}>Add New Score</h3>
                <form onSubmit={handleAddScore}>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px'}}>
                    <div className="form-group">
                      <label className="form-label">Stableford Score (1-45)</label>
                      <input type="number" className="form-input" min="1" max="45"
                        placeholder="e.g. 32" value={scoreForm.value}
                        onChange={e => setScoreForm(f => ({ ...f, value: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date Played</label>
                      <input type="date" className="form-input" value={scoreForm.date}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e => setScoreForm(f => ({ ...f, date: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Course Name (optional)</label>
                      <input type="text" className="form-input" placeholder="e.g. St Andrews"
                        value={scoreForm.course}
                        onChange={e => setScoreForm(f => ({ ...f, course: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{marginTop:'16px', display:'flex', gap:'12px'}}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Saving…' : 'Save Score'}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowAddScore(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {!isSubscribed && (
              <div className="alert alert-warning">
                ⚠️ You need an active subscription to enter scores. <Link to="/subscribe">Subscribe now</Link>
              </div>
            )}

            <div className="scores-list">
              {scores.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⛳</div>
                  <h3>No scores yet</h3>
                  <p>Add your first Stableford score to enter the monthly draw.</p>
                </div>
              ) : (
                scores.map((s, i) => (
                  <div key={s._id} className="score-row card">
                    <div className="score-rank">#{i + 1}</div>
                    {editingScore?._id === s._id ? (
                      <div className="score-edit-form">
                        <input type="number" className="form-input" min="1" max="45" style={{width:'80px'}}
                          value={editingScore.value}
                          onChange={e => setEditingScore(es => ({ ...es, value: e.target.value }))} />
                        <input type="date" className="form-input" style={{width:'160px'}}
                          value={editingScore.date?.split('T')[0]}
                          onChange={e => setEditingScore(es => ({ ...es, date: e.target.value }))} />
                        <input type="text" className="form-input" placeholder="Course"
                          value={editingScore.course || ''}
                          onChange={e => setEditingScore(es => ({ ...es, course: e.target.value }))} />
                        <div style={{display:'flex', gap:'8px'}}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleUpdateScore(s._id)} disabled={loading}>Save</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingScore(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="score-ball lg">{s.value}</div>
                        <div className="score-info">
                          <div className="score-course">{s.course || 'Round'}</div>
                          <div className="score-date">{format(new Date(s.date), 'EEEE, dd MMM yyyy')}</div>
                        </div>
                        <div className="score-tag">
                          {s.value >= 36 ? <span className="badge badge-gold">Excellent</span>
                          : s.value >= 28 ? <span className="badge badge-green">Good</span>
                          : <span className="badge badge-gray">Average</span>}
                        </div>
                        <div className="score-actions">
                          {isSubscribed && (
                            <>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingScore({ _id: s._id, value: s.value, date: s.date, course: s.course })}>Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteScore(s._id)}>Delete</button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
            {scores.length === 5 && isSubscribed && (
              <div className="alert alert-info" style={{marginTop:'16px'}}>
                ℹ️ You have 5 scores. Adding a new score will automatically replace the oldest one.
              </div>
            )}
          </div>
        )}

        {/* DRAW RESULTS */}
        {tab === 'Draw Results' && (
          <div className="tab-content animate-fade-up">
            <h2 style={{fontFamily:'var(--font-display)', marginBottom:'4px'}}>Your Draw History</h2>
            <p className="text-muted" style={{fontSize:'0.88rem', marginBottom:'24px'}}>How your scores matched against recent monthly draws.</p>
            {draws.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h3>No draws yet</h3>
                <p>Your draw history will appear here once the first monthly draw has run.</p>
              </div>
            ) : (
              <div className="draws-list">
                {draws.map(d => (
                  <div key={d.drawId} className={`draw-result-card card ${d.matchCount >= 3 ? 'draw-result-winner' : ''}`}>
                    <div className="draw-result-header">
                      <div>
                        <div className="draw-month">{monthName(d.month)} {d.year}</div>
                        <div className="draw-match-label">{matchLabel(d.matchCount)}</div>
                      </div>
                      {d.matchCount >= 3 && <span className="badge badge-gold">Winner!</span>}
                    </div>
                    <div className="draw-numbers-row">
                      <div>
                        <div className="draw-nums-label">Drawn Numbers</div>
                        <div className="draw-nums">
                          {d.drawnNumbers.map(n => (
                            <div key={n} className={`score-ball ${d.matched.includes(n) ? 'matched' : ''}`}>{n}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="draw-nums-label">Your Scores (at draw time)</div>
                        <div className="draw-nums">
                          {d.matched.length > 0
                            ? d.matched.map(n => <div key={n} className="score-ball matched">{n}</div>)
                            : <span className="text-muted" style={{fontSize:'0.85rem'}}>No matches this round</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHARITY */}
        {tab === 'Charity' && (
          <div className="tab-content animate-fade-up">
            <h2 style={{fontFamily:'var(--font-display)', marginBottom:'4px'}}>Your Charity</h2>
            <p className="text-muted" style={{fontSize:'0.88rem', marginBottom:'24px'}}>
              Currently giving <strong style={{color:'var(--accent-green)'}}>{user?.charity?.contributionPercentage || 10}%</strong> of your subscription to{' '}
              <strong>{user?.charity?.selected?.name || 'a charity of your choice'}</strong>.
            </p>
            <div className="charity-grid">
              {charities.map(c => {
                const isSelected = user?.charity?.selected?._id === c._id || user?.charity?.selected === c._id;
                return (
                  <div key={c._id} className={`charity-card card ${isSelected ? 'charity-card-selected' : ''}`}>
                    {isSelected && <div className="charity-selected-badge">✓ Your Charity</div>}
                    <div className="charity-logo">{c.logo ? <img src={c.logo} alt={c.name} /> : '🌿'}</div>
                    <h3>{c.name}</h3>
                    <span className="badge badge-gray" style={{marginBottom:'8px'}}>{c.category}</span>
                    <p className="text-secondary" style={{fontSize:'0.85rem', lineHeight:1.65}}>{c.shortDescription || c.description?.substring(0, 120)}…</p>
                    <div style={{marginTop:'16px', display:'flex', gap:'8px'}}>
                      {!isSelected && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateCharity(c._id, user?.charity?.contributionPercentage || 10)}>
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WINNINGS */}
        {tab === 'Winnings' && (
          <div className="tab-content animate-fade-up">
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'32px'}}>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-value">Rs {(winningsTotals.total || 0).toFixed(2)}</div>
                <div className="stat-label">Total Won</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-value">Rs {(winningsTotals.pendingPayout || 0).toFixed(2)}</div>
                <div className="stat-label">Pending Payout</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-value">{winnings.length}</div>
                <div className="stat-label">Draws Won</div>
              </div>
            </div>

            {winnings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <h3>No winnings yet</h3>
                <p>Keep entering your scores each month — your first win could be just around the corner!</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Draw</th>
                      <th>Match</th>
                      <th>Matched</th>
                      <th>Prize</th>
                      <th>Verification</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winnings.map((w, i) => (
                      <tr key={i}>
                        <td style={{fontWeight:600}}>{monthName(w.month)} {w.year}</td>
                        <td>{matchLabel(w.matchedNumbers?.length)}</td>
                        <td>
                          <div style={{display:'flex', gap:'6px'}}>
                            {w.matchedNumbers?.map(n => <div key={n} className="score-ball matched" style={{width:32,height:32,fontSize:'0.8rem'}}>{n}</div>)}
                          </div>
                        </td>
                        <td style={{fontFamily:'var(--font-display)', color:'var(--accent-gold)', fontWeight:700}}>
                          Rs {(w.prizeAmount || 0).toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${w.verificationStatus === 'approved' ? 'badge-green' : w.verificationStatus === 'rejected' ? 'badge-red' : 'badge-gray'}`}>
                            {w.verificationStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${w.paymentStatus === 'paid' ? 'badge-green' : 'badge-gold'}`}>
                            {w.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
