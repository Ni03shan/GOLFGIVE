import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <span>⛳</span>
              <div>
                <div className="footer-logo-name">GolfGive</div>
                <div className="footer-logo-tag">Play. Win. Give.</div>
              </div>
            </div>
            <p className="footer-desc">
              The golf subscription platform where every score you enter could win you a prize — and always supports a charity you believe in.
            </p>
            <div className="footer-social">
              <a href="#!" className="social-link" aria-label="Twitter">𝕏</a>
              <a href="#!" className="social-link" aria-label="Instagram">📸</a>
              <a href="#!" className="social-link" aria-label="Facebook">👤</a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/charities">Charities</Link></li>
              <li><Link to="/draws">Monthly Draws</Link></li>
              <li><Link to="/subscribe">Pricing</Link></li>
              <li><Link to="/register">Get Started</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>How It Works</h4>
            <ul>
              <li><a href="#how-it-works">Enter Scores</a></li>
              <li><a href="#draw-system">Monthly Draws</a></li>
              <li><a href="#charity">Charity Impact</a></li>
              <li><a href="#winners">Winner Stories</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#!">Terms of Service</a></li>
              <li><a href="#!">Privacy Policy</a></li>
              <li><a href="#!">Cookie Policy</a></li>
              <li><a href="#!">Draw Rules</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} GolfGive. All rights reserved. A Digital Heroes project.</p>
          <p className="footer-disclaimer">GolfGive is a subscription platform. Draws are entertainment-based. Must be 18+ to subscribe.</p>
        </div>
      </div>
    </footer>
  );
}
