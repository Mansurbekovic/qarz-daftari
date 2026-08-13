import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { PAGE_TITLES, APP_VERSION } from '../../utils/constants';

export default function Topbar({ onOpenAddClient }) {
  const { currentPage, searchQuery, setSearchQuery, toggleTheme, navigate, notifications, markAllNotificationsRead } = useApp();
  const [showNotifDrop, setShowNotifDrop] = useState(false);

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q && currentPage !== 'clients' && currentPage !== 'transactions') {
      navigate('clients');
    }
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

  return (
    <header className="topbar">
      <h1>{PAGE_TITLES[currentPage] || ''}</h1>

      <div className="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Mijoz ismi yoki telefon raqami..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="spacer" />

      <span className="version-badge topbar-version">{APP_VERSION}</span>

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

      <button className="btn btn-gold" onClick={onOpenAddClient}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Mijoz qo'shish
      </button>
    </header>
  );
}

