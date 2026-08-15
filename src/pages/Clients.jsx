import React from 'react';
import { useApp } from '../contexts/AppContext';
import { fmtMoney, initials } from '../utils/helpers';

export default function Clients({ onOpenAddClient }) {
  const { db, searchQuery, clientFilter, setClientFilter, navigate, clientBalance, clientIsOverdue } = useApp();

  let list = db.clients.slice();
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(c => (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q));
  }
  if (clientFilter === 'owed') list = list.filter(c => c.relation !== 'i_owe' && clientBalance(c.id) > 0);
  if (clientFilter === 'iowe') list = list.filter(c => c.relation === 'i_owe' && clientBalance(c.id) > 0);
  if (clientFilter === 'overdue') list = list.filter(c => clientIsOverdue(c.id));
  list.sort((a, b) => clientBalance(b.id) - clientBalance(a.id));

  return (
    <div>
      <div className="client-toolbar">
        <div className="chip-group">
          <button
            className={`chip ${clientFilter === 'all' ? 'active' : ''}`}
            onClick={() => setClientFilter('all')}
          >
            Barchasi ({db.clients.length})
          </button>
          <button
            className={`chip ${clientFilter === 'owed' ? 'active' : ''}`}
            onClick={() => setClientFilter('owed')}
          >
            Menga qarzdor
          </button>
          <button
            className={`chip ${clientFilter === 'iowe' ? 'active' : ''}`}
            onClick={() => setClientFilter('iowe')}
          >
            Men qarzdorman
          </button>
          <button
            className={`chip ${clientFilter === 'overdue' ? 'active' : ''}`}
            onClick={() => setClientFilter('overdue')}
          >
            Muddati o'tgan
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10M7 12h10M7 16h6" />
          </svg>
          <div className="t">Mijoz topilmadi</div>
          <div className="s">Yangi mijoz qo'shish uchun yuqoridagi "Mijoz qo'shish" tugmasini bosing.</div>
        </div>
      ) : (
        <div className="client-grid">
          {list.map(c => {
            const bal = clientBalance(c.id);
            const overdue = clientIsOverdue(c.id);
            const iowe = c.relation === 'i_owe';

            return (
              <button
                key={c.id}
                type="button"
                className="client-card"
                onClick={() => navigate('clientDetail', c.id)}
              >
                <div className="client-card-top">
                  <div className="avatar">{initials(c.name)}</div>
                  <div>
                    <div className="client-name">{c.name}</div>
                    <div className="client-phone">{c.phone || "Telefon yo'q"}</div>
                  </div>
                </div>
                <div className="client-balance-label">
                  {iowe ? "Men unga qarzdorman" : (bal >= 0 ? "U menga qarzdor" : "Ortiqcha to'lov")}
                </div>
                <div
                  className="client-balance"
                  style={{ color: bal === 0 ? 'var(--muted)' : (iowe ? 'var(--teal)' : 'var(--rust)') }}
                >
                  {fmtMoney(Math.abs(bal), db.currency)}
                </div>
                {overdue ? (
                  <div className="badge overdue">⚠ Muddati o'tgan</div>
                ) : iowe ? (
                  <div className="badge iowe">Men qarzdorman</div>
                ) : bal === 0 ? (
                  <div className="badge clean">✓ Toza hisob</div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
