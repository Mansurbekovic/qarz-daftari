import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import {
  fmtMoney, fmtDate, initials, todayISO,
  telegramReminderLink, smsReminderText, whatsappReminderLink,
  calculateClientScore, exportToCSV
} from '../utils/helpers';
import ReceiptModal from '../components/modals/ReceiptModal';

export default function ClientDetail({ onOpenTxModal, onOpenEditClient }) {
  const { db, currentClientId, navigate, clientBalance, clientTransactions, clientIsOverdue, deleteTransaction, deleteClient, updateDB } = useApp();
  const toast = useToast();

  const [txToDelete, setTxToDelete] = useState(null);
  const [showDelClientModal, setShowDelClientModal] = useState(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState(null);
  const [expandedTxId, setExpandedTxId] = useState(null);

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
  const score = calculateClientScore(c, db.transactions);

  const txLabel = (tx) => {
    if (tx.type === 'debt') return iowe ? 'Qarz oldim' : 'Nasiya berdim';
    return iowe ? 'Qarzni qaytardim' : "To'lov qabul qildim";
  };

  const handleSendTelegramReminder = () => {
    if (bal <= 0) {
      toast('Qarzdorlik yo\'q', 'info');
      return;
    }
    const card = db.cards && db.cards[0] ? `${db.cards[0].bank} •${db.cards[0].last4}` : '';
    const text = `Assalomu alaykum ${c.name}! ${db.businessName || 'Qarz Daftari'}dan: Sizda ${fmtMoney(Math.abs(bal), db.currency)} qarz mavjud.${card ? ` To'lov uchun karta: ${card}` : ''} Iltimos, to'lovni amalga oshiring.`;
    const link = `https://t.me/share/url?url=${encodeURIComponent(db.businessName || 'Qarz Daftari')}&text=${encodeURIComponent(text)}`;
    window.open(link, '_blank');
  };

  const handleSendWhatsappReminder = () => {
    if (bal <= 0) {
      toast('Qarzdorlik yo\'q', 'info');
      return;
    }
    const link = whatsappReminderLink(c.phone, c.name, Math.abs(bal), db.currency, db.businessName);
    window.open(link, '_blank');
  };

  const handleCopySmsReminder = () => {
    if (bal <= 0) {
      toast('Qarzdorlik yo\'q', 'info');
      return;
    }
    const text = smsReminderText(c.name, Math.abs(bal), db.currency);
    navigator.clipboard.writeText(text);
    toast('SMS eslatma matni nusxalandi');
  };

  const handleExportClientCsv = () => {
    const headers = ['Sana', 'Tranzaksiya turi', 'Summa', 'To\'lov muddati', 'Mahsulotlar soni', 'Izoh'];
    const rows = txs.map(t => [
      t.date,
      txLabel(t),
      t.amount,
      t.dueDate || '—',
      t.items ? t.items.length : 0,
      t.note || '—'
    ]);
    exportToCSV(headers, rows, `qarz-hisobot-${c.name}-${todayISO()}.csv`);
    toast('Mijoz hisoboti Excel (CSV) formatida yuklab olindi');
  };

  // Mark an installment as paid
  const handleToggleInstallmentPaid = (txId, installmentId) => {
    updateDB(prev => {
      const updatedTxs = prev.transactions.map(t => {
        if (t.id !== txId || !t.installments) return t;
        const updatedInst = t.installments.map(inst => {
          if (inst.id !== installmentId) return inst;
          return {
            ...inst,
            paid: !inst.paid,
            paidDate: !inst.paid ? todayISO() : null,
          };
        });
        return { ...t, installments: updatedInst };
      });
      return { ...prev, transactions: updatedTxs };
    });
    toast('To\'lov holati yangilandi');
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
      toast("Tranzaksiya o'chirildi");
    }
  };

  // Find all active installment plans
  const installmentTxs = txs.filter(t => t.installments && t.installments.length > 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('clients')}>
          ← Mijozlar ro'yxatiga qaytish
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportClientCsv}>
            📊 Excelga eksport
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => onOpenEditClient(c.id)}>
            ✏️ Tahrirlash
          </button>
        </div>
      </div>

      {/* Main Client Profile Header */}
      <div className="detail-head">
        <div className="detail-avatar">{initials(c.name)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span className="detail-name">{c.name}</span>
            {c.category && (
              <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--gold)', border: '1px solid var(--border)' }}>
                🏷️ {c.category}
              </span>
            )}
            <span className={`badge ${score.color}`} title="Mijoz ishonchliligi">
              {'⭐'.repeat(score.stars)} {score.label}
            </span>
          </div>

          <div className="detail-meta" style={{ marginTop: '6px' }}>
            {c.phone ? (
              <a href={`tel:${c.phone}`} style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>
                📞 {c.phone}
              </a>
            ) : "Telefon kiritilmagan"}
            {c.address ? ` · 📍 ${c.address}` : ""}
            {c.passport ? ` · 🪪 Pasport: ${c.passport}` : ""}
          </div>

          {c.creditLimit && (
            <div style={{ marginTop: '8px', fontSize: '12.5px' }}>
              <span>Kredit limiti: <b>{fmtMoney(c.creditLimit, db.currency)}</b></span>
              {bal > c.creditLimit && (
                <span className="badge overdue" style={{ marginLeft: '8px' }}>
                  ⚠ Limitdan {fmtMoney(bal - c.creditLimit, db.currency)} oshgan!
                </span>
              )}
            </div>
          )}

          {overdue && <div className="badge overdue" style={{ marginTop: '8px' }}>⚠ Muddati o'tgan qarz mavjud</div>}
          {iowe && <div className="badge iowe" style={{ marginTop: '8px' }}>Men unga qarzdorman</div>}
          {c.note && <div className="detail-meta" style={{ marginTop: '6px' }}>📝 {c.note}</div>}
        </div>

        <div className="balance-box">
          <div className="client-balance-label">
            {iowe ? "Men unga qarzdorman" : (bal >= 0 ? "Joriy qarz balansi" : "Ortiqcha to'lov")}
          </div>
          <div className="v" style={{ color: bal === 0 ? 'var(--ink)' : (iowe ? 'var(--teal)' : 'var(--rust)') }}>
            {fmtMoney(Math.abs(bal), db.currency)}
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', flexWrap: 'wrap' }}>
        <button className="btn btn-danger" onClick={() => onOpenTxModal(c.id, 'debt')}>
          {iowe ? "+ Qarz oldim" : "+ Nasiya / Qarz berish"}
        </button>
        <button className="btn btn-gold" onClick={() => onOpenTxModal(c.id, 'payment')}>
          {iowe ? "+ Qarz qaytarish" : "+ To'lov qabul qilish"}
        </button>
        {!iowe && bal > 0 && (
          <>
            <button className="btn btn-teal" onClick={handleSendTelegramReminder}>
              ✈️ Telegram Eslatma
            </button>
            {c.phone && (
              <button className="btn btn-outline" onClick={handleSendWhatsappReminder}>
                💬 WhatsApp
              </button>
            )}
            <button className="btn btn-outline" onClick={handleCopySmsReminder}>
              ✉️ SMS nusxa
            </button>
          </>
        )}
        <button
          className="btn btn-outline"
          style={{ color: 'var(--rust)', borderColor: 'var(--rust-soft)', marginLeft: 'auto' }}
          onClick={() => setShowDelClientModal(true)}
        >
          Mijozni o'chirish
        </button>
      </div>

      {/* Active Installment / Rastrochka Schedules */}
      {installmentTxs.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-title">📅 Muddatli To'lov / Bo'lib To'lash Rejasi (Rastrochka)</div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {installmentTxs.map(tx => (
              <div key={tx.id} className="stat-card" style={{ padding: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <b>Xarid: {fmtMoney(tx.amount, db.currency)} ({fmtDate(tx.date)})</b>
                  <span style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700 }}>
                    {tx.installments.filter(i => i.paid).length} / {tx.installments.length} to'langan
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {tx.installments.map(inst => (
                    <div
                      key={inst.id}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: inst.paid ? 'rgba(31,110,92,0.1)' : (inst.dueDate < todayISO() ? 'rgba(139,58,43,0.1)' : 'var(--surface-2)'),
                        border: inst.paid ? '1px solid var(--teal)' : (inst.dueDate < todayISO() ? '1px solid var(--rust)' : '1px solid var(--border)'),
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>{inst.month}-oy to'lovi:</span>
                        <b>{fmtMoney(inst.amount, db.currency)}</b>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        Muddat: {fmtDate(inst.dueDate)} {inst.dueDate < todayISO() && !inst.paid ? '⚠ Kechikyapti' : ''}
                      </div>
                      <button
                        className={`btn btn-sm ${inst.paid ? 'btn-teal' : 'btn-outline'}`}
                        style={{ marginTop: '6px', fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => handleToggleInstallmentPaid(tx.id, inst.id)}
                      >
                        {inst.paid ? '✓ To\'langan' : 'To\'landi deb belgilash'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions History */}
      <div className="section-title">Tranzaksiyalar & Xaridlar tarixi</div>

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
            const hasItems = tx.items && tx.items.length > 0;
            const isExpanded = expandedTxId === tx.id;

            return (
              <div key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <div className={`ledger-row type-${tx.type}`} style={{ borderBottom: 'none' }}>
                  <div
                    className="avatar"
                    style={{
                      background: tx.type === 'debt' ? 'var(--rust-soft)' : 'var(--gold-soft)',
                      color: tx.type === 'debt' ? 'var(--rust)' : 'var(--gold)',
                    }}
                  >
                    {tx.type === 'debt' ? '🛍️' : '💳'}
                  </div>

                  <div className="row-main">
                    <div className="row-title">
                      {txLabel(tx)}
                      {hasItems && (
                        <span className="badge" style={{ marginLeft: '8px', fontSize: '11px', background: 'var(--surface-2)' }}>
                          📦 {tx.items.length} xil mahsulot
                        </span>
                      )}
                    </div>
                    <div className="row-sub">
                      {fmtDate(tx.date)}
                      {tx.dueDate ? ` · Muddat: ${fmtDate(tx.dueDate)}${isOverdueTx ? ' ⚠' : ''}` : ''}
                      {tx.paymentMethod ? ` · ${tx.paymentMethod === 'card' ? 'Plastik karta' : tx.paymentMethod === 'payme' ? 'Payme' : tx.paymentMethod === 'click' ? 'Click' : 'Naqd pul'}` : ''}
                      {tx.note ? ` · ${tx.note}` : ''}
                    </div>
                  </div>

                  <div className={`row-amount ${tx.type === 'debt' ? 'rust' : 'gold'}`}>
                    {tx.type === 'debt' ? '+' : '−'}{fmtMoney(tx.amount, db.currency)}
                  </div>

                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ padding: '5px 8px', fontSize: '12px' }}
                      onClick={() => setSelectedTxForReceipt(tx)}
                      title="Chek chiqarish"
                    >
                      🧾 Chek
                    </button>

                    {hasItems && (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ padding: '5px 8px', fontSize: '12px' }}
                        onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                      >
                        {isExpanded ? '▲ Yashirish' : '▼ Mahsulotlar'}
                      </button>
                    )}

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
                </div>

                {/* Expanded Items List */}
                {hasItems && isExpanded && (
                  <div style={{ padding: '0 20px 14px 60px', background: 'var(--surface-2)' }}>
                    <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ color: 'var(--muted)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '4px 0' }}>Mahsulot</th>
                          <th style={{ padding: '4px 0' }}>Soni</th>
                          <th style={{ padding: '4px 0' }}>Narxi</th>
                          <th style={{ padding: '4px 0', textAlign: 'right' }}>Jami</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tx.items.map((it, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            <td style={{ padding: '6px 0', fontWeight: 600 }}>{it.name}</td>
                            <td style={{ padding: '6px 0' }}>{it.qty} {it.unit}</td>
                            <td style={{ padding: '6px 0' }}>{fmtMoney(it.price, '')}</td>
                            <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700 }}>{fmtMoney(it.total, db.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt Modal */}
      {selectedTxForReceipt && (
        <ReceiptModal
          client={c}
          transaction={selectedTxForReceipt}
          onClose={() => setSelectedTxForReceipt(null)}
        />
      )}

      {/* Delete Tx Modal */}
      {txToDelete && (
        <div className="modal-backdrop" onClick={() => setTxToDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
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
        <div className="modal-backdrop" onClick={() => setShowDelClientModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
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
