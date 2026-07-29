import React from 'react';
import { useApp } from '../contexts/AppContext';
import { fmtMoney, fmtDate, initials } from '../utils/helpers';

export default function Transactions() {
  const { db, searchQuery, navigate } = useApp();

  let txs = [...db.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    txs = txs.filter(tx => {
      const c = db.clients.find(cl => cl.id === tx.clientId);
      return (c && c.name.toLowerCase().includes(q)) || (tx.note || '').toLowerCase().includes(q);
    });
  }

  const txLabel = (tx, client) => {
    const iowe = client && client.relation === 'i_owe';
    if (tx.type === 'debt') return iowe ? 'Qarz oldim' : 'Qarz berdim';
    return iowe ? 'Qarzni qaytardim' : "To'lov qabul qildim";
  };

  return (
    <div>
      {txs.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10M7 12h10M7 16h6" />
          </svg>
          <div className="t">Tranzaksiya topilmadi</div>
          <div className="s">Mijoz sahifasidan qarz yoki to'lov qo'shing.</div>
        </div>
      ) : (
        <div className="ledger-card">
          {txs.map(tx => {
            const c = db.clients.find(cl => cl.id === tx.clientId);
            return (
              <div
                key={tx.id}
                className={`ledger-row type-${tx.type}`}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('clientDetail', tx.clientId)}
              >
                <div className="avatar">{c ? initials(c.name) : '?'}</div>
                <div className="row-main">
                  <div className="row-title">{c ? c.name : "O'chirilgan mijoz"}</div>
                  <div className="row-sub">
                    {txLabel(tx, c)} · {fmtDate(tx.date)}{tx.note ? ` · ${tx.note}` : ''}
                  </div>
                </div>
                <div className={`row-amount ${tx.type === 'debt' ? 'rust' : 'gold'}`}>
                  {tx.type === 'debt' ? '+' : '−'}{fmtMoney(tx.amount, db.currency)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
