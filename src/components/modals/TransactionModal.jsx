import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { fmtMoney, parseMoneyValue, todayISO } from '../../utils/helpers';

export default function TransactionModal({ clientId, defaultType = 'debt', onClose }) {
  const { db, addTransaction } = useApp();
  const toast = useToast();

  const c = db.clients.find(cl => cl.id === clientId);
  const iowe = c && c.relation === 'i_owe';

  const [selType, setSelType] = useState(defaultType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [cardId, setCardId] = useState('');

  if (!c) return null;

  const debtLabel = iowe ? 'Qarz oldim' : 'Qarz berdim';
  const paymentLabel = iowe ? 'Qarz qaytardim' : "To'lov oldim";

  const handleSave = (e) => {
    e.preventDefault();
    const numAmount = parseMoneyValue(amount);
    if (!numAmount || numAmount <= 0) {
      toast("To'g'ri summa kiriting", 'error');
      return;
    }

    if (cardId) {
      const card = db.cards.find(cd => cd.id === cardId);
      const outflow = (selType === 'debt' && !iowe) || (selType === 'payment' && iowe);
      if (outflow && card && numAmount > card.balance) {
        toast('Tanlangan kartada yetarli mablag\' yo\'q', 'error');
        return;
      }
    }

    addTransaction({
      clientId,
      type: selType,
      amount: numAmount,
      date: date || todayISO(),
      dueDate: selType === 'debt' ? (dueDate || null) : null,
      note: note.trim(),
      cardId: cardId || null,
    });

    toast(selType === 'debt' ? (iowe ? 'Qarz qayd etildi' : 'Qarz qo\'shildi') : (iowe ? 'Qaytarish qayd etildi' : 'To\'lov qayd etildi'));
    onClose();
  };

  const previewAmount = parseMoneyValue(amount) || 0;
  const verb = selType === 'debt' ? debtLabel : paymentLabel;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h3>{c.name} — yangi tranzaksiya</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSave}>
          <div className="type-toggle" style={{ marginBottom: '16px' }}>
            <button
              type="button"
              className={`sel-a ${selType === 'debt' ? 'active' : ''}`}
              onClick={() => setSelType('debt')}
            >
              {debtLabel}
              <span className="small">{iowe ? 'Mening qarzim oshadi' : 'Uning qarzi oshadi'}</span>
            </button>
            <button
              type="button"
              className={`sel-b ${selType === 'payment' ? 'active' : ''}`}
              onClick={() => setSelType('payment')}
            >
              {paymentLabel}
              <span className="small">{iowe ? 'Mening qarzim kamayadi' : 'Uning qarzi kamayadi'}</span>
            </button>
          </div>

          <div className="form-field">
            <label>Summa ({db.currency}) *</label>
            <input
              type="number"
              placeholder="0"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Sana</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          {selType === 'debt' && (
            <div className="form-field">
              <label>To'lov muddati (ixtiyoriy)</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          )}

          <div className="form-field">
            <label>Izoh</label>
            <input
              type="text"
              placeholder="Masalan: telefon uchun"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>
              Qaysi karta orqali{db.cards.length === 0 ? " (kartangiz yo'q)" : ""}
            </label>
            <select value={cardId} onChange={e => setCardId(e.target.value)}>
              <option value="">— karta tanlanmagan —</option>
              {db.cards.map(cd => (
                <option key={cd.id} value={cd.id}>
                  {cd.bank} •{cd.last4} — {fmtMoney(cd.balance, db.currency)}
                </option>
              ))}
            </select>
          </div>

          <div className="tx-preview">
            {previewAmount > 0 ? (
              <>{c.name} uchun <b>{verb}</b>: <b>{fmtMoney(previewAmount, db.currency)}</b> qayd etiladi.</>
            ) : (
              <>Summani kiriting — bu yerda qisqacha ko'rinishini ko'rasiz.</>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn btn-gold">Saqlash</button>
          </div>
        </form>
      </div>
    </div>
  );
}
