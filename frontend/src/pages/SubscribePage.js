import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './SubscribePage.css';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 'Rs 99',
    period: '/month',
    savings: null,
    features: [
      'Enter monthly prize draws',
      'Up to 5 Stableford scores',
      'Charity contribution (min 10%)',
      'Full dashboard access',
      'Winner verification system',
    ],
    cta: 'Subscribe Monthly',
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 'Rs 899',
    period: '/year',
    savings: 'Save Rs 100 vs monthly',
    features: [
      'Everything in Monthly',
      '2 months free',
      'Priority draw entry',
      'Exclusive yearly badge',
      'Early access to new features',
    ],
    cta: 'Subscribe Yearly',
    highlight: true,
  },
];

export default function SubscribePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleSubscribe = async (planId) => {
    if (!user) { navigate('/register'); return; }
    if (user.subscription?.status === 'active') {
      toast.info('You already have an active subscription!');
      navigate('/dashboard');
      return;
    }
    setLoadingPlan(planId);
    try {
      const res = await api.post('/payments/create-checkout', { plan: planId });
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        toast.error('Could not initiate payment. Please try again.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment setup failed.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="subscribe-page">
      <div className="subscribe-bg">
        <div className="sub-orb sub-orb-1" />
        <div className="sub-orb sub-orb-2" />
      </div>

      <div className="container">
        <div className="subscribe-header animate-fade-up">
          <div className="section-tag" style={{ display: 'inline-flex' }}>Pricing</div>
          <h1 className="display-lg" style={{ marginTop: '16px' }}>
            Simple, transparent<br /><span className="text-accent">subscription plans</span>
          </h1>
          <p className="text-secondary" style={{ marginTop: '12px', maxWidth: '480px', margin: '12px auto 0' }}>
            Choose a plan and start entering your golf scores into our monthly prize draws. Minimum 10% always goes to charity.
          </p>
        </div>

        <div className="plans-grid animate-fade-up" style={{ animationDelay: '0.15s' }}>
          {PLANS.map(plan => (
            <div key={plan.id} className={`plan-card ${plan.highlight ? 'plan-card-featured' : ''}`}>
              {plan.highlight && <div className="plan-badge">Most Popular</div>}
              <div className="plan-header">
                <h2 className="plan-name">{plan.name}</h2>
                <div className="plan-price">
                  <span className="plan-amount">{plan.price}</span>
                  <span className="plan-period">{plan.period}</span>
                </div>
                {plan.savings && <div className="plan-savings">{plan.savings}</div>}
              </div>
              <ul className="plan-features">
                {plan.features.map((f, i) => (
                  <li key={i}><span className="feature-check">✓</span> {f}</li>
                ))}
              </ul>
              <button
                className={`btn btn-full btn-lg ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSubscribe(plan.id)}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === plan.id ? 'Redirecting…' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Charity contribution explainer */}
        <div className="charity-explainer animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <div className="charity-explainer-icon">💚</div>
          <div>
            <h3>Every subscription funds real change</h3>
            <p>At least 10% of every subscription you make is directed to the charity you choose. You can increase this at any time — or make a standalone donation independent of your gameplay.</p>
          </div>
          <Link to="/charities" className="btn btn-secondary" style={{ flexShrink: 0 }}>Browse Charities</Link>
        </div>

        {/* FAQ */}
        <div className="faq-section animate-fade-up" style={{ animationDelay: '0.35s' }}>
          <h2 className="display-md text-center" style={{ marginBottom: '36px' }}>
            Frequently asked <span className="text-accent">questions</span>
          </h2>
          <div className="faq-grid">
            {[
              { q: 'When does the monthly draw happen?', a: 'Draws are run once per calendar month by our admin team. Results are published on our platform and winners are notified by email.' },
              { q: 'How does the prize pool work?', a: '60% of subscription revenue goes to prizes: 40% to the jackpot (5-match), 35% to 4-match winners, and 25% to 3-match winners. The jackpot rolls over if unclaimed.' },
              { q: 'Do I have to enter my scores every month?', a: 'You only need 5 Stableford scores on file. New scores automatically replace the oldest, so just play and update as you go.' },
              { q: 'Can I change my charity?', a: 'Yes, you can update your selected charity at any time from your dashboard. Changes take effect from the next billing cycle.' },
              { q: 'What happens if I win?', a: 'Winners are notified by email and asked to submit a screenshot of their scores from their golf platform for verification before payout.' },
              { q: 'Can I cancel anytime?', a: 'Absolutely. You can cancel your subscription from your dashboard at any time. You\'ll retain access until the end of your paid period.' },
            ].map((faq, i) => (
              <div key={i} className="faq-item">
                <h4>{faq.q}</h4>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
