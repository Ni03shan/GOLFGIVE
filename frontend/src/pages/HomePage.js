import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './HomePage.css';

const STEPS = [
  { icon: '📝', num: '01', title: 'Subscribe', desc: 'Choose a monthly or yearly plan. Cancel anytime.' },
  { icon: '⛳', num: '02', title: 'Enter Scores', desc: 'Log your latest Stableford scores from your rounds.' },
  { icon: '🎯', num: '03', title: 'Enter the Draw', desc: 'Your 5 scores are automatically entered into the monthly draw.' },
  { icon: '🏆', num: '04', title: 'Win & Give', desc: 'Match drawn numbers to win prizes. A portion always goes to charity.' },
];

const PRIZES = [
  { match: '5 Numbers', share: '40%', tag: 'Jackpot', icon: '🥇', color: 'gold' },
  { match: '4 Numbers', share: '35%', tag: 'Major Prize', icon: '🥈', color: 'silver' },
  { match: '3 Numbers', share: '25%', tag: 'Prize', icon: '🥉', color: 'bronze' },
];

export default function HomePage() {
  const [charities, setCharities] = useState([]);
  const [latestDraw, setLatestDraw] = useState(null);
  const [stats, setStats] = useState({ subscribers: '2,400+', given: 'RS 4,80,000+', draws: '24+' });

  useEffect(() => {
    api.get('/charities?featured=true').then(r => setCharities(r.data.charities?.slice(0, 3) || [])).catch(() => {});
    api.get('/draws/current').then(r => setLatestDraw(r.data.draw)).catch(() => {});
  }, []);

  const monthName = (m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-grid" />
        </div>
        <div className="container hero-content">
          <div className="hero-text animate-fade-up">
            <div className="section-tag">🌿 Golf Meets Giving</div>
            <h1 className="display-xl hero-headline">
              Play golf.<br />
              <span className="text-accent">Win big.</span><br />
              Change lives.
            </h1>
            <p className="hero-sub">
              Enter your golf scores each month and get entered into our prize draw. Every subscription funds the charities you care about most.
            </p>
            <div className="hero-ctas">
              <Link to="/register" className="btn btn-primary btn-lg">Start Playing for Good</Link>
              <Link to="/draws" className="btn btn-secondary btn-lg">See How It Works</Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-val">{stats.subscribers}</span>
                <span className="hero-stat-label">Active Members</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-val">{stats.given}</span>
                <span className="hero-stat-label">Given to Charity</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-val">{stats.draws}</span>
                <span className="hero-stat-label">Draws Completed</span>
              </div>
            </div>
          </div>

          <div className="hero-card-wrap animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="hero-draw-card">
              <div className="hero-draw-header">
                <span className="badge badge-green animate-pulse">● Live Draw</span>
                {latestDraw ? (
                  <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                    {monthName(latestDraw.month)} {latestDraw.year}
                  </span>
                ) : <span className="text-muted" style={{ fontSize: '0.82rem' }}>Next Draw Soon</span>}
              </div>
              <div className="hero-draw-title">This Month's Numbers</div>
              <div className="hero-draw-numbers">
                {latestDraw?.drawnNumbers?.length
                  ? latestDraw.drawnNumbers.map(n => <div key={n} className="score-ball lg">{n}</div>)
                  : [7, 14, 22, 31, 38].map(n => <div key={n} className="score-ball lg placeholder-ball">{n}</div>)
                }
              </div>
              <div className="hero-draw-pool">
                <div className="hero-pool-item">
                  <span className="hero-pool-label">🏆 Jackpot Pool</span>
                  <span className="hero-pool-val text-gold">
                    {latestDraw ? `Rs ${(latestDraw.totalPrizePool * 0.4).toFixed(0)}` : 'Rs 4,800'}
                  </span>
                </div>
                <div className="hero-pool-item">
                  <span className="hero-pool-label">💚 Charity Pot</span>
                  <span className="hero-pool-val text-accent">
                    {latestDraw ? `Rs ${(latestDraw.totalSubscribers * 9.99 * 0.1).toFixed(0)}` : 'Rs 2,400'}
                  </span>
                </div>
              </div>
              <Link to="/subscribe" className="btn btn-primary btn-full" style={{ marginTop: '8px' }}>
                Join This Draw →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '56px' }}>
            <div className="section-tag" style={{ display: 'inline-flex' }}>How It Works</div>
            <h2 className="display-md" style={{ marginTop: '16px' }}>
              Four steps to <span className="text-accent">winning & giving</span>
            </h2>
          </div>
          <div className="steps-grid">
            {STEPS.map((step, i) => (
              <div className="step-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="step-num">{step.num}</div>
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Structure */}
      <section className="section prizes-section" id="draw-system">
        <div className="container">
          <div className="prizes-inner">
            <div className="prizes-text">
              <div className="section-tag">Prize Structure</div>
              <h2 className="display-md" style={{ marginTop: '16px' }}>
                Three ways to<br /><span className="text-accent">win every month</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '16px', lineHeight: 1.7 }}>
                Match 3, 4, or all 5 of the monthly drawn numbers against your golf scores. The more matches, the bigger your slice of the prize pool.
              </p>
              <p style={{ color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.7 }}>
                The jackpot rolls over every month there's no 5-number winner — so the pool keeps growing until someone claims it.
              </p>
              <Link to="/subscribe" className="btn btn-primary" style={{ marginTop: '28px' }}>
                Enter the Next Draw
              </Link>
            </div>
            <div className="prizes-cards">
              {PRIZES.map((p, i) => (
                <div className={`prize-card prize-card-${p.color}`} key={i}>
                  <span className="prize-icon">{p.icon}</span>
                  <div>
                    <div className="prize-match">Match {p.match}</div>
                    <div className="prize-tag">{p.tag}</div>
                  </div>
                  <div className="prize-share">{p.share} of pool</div>
                </div>
              ))}
              <div className="prize-rollover-note">
                🔄 Jackpot rolls over to next month if unclaimed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Charity Section */}
      <section className="section" id="charity">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '48px' }}>
            <div className="section-tag" style={{ display: 'inline-flex' }}>Charity Impact</div>
            <h2 className="display-md" style={{ marginTop: '16px' }}>
              Every subscription<br /><span className="text-accent">funds real change</span>
            </h2>
            <p className="text-secondary" style={{ marginTop: '12px', maxWidth: '480px', margin: '12px auto 0' }}>
              At least 10% of every subscription goes directly to the charity you choose. You can give even more if you wish.
            </p>
          </div>

          <div className="grid grid-3" style={{ marginBottom: '36px' }}>
            {charities.length > 0
              ? charities.map(c => (
                  <Link to={`/charities/${c._id}`} key={c._id} className="charity-preview card card-hover">
                    <div className="charity-preview-img">
                      {c.logo ? <img src={c.logo} alt={c.name} /> : <span>🌿</span>}
                    </div>
                    <div className="charity-preview-body">
                      <span className="badge badge-green" style={{ marginBottom: '8px' }}>{c.category}</span>
                      <h3>{c.name}</h3>
                      <p>{c.shortDescription || c.description?.substring(0, 100)}…</p>
                      <div className="charity-preview-stats">
                        <span>👥 {c.subscriberCount} supporters</span>
                      </div>
                    </div>
                  </Link>
                ))
              : ['Healthcare', 'Education', 'Environment'].map((name, i) => (
                  <div className="charity-preview card" key={i}>
                    <div className="charity-preview-img"><span>🌿</span></div>
                    <div className="charity-preview-body">
                      <span className="badge badge-green" style={{ marginBottom: '8px' }}>{name}</span>
                      <h3>Featured Charity</h3>
                      <p>Making a meaningful difference in communities around the world.</p>
                    </div>
                  </div>
                ))
            }
          </div>
          <div className="text-center">
            <Link to="/charities" className="btn btn-secondary">Browse All Charities →</Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-inner">
            <div className="cta-bg-orb" />
            <div className="section-tag" style={{ display: 'inline-flex', marginBottom: '20px' }}>Ready to Play?</div>
            <h2 className="display-lg">
              Your next round could<br /><span className="text-accent">win you thousands</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '16px', maxWidth: '500px', margin: '16px auto 0' }}>
              Subscribe today, enter your scores, and join thousands of golfers playing for prizes and purpose.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '36px', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
              <Link to="/charities" className="btn btn-secondary btn-lg">Choose Your Charity</Link>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '20px' }}>
              From Rs 9.99/month • Cancel anytime • 18+ only
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
