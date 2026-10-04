import React from 'react';
import { useApp } from '../../contexts/AppContext';

export default function MobileNav({ onOpenAddClient }) {
  const { currentPage, navigate } = useApp();

  return (
    <nav className="mobile-bottom-nav">
      {/* 1. Asosiy Qarzlar ro'yxati */}
      <button
        className={`mobile-nav-btn ${currentPage === 'dashboard' || currentPage === 'clients' ? 'active' : ''}`}
        onClick={() => navigate('dashboard')}
        aria-label="Qarz Daftari"
      >
        <div className="mobile-nav-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <path d="M6 6h10" />
            <path d="M6 10h10" />
            <path d="M6 14h6" />
          </svg>
        </div>
        <span className="mobile-nav-label">Qarz Daftari</span>
      </button>

      {/* 2. Markaziy Katta Qarz Yozish Tugmasi */}
      <div className="mobile-nav-fab-container">
        <button
          className="mobile-nav-fab-btn"
          onClick={onOpenAddClient}
          title="Yangi qarz yozish"
          aria-label="Yangi qarz yozish"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="mobile-nav-fab-label">Qarz yozish</span>
      </div>

      {/* 3. Sozlamalar */}
      <button
        className={`mobile-nav-btn ${currentPage === 'settings' ? 'active' : ''}`}
        onClick={() => navigate('settings')}
        aria-label="Sozlamalar"
      >
        <div className="mobile-nav-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.44.42.82.8 1.09.32.2.7.31 1.1.31H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
        <span className="mobile-nav-label">Sozlamalar</span>
      </button>
    </nav>
  );
}
