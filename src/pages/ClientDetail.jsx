import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, fmtDate, initials, todayISO } from '../utils/helpers';

export default function ClientDetail({ onOpenTxModal, onOpenEditClient }) {
  const { db, currentClientId, navigate, clientBalance, clientTransactions, clientIsOverdue, deleteTransaction, deleteClient } = useApp();
  const toast = useToast();
  const [txToDelete, setTxToDelete] = useState(null);
  const [showDelClientModal, setShowDelClientModal] = useState(false);

  const c = db.clients.find(item => item.id === currentClientId);

  if (!c) {
    return (
      <div>
        <button className="btn btn-outline btn-sm" style={{ marginBottom: '18px' }} onClick={() => navigate('clients')}>
          ← Mijozlar ro'yxatiga qaytish
        </button>
        <div className="empty-state">
          <div className="t">Mijoz topilmadi</div>
        </div>
      </div>
    );
  }

  const bal = clientBalance(c.id);
  const txs = clientTransactions(c.id);
  const overdue = clientIsOverdue(c.id);
  const iowe = c.relation === 'i_owe';

  const txLabel = (tx) => {
    if (tx.type === 'debt') return iowe ? 'Qarz oldim' : 'Qarz berdim';
    return iowe ? 'Qarzni qaytardim' : "To'lov qabul qildim";
  };

  const handleDeleteClient = () => {
    deleteClient(c.id);
    setShowDelClientModal(false);
    toast("Mijoz o'chirildi");
    navigate('clients');
  };

  const handleDeleteTx = () => {
    if (txToDelete) {
      deleteTransaction(txToDelete);
      setTxToDelete(null);
      toast("O'chirildi");
    }
  };

  return (
    <div>
      <button className="btn btn-outline btn-sm" style={{ marginBottom: '18px' }} onClick={() => navigate('clients')}>
        ← Mijozlar ro'yxatiga qaytish
      </button>

      <div className="detail-head">
        <div className="detail-avatar">{initials(c.name)}</div>
        <div style={{ flex: 1 }}>
          <div className="detail-name">{c.name}</div>
          <div className="detail-meta">{c.phone || "Telefon kiritilmagan"} {c.address ? ` · ${c.address}` : ""}</div>
          {overdue && <div className="badge overdue" style={{ marginTop: '8px' }}>⚠ Muddati o'tgan qarz mavjud</div>}
          {iowe && <div className="badge iowe" style={{ marginTop: '8px' }}>Men unga qarzdorman</div>}
          {c.note && <div className="detail-meta" style={{ marginTop: '8px' }}>📝 {c.note}</div>}
        </div>
        <div className="balance-box">
          <div className="client-balance-label">
            {iowe ? "Men unga qarzdorman" : (bal >= 0 ? "U menga qarzdor" : "Ortiqcha to'lov")}
          </div>
          <div className="v" style={{ color: bal === 0 ? 'var(--ink)' : (iowe ? 'var(--teal)' : 'var(--rust)') }}>
            {fmtMoney(Math.abs(bal), db.currency)}
          </div>
        </div>
      </div>

      <div className="action-hint">
        {iowe ? (
          <>Bu mijoz — <b>siz undan qarz olgan yoki olasiz</b> shaxs (masalan ta'minotchi). "Qarz oldim" tugmasi sizning qarzingizni oshiradi, "Qarz qaytardim" esa uni kamaytiradi.</>
        ) : (
          <>Bu mijoz — <b>sizdan qarz olgan</b> shaxs (masalan do'kon mijozi). "Qarz berish" tugmasi uning qarzini oshiradi, "To'lov qabul qilish" esa uni kamaytiradi.</>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', flexWrap: 'wrap' }}>
        <button className="btn btn-danger" onClick={() => onOpenTxModal(c.id, 'debt')}>
          {iowe ? "+ Qarz oldim" : "+ Qarz berish"}
        </button>
        <button className="btn btn-gold" onClick={() => onOpenTxModal(c.id, 'payment')}>
          {iowe ? "+ Qarz qaytarish" : "+ To'lov qabul qilish"}
        </button>
        <button className="btn btn-outline" onClick={() => onOpenEditClient(c.id)}>
          Ma'lumotni tahrirlash
        </button>
        <button
          className="btn btn-outline"
          style={{ color: 'var(--rust)', borderColor: 'var(--rust-soft)' }}
          onClick={() => setShowDelClientModal(true)}
        >
          O'chirish
        </button>
      </div>

      <div className="section-title">Tranzaksiyalar tarixi</div>

      {txs.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10M7 12h10M7 16h6" />
          </svg>
          <div className="t">Hali tranzaksiya yo'q</div>
          <div className="s">Yuqoridagi tugmalar orqali birinchi qarz yoki to'lovni kiriting.</div>
        </div>
      ) : (
        <div className="ledger-card">
          {txs.map(tx => {
            const isOverdueTx = tx.type === 'debt' && tx.dueDate && tx.dueDate < todayISO() && bal > 0;
            const card = tx.cardId ? db.cards.find(cd => cd.id === tx.cardId) : null;

            return (
              <div key={tx.id} className={`ledger-row type-${tx.type}`}>
                <div
                  className="avatar"
                  style={{
                    background: tx.type === 'debt' ? 'var(--rust-soft)' : 'var(--gold-soft)',
                    color: tx.type === 'debt' ? 'var(--rust)' : 'var(--gold)',
                  }}
                >
                  {tx.type === 'debt' ? '↑' : '↓'}
                </div>
                <div className="row-main">
                  <div className="row-title">{txLabel(tx)}</div>
                  <div className="row-sub">
                    {fmtDate(tx.date)}
                    {tx.dueDate ? ` · Muddat: ${fmtDate(tx.dueDate)}${isOverdueTx ? ' ⚠' : ''}` : ''}
                    {tx.note ? ` · ${tx.note}` : ''}
                    {card ? ` · 💳 ${card.bank} •${card.last4}` : ''}
                  </div>
                </div>
                <div className={`row-amount ${tx.type === 'debt' ? 'rust' : 'gold'}`}>
                  {tx.type === 'debt' ? '+' : '−'}{fmtMoney(tx.amount, db.currency)}
                </div>
                <button
                  className="icon-btn"
                  style={{ width: '30px', height: '30px', flexShrink: 0 }}
                  onClick={() => setTxToDelete(tx.id)}
                  title="O'chirish"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Tx Modal */}
      {txToDelete && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>Tranzaksiyani o'chirish</h3>
              <button className="modal-close" onClick={() => setTxToDelete(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>Ushbu yozuvni o'chirishni xohlaysizmi?</p>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setTxToDelete(null)}>Bekor qilish</button>
                <button className="btn btn-danger" onClick={handleDeleteTx}>O'chirish</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Client Modal */}
      {showDelClientModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>Mijozni o'chirish</h3>
              <button className="modal-close" onClick={() => setShowDelClientModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>
                <b>{c.name}</b> va unga tegishli barcha tranzaksiyalar o'chiriladi. Bu amalni bekor qilib bo'lmaydi.
              </p>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowDelClientModal(false)}>Bekor qilish</button>
                <button className="btn btn-danger" onClick={handleDeleteClient}>O'chirish</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
