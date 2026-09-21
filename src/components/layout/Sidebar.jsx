import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { NAV_ITEMS, APP_VERSION } from '../../utils/constants';

export default function Sidebar({ onLogoutClick, isOpenMobile, onCloseMobile }) {
  const { currentPage, navigate, totals, lockApp, currentUser, db, isAdmin } = useApp();
  const t = totals();

  const visibleNavItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  const handleNavClick = (id) => {
    navigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {isOpenMobile && (
        <div className="mobile-drawer-backdrop" onClick={onCloseMobile} />
      )}
      <aside className={`sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
        <div className="brand" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-mark">QD</div>
            <div>
              <div className="brand-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Qarz Daftari
                <span className="version-badge">{APP_VERSION}</span>
              </div>
              <div className="brand-sub">{db?.businessName || 'Hisob-kitob tizimi'}</div>
            </div>
          </div>
          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                fontSize: '18px',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </div>

      <nav className="nav">
        {visibleNavItems.map(item => {
          const isActive = currentPage === item.id;
          const showOverdueBadge = item.id === 'clients' && t.overdueCount > 0;

          return (
            <button
              key={item.id}
              className={`nav-item${isActive ? ' active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                dangerouslySetInnerHTML={{ __html: item.icon }}
              />
              {item.label}
              {showOverdueBadge && <span className="nav-badge">{t.overdueCount}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-user">
          <b>{currentUser || '—'}</b>
          {isAdmin ? <span style={{ color: 'var(--gold)', fontWeight: 800 }}> [ADMIN]</span> : ' hisobingiz'}
        </div>
        <button className="nav-item" onClick={lockApp}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          Qulflash
        </button>
        <button className="nav-item" onClick={onLogoutClick}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Chiqish
        </button>
      </div>
    </aside>
    </>
  );
}
