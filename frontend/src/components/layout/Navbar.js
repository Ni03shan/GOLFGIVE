import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-icon">⛳</span>
          <span className="logo-text">
            <span className="logo-main">GolfGive</span>
            <span className="logo-sub">Play. Win. Give.</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="navbar-links hide-mobile">
          <NavLink to="/charities" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Charities</NavLink>
          <NavLink to="/draws" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Draws</NavLink>
          {user && (
            <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Dashboard</NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({isActive}) => isActive ? 'nav-link active nav-link-admin' : 'nav-link nav-link-admin'}>Admin</NavLink>
          )}
        </div>

        {/* Desktop actions */}
        <div className="navbar-actions hide-mobile">
          {user ? (
            <div className="nav-user">
              <span className="nav-user-name">
                <span className="nav-avatar">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                {user.firstName}
              </span>
              {user.subscription?.status === 'active' ? (
                <span className="badge badge-green" style={{fontSize:'0.7rem'}}>Active</span>
              ) : (
                <Link to="/subscribe" className="btn btn-primary btn-sm">Subscribe</Link>
              )}
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span className={`ham-line ${menuOpen ? 'open' : ''}`}/>
          <span className={`ham-line ${menuOpen ? 'open' : ''}`}/>
          <span className={`ham-line ${menuOpen ? 'open' : ''}`}/>
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <NavLink to="/charities" className="mobile-link" onClick={() => setMenuOpen(false)}>Charities</NavLink>
        <NavLink to="/draws" className="mobile-link" onClick={() => setMenuOpen(false)}>Draws</NavLink>
        {user && <NavLink to="/dashboard" className="mobile-link" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin" className="mobile-link" onClick={() => setMenuOpen(false)}>Admin</NavLink>}
        <div className="mobile-menu-actions">
          {user ? (
            <>
              {user.subscription?.status !== 'active' && (
                <Link to="/subscribe" className="btn btn-primary btn-full" onClick={() => setMenuOpen(false)}>Subscribe Now</Link>
              )}
              <button className="btn btn-ghost btn-full" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-full" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-full" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
