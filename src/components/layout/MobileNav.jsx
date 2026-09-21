import React from 'react';
import { useApp } from '../../contexts/AppContext';

export default function MobileNav({ onOpenMenu }) {
  const { currentPage, navigate, totals, db } = useApp();
  const t = totals();
  const unreadMsgCount = (db?.messages || []).filter(m => m.sender !== 'me' && !m.read).length;
  const pendingRequestsCount = (db?.debtRequests || []).filter(r => r.status === 'pending').length;

  const tabs = [
    {
      id: 'dashboard',
      label: 'Asosiy',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v10h14V10" />
        </svg>
      )
    },
    {
      id: 'clients',
      label: 'Mijozlar',
      badge: t.overdueCount > 0 ? t.overdueCount : null,
      badgeColor: '#E04836',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="9" cy="8" r="3.2" />
          <path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" />
          <circle cx="17.5" cy="8.5" r="2.4" />
        </svg>
      )
    },
    {
      id: 'messages',
      label: 'SMS & Chat',
      badge: unreadMsgCount > 0 ? unreadMsgCount : null,
      badgeColor: 'var(--gold)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="8" y1="9" x2="16" y2="9" />
          <line x1="8" y1="13" x2="14" y2="13" />
        </svg>
      )
    },
    {
      id: 'debtRequests',
      label: 'Qarz so\'rash',
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
      badgeColor: '#1F6E5C',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    {
      id: 'menu',
      label: 'Menyu',
      isMenuToggle: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      )
    }
  ];

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map(tab => {
        const isActive = currentPage === tab.id;

        return (
          <button
            key={tab.id}
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (tab.isMenuToggle) {
                onOpenMenu();
              } else {
                navigate(tab.id);
              }
            }}
          >
            <div className="mobile-nav-icon-wrap">
              {tab.icon}
              {tab.badge && (
                <span className="mobile-nav-badge" style={{ background: tab.badgeColor || 'var(--gold)' }}>
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="mobile-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
