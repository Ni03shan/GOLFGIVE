import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './DrawsPage.css';

export default function DrawsPage() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthName = (m) => ['January','February','March','April','May','June','July','August','September','October','November','December'][m - 1];

  useEffect(() => {
    Promise.all([
      api.get('/draws/current'),
      api.get('/draws')
    ]).then(([cr, hr]) => {
      setCurrent(cr.data.draw);
      setHistory(hr.data.draws || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="draws-page">
      <div className="draws-header">
        <div className="container">
          <div className="section-tag" style={{ display: 'inline-flex' }}>Monthly Draws</div>
          <h1 className="display-lg" style={{ marginTop: '16px' }}>
            Five numbers.<br /><span className="text-accent">Endless possibilities.</span>
          </h1>
          <p className="text-secondary" style={{ marginTop: '12px', maxWidth: '500px' }}>
            Each month, five numbers between 1–45 are drawn. Match them to your golf scores and win your share of the prize pool.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '48px', paddingBottom: '80px' }}>
        {/* How draws work */}
        <div className="draws-explainer card" style={{ marginBottom: '48px' }}>
          <div className="draws-explainer-grid">
            <div className="draws-explainer-item">
              <div className="draws-exp-icon">🎯</div>
              <div>
                <h4>5-Number Match</h4>
                <p>Match all 5 drawn numbers to claim 40% of the prize pool — the Jackpot. Rolls over if unclaimed.</p>
              </div>
            </div>
            <div className="draws-explainer-item">
              <div className="draws-exp-icon">🎳</div>
              <div>
                <h4>4-Number Match</h4>
                <p>Match 4 of the 5 numbers and share 35% of the monthly prize pool.</p>
              </div>
            </div>
            <div className="draws-explainer-item">
              <div className="draws-exp-icon">🎲</div>
              <div>
                <h4>3-Number Match</h4>
                <p>Match any 3 and you win a share of 25% of the prize pool.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current draw */}
        {current ? (
          <div className="current-draw-section">
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
              {monthName(current.month)} {current.year} Draw
              <span className="badge badge-green" style={{ marginLeft: '12px', fontSize: '0.72rem' }}>Latest</span>
            </h2>
            <p className="text-muted" style={{ marginBottom: '28px', fontSize: '0.88rem' }}>
              {current.totalSubscribers} active subscribers · £{current.totalPrizePool?.toFixed(2)} total prize pool
            </p>

            <div className="current-draw-card card">
              <div className="current-draw-numbers">
                <div className="draw-numbers-title">Drawn Numbers</div>
                <div className="draw-balls-row">
                  {current.drawnNumbers.map(n => (
                    <div key={n} className="score-ball lg">{n}</div>
                  ))}
                </div>
              </div>

              <div className="prize-breakdown">
                <div className="prize-tier">
                  <div className="prize-tier-icon">🥇</div>
                  <div>
                    <div className="prize-tier-name">5-Match Jackpot</div>
                    <div className="prize-tier-amount text-gold">£{(current.prizePools?.fiveMatch?.total || 0).toFixed(2)}</div>
                  </div>
                  {current.prizePools?.fiveMatch?.rolledOver && (
                    <span className="badge badge-gold" style={{marginLeft:'auto'}}>Rolled Over</span>
                  )}
                </div>
                <div className="prize-tier">
                  <div className="prize-tier-icon">🥈</div>
                  <div>
                    <div className="prize-tier-name">4-Match Prize</div>
                    <div className="prize-tier-amount text-secondary">£{(current.prizePools?.fourMatch?.total || 0).toFixed(2)}</div>
                  </div>
                </div>
                <div className="prize-tier">
                  <div className="prize-tier-icon">🥉</div>
                  <div>
                    <div className="prize-tier-name">3-Match Prize</div>
                    <div className="prize-tier-amount text-secondary">£{(current.prizePools?.threeMatch?.total || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {current.winners?.length > 0 && (
                <div className="winners-section">
                  <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>🏆 Winners</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {current.winners.map((w, i) => (
                      <div key={i} className="winner-row">
                        <div className="winner-avatar">
                          {w.user?.firstName?.[0]}{w.user?.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{w.user?.firstName} {w.user?.lastName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.matchType}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', color: 'var(--accent-gold)', fontWeight: 700 }}>
                          £{(w.prizeAmount || 0).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No published draw yet</h3>
            <p>The first monthly draw will be published soon. Subscribe now to be included!</p>
            <Link to="/subscribe" className="btn btn-primary" style={{ marginTop: '20px' }}>Subscribe to Enter</Link>
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div style={{ marginTop: '56px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px' }}>Draw History</h2>
            <div className="draws-history-grid">
              {history.slice(1).map(d => (
                <div key={d._id} className="history-draw-card card">
                  <div className="history-draw-header">
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{monthName(d.month)} {d.year}</span>
                    <span className="badge badge-gray">{d.winners?.length || 0} winners</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {d.drawnNumbers.map(n => (
                      <div key={n} className="score-ball" style={{ width: 36, height: 36, fontSize: '0.82rem' }}>{n}</div>
                    ))}
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    £{d.totalPrizePool?.toFixed(2)} prize pool · {d.totalSubscribers} members
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
