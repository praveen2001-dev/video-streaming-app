import React from 'react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <div className="brand-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#ffffff">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span>StreamPulse</span>
      </Link>

      <div className="nav-links">
        <Link to="/" className="nav-btn">
          Home
        </Link>
        <Link to="/upload" className="nav-btn nav-btn-primary">
          + Upload
        </Link>
        <Link to="/manage" className="nav-btn">
          Admin Manage
        </Link>
      </div>
    </nav>
  );
};
