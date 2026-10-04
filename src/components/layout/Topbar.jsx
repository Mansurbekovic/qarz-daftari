import React from 'react';
import { useApp } from '../../contexts/AppContext';

export default function Topbar({ onOpenAddClient, onOpenMenu }) {
  const { searchQuery, setSearchQuery, toggleTheme, navigate } = useApp();

  return (
    <header className="topbar">
      {/* Mobile Menu Button */}
      <button className="mobile-menu-btn" onClick={onOpenMenu} title="Menyu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <h1
        style={{ cursor: 'pointer', margin: 0, fontSize: '18px', fontWeight: 800 }}
        onClick={() => navigate('dashboard')}
      >
        📒 Qarz Daftari
      </h1>

      {/* Qidiruv */}
      <div style={{ flex: 1, maxWidth: '420px', marginLeft: '12px' }}>
        <div className="search-box" style={{ maxWidth: '100%', height: '40px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Ism yoki manzil bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '14px', padding: '0 4px' }}
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="spacer" />

      {/* Tema almashtirish */}
      <button className="icon-btn" title="Yorug'/Qorong'u tema" onClick={toggleTheme}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </button>

      {/* Qarz yozish tugmasi */}
      <button className="btn btn-gold topbar-add-btn" onClick={onOpenAddClient} style={{ display: 'inline-flex' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="topbar-add-text">+ Yangi Qarz</span>
      </button>
    </header>
  );
}
