import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { fmtMoney, parseMoneyValue, todayISO, generateInstallmentPlan, generateReceiptNumber } from '../../utils/helpers';
import { MEASURE_UNITS } from '../../utils/constants';

export default function TransactionModal({ clientId, defaultType = 'debt', onClose, onTransactionCreated }) {
  const { db, addTransaction, clientBalance } = useApp();
  const toast = useToast();

  const c = db.clients.find(cl => cl.id === clientId);
  const iowe = c && c.relation === 'i_owe';

  const [selType, setSelType] = useState(defaultType);
  const [entryMode, setEntryMode] = useState('simple'); // 'simple' | 'items'
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [cardId, setCardId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'card' | 'online'

  // Items List state
  const [items, setItems] = useState([
    { id: 1, name: '', qty: 1, unit: 'dona', price: '', total: 0 }
  ]);

  // Installment (Rastrochka) state
  const [enableInstallment, setEnableInstallment] = useState(false);
  const [installmentMonths, setInstallmentMonths] = useState(3);

  if (!c) return null;

  const debtLabel = iowe ? 'Qarz oldim' : 'Nasiya / Qarz berdim';
  const paymentLabel = iowe ? 'Qarz qaytardim' : "To'lov qabul qildim";

  // Item List Handlers
  const handleItemChange = (idx, field, val) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[idx], [field]: val };
      const qty = parseFloat(item.qty) || 0;
      const price = parseMoneyValue(item.price) || 0;
      item.total = qty * price;
      updated[idx] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), name: '', qty: 1, unit: 'dona', price: '', total: 0 }
    ]);
  };

  const handleRemoveItem = (idx) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const calculateItemsTotal = () => {
    return items.reduce((sum, it) => sum + (it.total || 0), 0);
  };

  const currentTotalAmount = entryMode === 'items' && selType === 'debt'
    ? calculateItemsTotal()
    : (parseMoneyValue(amount) || 0);

  const handleSave = (e) => {
    e.preventDefault();
    const finalAmount = currentTotalAmount;

    if (!finalAmount || finalAmount <= 0) {
      toast("To'g'ri summa yoki mahsulotlar narxini kiriting", 'error');
      return;
    }

    if (cardId) {
      const card = db.cards.find(cd => cd.id === cardId);
      const outflow = (selType === 'debt' && !iowe) || (selType === 'payment' && iowe);
      if (outflow && card && finalAmount > card.balance) {
        toast('Tanlangan kartada yetarli mablag\' yo\'q', 'error');
        return;
      }
    }

    // Credit limit warning
    const currentBal = clientBalance(c.id);
    if (!iowe && selType === 'debt' && c.creditLimit && (currentBal + finalAmount) > c.creditLimit) {
      const exceed = (currentBal + finalAmount) - c.creditLimit;
      toast(`Diqqat! Mijoz kredit limiti (${fmtMoney(c.creditLimit, db.currency)}) dan ${fmtMoney(exceed, db.currency)} ga oshdi!`, 'warning');
    }

    // Clean items if in items mode
    const cleanItems = (entryMode === 'items' && selType === 'debt')
      ? items.filter(it => it.name.trim() && it.total > 0).map(it => ({
          name: it.name.trim(),
          qty: Number(it.qty) || 1,
          unit: it.unit || 'dona',
          price: parseMoneyValue(it.price) || 0,
          total: it.total || 0,
        }))
      : [];

    // Installments
    let installments = null;
    if (selType === 'debt' && enableInstallment) {
      installments = generateInstallmentPlan(finalAmount, installmentMonths, date);
    }

    const receiptNo = generateReceiptNumber();

    const newTx = {
      clientId,
      type: selType,
      amount: finalAmount,
      date: date || todayISO(),
      dueDate: selType === 'debt' ? (dueDate || null) : null,
      note: note.trim(),
      cardId: cardId || null,
      paymentMethod,
      items: cleanItems,
      installments,
      receiptNumber: receiptNo,
      balanceAfter: (currentBal + (selType === 'debt' ? finalAmount : -finalAmount)),
    };

    addTransaction(newTx);

    toast(selType === 'debt' ? (iowe ? 'Qarz qayd etildi' : 'Nasiya muvaffaqiyatli saqlandi') : 'To\'lov qayd etildi');
    
    if (onTransactionCreated) {
      onTransactionCreated(c, newTx);
    }
    
    onClose();
  };

  const verb = selType === 'debt' ? debtLabel : paymentLabel;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-head">
          <h3>{c.name} — {selType === 'debt' ? 'Nasiya / Qarz berish' : 'To\'lov qabul qilish'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-body" onSubmit={handleSave}>
          <div className="type-toggle" style={{ marginBottom: '14px' }}>
            <button
              type="button"
              className={`sel-a ${selType === 'debt' ? 'active' : ''}`}
              onClick={() => setSelType('debt')}
            >
              {debtLabel}
              <span className="small">{iowe ? 'Mening qarzim oshadi' : 'Mijoz qarzi oshadi'}</span>
            </button>
            <button
              type="button"
              className={`sel-b ${selType === 'payment' ? 'active' : ''}`}
              onClick={() => setSelType('payment')}
            >
              {paymentLabel}
              <span className="small">{iowe ? 'Mening qarzim kamayadi' : 'Mijoz qarzi kamayadi'}</span>
            </button>
          </div>

          {/* Entry mode toggle (Simple Amount vs Itemized Goods) */}
          {selType === 'debt' && !iowe && (
            <div className="chip-group" style={{ marginBottom: '14px' }}>
              <button
                type="button"
                className={`chip ${entryMode === 'simple' ? 'active' : ''}`}
                onClick={() => setEntryMode('simple')}
              >
                💵 Oddiy summa
              </button>
              <button
                type="button"
                className={`chip ${entryMode === 'items' ? 'active' : ''}`}
                onClick={() => setEntryMode('items')}
              >
                🛍️ Mahsulotlar ro'yxati (Nasiya savdo)
              </button>
            </div>
          )}

          {/* Items Entry Mode */}
          {entryMode === 'items' && selType === 'debt' && !iowe ? (
            <div style={{ marginBottom: '14px', background: 'var(--surface-2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <b>📦 Mahsulotlar savati</b>
                <span style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 800 }}>
                  Jami: {fmtMoney(calculateItemsTotal(), db.currency)}
                </span>
              </div>

              {items.map((item, idx) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr auto', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Mahsulot nomi"
                    value={item.name}
                    onChange={e => handleItemChange(idx, 'name', e.target.value)}
                    style={{ fontSize: '12.5px', padding: '7px 9px' }}
                  />
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    placeholder="Soni"
                    value={item.qty}
                    onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                    style={{ fontSize: '12.5px', padding: '7px 9px' }}
                  />
                  <select
                    value={item.unit}
                    onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                    style={{ fontSize: '12px', padding: '7px 4px' }}
                  >
                    {MEASURE_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="Narxi"
                    value={item.price}
                    onChange={e => handleItemChange(idx, 'price', e.target.value)}
                    style={{ fontSize: '12.5px', padding: '7px 9px' }}
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{ background: 'none', border: 'none', color: 'var(--rust)', cursor: 'pointer', padding: '4px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ width: '100%', marginTop: '6px', fontSize: '12px' }}
                onClick={handleAddItem}
              >
                + Yana mahsulot qo'shish
              </button>
            </div>
          ) : (
            <div className="form-field">
              <label>Summa ({db.currency}) *</label>
              <input
                type="number"
                placeholder="0"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ fontSize: '16px', fontWeight: 700 }}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-field">
              <label>Sana</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            {selType === 'debt' ? (
              <div className="form-field">
                <label>Qaytarish muddati</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            ) : (
              <div className="form-field">
                <label>To'lov usuli</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="cash">💵 Naqd pul</option>
                  <option value="card">💳 Plastik karta</option>
                  <option value="payme">💎 Payme</option>
                  <option value="click">🔵 Click</option>
                </select>
              </div>
            )}
          </div>

          {/* Installments Option */}
          {selType === 'debt' && !iowe && (
            <div style={{ marginBottom: '14px', background: 'var(--surface-2)', padding: '10px 14px', borderRadius: '10px' }}>
              <div className="form-check" style={{ marginBottom: enableInstallment ? '10px' : 0 }}>
                <input
                  type="checkbox"
                  id="instCheck"
                  checked={enableInstallment}
                  onChange={e => setEnableInstallment(e.target.checked)}
                />
                <label htmlFor="instCheck" style={{ cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                  📅 Muddatli to'lov / Bo'lib to'lash rejasi (Rastrochka)
                </label>
              </div>

              {enableInstallment && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '12.5px' }}>Necha oyga:</span>
                  <select
                    value={installmentMonths}
                    onChange={e => setInstallmentMonths(Number(e.target.value))}
                    style={{ padding: '6px 12px', borderRadius: '6px' }}
                  >
                    <option value={2}>2 oyga ({fmtMoney(Math.round(currentTotalAmount / 2), db.currency)}/oy)</option>
                    <option value={3}>3 oyga ({fmtMoney(Math.round(currentTotalAmount / 3), db.currency)}/oy)</option>
                    <option value={6}>6 oyga ({fmtMoney(Math.round(currentTotalAmount / 6), db.currency)}/oy)</option>
                    <option value={12}>12 oyga ({fmtMoney(Math.round(currentTotalAmount / 12), db.currency)}/oy)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="form-field">
            <label>Izoh yoki qo'shimcha eslatma</label>
            <input
              type="text"
              placeholder="Masalan: 1 qop un va moy uchun..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {db.cards.length > 0 && (
            <div className="form-field">
              <label>Karta balansi bilan bog'lash (ixtiyoriy)</label>
              <select value={cardId} onChange={e => setCardId(e.target.value)}>
                <option value="">— Bog'lanmagan —</option>
                {db.cards.map(cd => (
                  <option key={cd.id} value={cd.id}>
                    {cd.bank} •{cd.last4} — {fmtMoney(cd.balance, db.currency)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="tx-preview">
            {currentTotalAmount > 0 ? (
              <>{c.name} uchun <b>{verb}</b>: <b style={{ color: selType === 'debt' ? 'var(--rust)' : 'var(--teal)' }}>{fmtMoney(currentTotalAmount, db.currency)}</b> qayd etiladi.</>
            ) : (
              <>Summani kiriting — bu yerda qisqacha ko'rinishini ko'rasiz.</>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn btn-gold">
              💾 Saqlash {currentTotalAmount > 0 ? `(${fmtMoney(currentTotalAmount, db.currency)})` : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
