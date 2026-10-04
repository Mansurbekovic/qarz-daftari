import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { fmtMoney, todayISO } from '../../utils/helpers';

export default function TransactionModal({ clientId, defaultType = 'debt', onClose }) {
  const { db, addTransaction, clientBalance } = useApp();
  const toast = useToast();

  const c = db.clients.find(cl => cl.id === clientId);
  const iowe = c && c.relation === 'i_owe';

  const [type, setType] = useState(defaultType); // 'debt' | 'payment'
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');

  if (!c) return null;

  const currentBal = clientBalance(c.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) {
      toast('Summani to\'g\'ri kiriting', 'error');
      return;
    }

    addTransaction({
      clientId: c.id,
      type,
      amount: num,
      date,
      note: note.trim() || (type === 'debt' ? 'Qarz' : 'To\'lov'),
    });

    toast(type === 'debt' ? 'Qarz yozildi' : 'To\'lov qabul qilindi');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-head">
          <div>
            <h3 style={{ margin: 0, fontSize: '17px' }}>{c.name}</h3>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
              Joriy qarz: <b>{fmtMoney(Math.abs(currentBal), db?.currency || "so'm")}</b>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Amal turi */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setType('debt')}
              style={{
                flex: 1,
                padding: '11px 8px',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: type === 'debt' ? '#E04836' : 'var(--border)',
                background: type === 'debt' ? 'rgba(224, 72, 54, 0.15)' : 'var(--surface-2)',
                color: type === 'debt' ? '#E04836' : 'var(--ink)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {iowe ? '+ Qarz oldim' : '+ Qarz berdim'}
            </button>
            <button
              type="button"
              onClick={() => setType('payment')}
              style={{
                flex: 1,
                padding: '11px 8px',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: type === 'payment' ? '#1F6E5C' : 'var(--border)',
                background: type === 'payment' ? 'rgba(31, 110, 92, 0.15)' : 'var(--surface-2)',
                color: type === 'payment' ? '#1F6E5C' : 'var(--ink)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {iowe ? '- Qarzni qaytardim' : "- To'lov oldim"}
            </button>
          </div>

          {/* Summa */}
          <div className="form-field" style={{ margin: 0 }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
              Summa ({db?.currency || "so'm"}) *
            </label>
            <input
              type="number"
              min="1"
              step="any"
              placeholder="Masalan: 50000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              autoFocus
              style={{
                padding: '12px 14px',
                fontSize: '18px',
                fontWeight: 800,
                borderRadius: '10px',
                color: type === 'debt' ? '#E04836' : '#1F6E5C'
              }}
            />
          </div>

          {/* Sana */}
          <div className="form-field" style={{ margin: 0 }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
              Sana
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ padding: '11px 13px', fontSize: '14px', borderRadius: '10px' }}
            />
          </div>

          {/* Izoh */}
          <div className="form-field" style={{ margin: 0 }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
              Izoh / Sababi (ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="Masalan: Go'sht uchun, qisman qaytardi..."
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ padding: '11px 13px', fontSize: '14px', borderRadius: '10px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: 1, minHeight: '44px' }}
              onClick={onClose}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="btn btn-gold"
              style={{ flex: 1.5, minHeight: '44px', fontWeight: 800 }}
            >
              ✓ Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
