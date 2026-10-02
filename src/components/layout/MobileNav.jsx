import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function MobileNav({ onOpenMenu, onOpenAddClient, onOpenQuickAction }) {
  const { currentPage, navigate, totals, db } = useApp();
  const t = totals();
  const unreadMsgCount = (db?.messages || []).filter(m => m.sender !== 'me' && !m.read).length;
  const pendingRequestsCount = (db?.debtRequests || []).filter(r => r.status === 'pending').length;

  return (
    <>
      <nav className="mobile-bottom-nav">
        {/* 1. Asosiy */}
        <button
          className={`mobile-nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => navigate('dashboard')}
          aria-label="Asosiy"
        >
          <div className="mobile-nav-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 11.5 12 4l9 7.5" />
              <path d="M5 10v10h14V10" />
            </svg>
          </div>
          <span className="mobile-nav-label">Asosiy</span>
        </button>

        {/* 2. Mijozlar */}
        <button
          className={`mobile-nav-btn ${currentPage === 'clients' ? 'active' : ''}`}
          onClick={() => navigate('clients')}
          aria-label="Mijozlar"
        >
          <div className="mobile-nav-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="9" cy="8" r="3.2" />
              <path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" />
              <circle cx="17.5" cy="8.5" r="2.4" />
            </svg>
            {t.overdueCount > 0 && (
              <span className="mobile-nav-badge" style={{ background: '#E04836' }}>
                {t.overdueCount}
              </span>
            )}
          </div>
          <span className="mobile-nav-label">Mijozlar</span>
        </button>

        {/* 3. Markaziy Bo'rtib Turgan Qo'shish Tugmasi (Floating Action Button) */}
        <div className="mobile-nav-fab-container">
          <button
            className="mobile-nav-fab-btn"
            onClick={onOpenAddClient}
            title="Yangi Mijoz Qo'shish"
            aria-label="Yangi Mijoz Qo'shish"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span className="mobile-nav-fab-label">Qo'shish</span>
        </div>

        {/* 4. Xabarlar / Eslatma */}
        <button
          className={`mobile-nav-btn ${currentPage === 'messages' ? 'active' : ''}`}
          onClick={() => navigate('messages')}
          aria-label="SMS & Chat"
        >
          <div className="mobile-nav-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="8" y1="13" x2="14" y2="13" />
            </svg>
            {unreadMsgCount > 0 && (
              <span className="mobile-nav-badge" style={{ background: 'var(--gold)' }}>
                {unreadMsgCount}
              </span>
            )}
          </div>
          <span className="mobile-nav-label">Xabarlar</span>
        </button>

        {/* 5. Menyu (Barcha xizmatlar) */}
        <button
          className="mobile-nav-btn"
          onClick={onOpenMenu}
          aria-label="Menyu"
        >
          <div className="mobile-nav-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
            {pendingRequestsCount > 0 && (
              <span className="mobile-nav-badge" style={{ background: '#1F6E5C' }}>
                {pendingRequestsCount}
              </span>
            )}
          </div>
          <span className="mobile-nav-label">Bo'limlar</span>
        </button>
      </nav>
    </>
  );
}
