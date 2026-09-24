import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { PAGE_TITLES, APP_VERSION } from '../../utils/constants';

export default function Topbar({ onOpenAddClient, onOpenMenu }) {
  const {
    currentPage, searchQuery, setSearchQuery, toggleTheme,
    navigate, notifications, markAllNotificationsRead, db, switchBranch, clientBalance
  } = useApp();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showNotifDrop, setShowNotifDrop] = useState(false);
  const [showBranchDrop, setShowBranchDrop] = useState(false);
  const debounceRef = useRef(null);

  const branches = db?.branches || [];
  const currentBranchId = db?.currentBranchId || 'main';
  const currentBranch = branches.find(b => b.id === currentBranchId) || branches[0];
  const unreadCount = (notifications || []).filter(n => !n.read).length;

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setLocalSearch(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(q);
      if (q && currentPage !== 'clients' && currentPage !== 'transactions') {
        navigate('clients');
      }
    }, 150);
  };

  const notifIcon = (type) => {
    const icons = { payment: '💰', debt: '📋', overdue: '⚠️', admin: '🛡️', system: '🔔' };
    return icons[type] || '🔔';
  };

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Hozir';
    if (mins < 60) return `${mins} daqiqa oldin`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} soat oldin`;
    return `${Math.floor(hrs / 24)} kun oldin`;
  };

  const clients = db?.clients || [];
  const searchMatches = (localSearch && localSearch.trim().length > 0)
    ? clients.filter(c =>
        c.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        (c.phone || '').includes(localSearch)
      ).slice(0, 5)
    : [];

  return (
    <header className="topbar">
      {/* Mobile Hamburger Menu Button */}
      <button className="mobile-menu-btn" onClick={onOpenMenu} title="Menyu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <h1>{PAGE_TITLES[currentPage] || ''}</h1>

      {/* Debounced Search with Instant Dropdown */}
      <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
        <div className="search-box" style={{ maxWidth: '100%' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Mijozni qidirish (ism yoki telefon)..."
            value={localSearch}
            onChange={handleSearchChange}
          />
          {localSearch && (
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '12px' }}
              onClick={() => {
                setLocalSearch('');
                setSearchQuery('');
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Live Search Autocomplete Popup */}
        {searchMatches.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            zIndex: 100,
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', padding: '4px 8px', fontWeight: 600 }}>
              Mijozlar natijalari ({searchMatches.length}):
            </div>
            {searchMatches.map(c => {
              const b = clientBalance(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    navigate('clientDetail', c.id);
                    setLocalSearch('');
                    setSearchQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: 'var(--surface-2)',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--gold)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <b style={{ fontSize: '13px', color: 'var(--ink)' }}>{c.name}</b>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{c.phone || "Telefon yo'q"}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: b > 0 ? 'var(--rust)' : (b < 0 ? 'var(--teal)' : 'var(--muted)') }}>
                      {b === 0 ? "Qarz yo'q" : `${b.toLocaleString()} ${db?.currency || "so'm"}`}
                    </div>
                    {c.category && <span style={{ fontSize: '10px', color: 'var(--gold)' }}>{c.category}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="spacer" />

      {/* Live USD Rate Indicator */}
      <div
        className="topbar-rate-indicator desktop-only-flex"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--surface-2)',
          padding: '6px 12px',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--ink)'
        }}
        title="Markaziy Bank / Bozor kursi"
      >
        <span style={{ color: 'var(--gold)' }}>$</span>
        <span>1 USD = {Number(db?.exchangeRate || 12850).toLocaleString()} so'm</span>
      </div>

      {/* Active Branch Selector */}
      {branches.length > 1 && (
        <div className="topbar-branch-selector desktop-only" style={{ position: 'relative' }}>
          <button
            className="btn btn-sm btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
            onClick={() => setShowBranchDrop(!showBranchDrop)}
          >
            <span>🏪</span>
            <b>{currentBranch?.name || 'Filial'}</b>
            <span style={{ fontSize: '10px' }}>▼</span>
          </button>

          {showBranchDrop && (
            <>
              <div className="notif-backdrop" onClick={() => setShowBranchDrop(false)} />
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  minWidth: '200px',
                  zIndex: 100,
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  SAVDO FILIALINI TANLANG
                </div>
                {branches.map(b => (
                  <div
                    key={b.id}
                    style={{
                      padding: '10px 12px',
                      fontSize: '12.5px',
                      fontWeight: b.id === currentBranchId ? 800 : 500,
                      color: b.id === currentBranchId ? 'var(--gold)' : 'var(--ink)',
                      background: b.id === currentBranchId ? 'var(--surface-2)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => {
                      switchBranch(b.id);
                      setShowBranchDrop(false);
                    }}
                  >
                    <span>{b.name}</span>
                    {b.id === currentBranchId && <span>✓</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <span className="version-badge topbar-version desktop-only">{APP_VERSION}</span>

      {/* Notification Bell */}
      <div style={{ position: 'relative' }}>
        <button
          className="icon-btn"
          title="Bildirishnomalar"
          onClick={() => setShowNotifDrop(!showNotifDrop)}
          style={{ position: 'relative' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="notif-count-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {showNotifDrop && (
          <>
            <div className="notif-backdrop" onClick={() => setShowNotifDrop(false)} />
            <div className="notif-dropdown">
              <div className="notif-dropdown-head">
                <b>Bildirishnomalar</b>
                {(notifications || []).length > 0 && (
                  <button
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    onClick={() => { markAllNotificationsRead(); }}
                  >
                    Barchasini o'qish
                  </button>
                )}
              </div>
              <div className="notif-dropdown-body">
                {(!notifications || notifications.length === 0) ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                    🔕 Hech qanday bildirishnoma yo'q
                  </div>
                ) : (
                  notifications.slice(0, 20).map(n => (
                    <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                      <span className="notif-icon">{notifIcon(n.type)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="notif-msg">{n.message}</div>
                        <div className="notif-time">{timeAgo(n.timestamp)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <button className="icon-btn" title="Tema" onClick={toggleTheme}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </button>

      <button className="btn btn-gold topbar-add-btn" onClick={onOpenAddClient}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="topbar-add-text">Mijoz qo'shish</span>
      </button>
    </header>
  );
}
