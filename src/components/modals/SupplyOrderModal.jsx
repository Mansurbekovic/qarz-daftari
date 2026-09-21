import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { fmtMoney, generateSupplyOrderNumber } from '../../utils/helpers';
import { MEASURE_UNITS } from '../../utils/constants';

export default function SupplyOrderModal({ defaultSupplierId, onClose }) {
  const { db, addSupplyOrder, addSupplierPayment } = useApp();
  const { toast } = useToast();

  const suppliers = db?.suppliers || [];
  const products = db?.products || [];

  const [supplierId, setSupplierId] = useState(defaultSupplierId || (suppliers[0]?.id || ''));
  const [orderNo] = useState(generateSupplyOrderNumber());
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [paidUpfront, setPaidUpfront] = useState('');
  const [paidCardId, setPaidCardId] = useState('');

  const [items, setItems] = useState([
    { id: 1, name: '', qty: 10, unit: 'dona', price: '', productId: null, barcode: '' }
  ]);

  const handleItemChange = (idx, field, val) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleProductSelect = (idx, prodId) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        productId: prod.id,
        name: prod.name,
        unit: prod.unit || 'dona',
        price: prod.costPrice || prod.price || '',
        barcode: prod.barcode || ''
      };
      return copy;
    });
  };

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), name: '', qty: 1, unit: 'dona', price: '', productId: null, barcode: '' }
    ]);
  };

  const handleRemoveItem = (idx) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totalOrderAmount = items.reduce((acc, it) => acc + ((Number(it.qty) || 0) * (Number(it.price) || 0)), 0);
  const remainingDebt = Math.max(0, totalOrderAmount - (Number(paidUpfront) || 0));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!supplierId) {
      toast('Ta\'minotchini tanlang', 'error');
      return;
    }
    const cleanItems = items.filter(it => it.name.trim() && Number(it.qty) > 0);
    if (cleanItems.length === 0) {
      toast('Kamida bitta mahsulot kiritilishi shart', 'error');
      return;
    }

    const sup = suppliers.find(s => s.id === supplierId);

    const orderPayload = {
      orderNo,
      supplierId,
      supplierName: sup ? (sup.company ? `${sup.name} (${sup.company})` : sup.name) : 'Ta\'minotchi',
      date,
      items: cleanItems.map(it => ({
        name: it.name.trim(),
        quantity: Number(it.qty) || 1,
        unit: it.unit || 'dona',
        price: Number(it.price) || 0,
        subtotal: (Number(it.qty) || 1) * (Number(it.price) || 0),
        productId: it.productId,
        barcode: it.barcode
      })),
      totalAmount: totalOrderAmount,
      paidAmount: Number(paidUpfront) || 0,
      debtBalance: remainingDebt,
      note: note.trim()
    };

    addSupplyOrder(orderPayload);

    // If upfront payment was made, log supplier payment
    if (Number(paidUpfront) > 0) {
      addSupplierPayment({
        supplierId,
        supplierName: sup?.name,
        amount: Number(paidUpfront),
        date,
        cardId: paidCardId || null,
        note: `Kirim qabuli paytida to'langan avans (${orderNo})`
      });
    }

    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal wide" style={{ maxWidth: '780px', width: '95%' }}>
        <div className="modal-head">
          <h3>🚚 Tovar qabuli / Kirim hujjati (№ {orderNo})</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Supplier and Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="field-label">Ta'minotchi (Optovik / Zavod) *</label>
                <select
                  className="input"
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  required
                >
                  {suppliers.length === 0 ? (
                    <option value="">Ta'minotchilar mavjud emas</option>
                  ) : (
                    suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.company ? `(${s.company})` : ''} — {s.category}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="field-label">Qabul qilingan sana</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Line items table */}
            <div style={{
              background: 'var(--surface-2)',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                <b style={{ fontSize: '13px' }}>📦 Qabul qilinayotgan tovarlar ro'yxati</b>
                <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 800 }}>
                  Jami: {fmtMoney(totalOrderAmount, db?.currency)}
                </span>
              </div>

              {items.map((it, idx) => (
                <div key={it.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1.2fr auto',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div>
                    {products.length > 0 && (
                      <select
                        className="input"
                        style={{ fontSize: '11.5px', padding: '4px 6px', marginBottom: '4px' }}
                        onChange={e => handleProductSelect(idx, e.target.value)}
                        value={it.productId || ''}
                      >
                        <option value="">-- Ombordan tanlash (ixtiyoriy) --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Qoldiq: {p.stock} {p.unit})
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      className="input"
                      placeholder="Tovar nomi"
                      value={it.name}
                      onChange={e => handleItemChange(idx, 'name', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      className="input"
                      placeholder="Miqdor"
                      min="0.1"
                      step="any"
                      value={it.qty}
                      onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <select
                      className="input"
                      value={it.unit}
                      onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                    >
                      {MEASURE_UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="number"
                      className="input"
                      placeholder="Kelish narxi"
                      min="0"
                      value={it.price}
                      onChange={e => handleItemChange(idx, 'price', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--rust)', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleAddItem}
                style={{ width: '100%', marginTop: '6px' }}
              >
                + Yana tovar qo'shish
              </button>
            </div>

            {/* Upfront Payment & Debt preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="field-label">Oldindan to'langan summa (agar bo'lsa)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  min="0"
                  value={paidUpfront}
                  onChange={e => setPaidUpfront(e.target.value)}
                />
              </div>

              {Number(paidUpfront) > 0 && (db.cards || []).length > 0 && (
                <div>
                  <label className="field-label">To'lov qilingan karta (ixtiyoriy)</label>
                  <select
                    className="input"
                    value={paidCardId}
                    onChange={e => setPaidCardId(e.target.value)}
                  >
                    <option value="">— Naqd pulda —</option>
                    {db.cards.map(cd => (
                      <option key={cd.id} value={cd.id}>
                        {cd.bank} •{cd.last4} ({fmtMoney(cd.balance, db.currency)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="field-label">Izoh / Mashina raqami / Haydovchi</label>
              <input
                type="text"
                className="input"
                placeholder="Masalan: Isuzu yuk mashinasida keldi..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {/* Summary preview */}
            <div style={{
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px'
            }}>
              <span>Ta'minotchi hisobiga yoziladigan qarz:</span>
              <strong style={{ fontSize: '16px', color: remainingDebt > 0 ? 'var(--rust)' : 'var(--teal)' }}>
                {fmtMoney(remainingDebt, db?.currency)}
              </strong>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Bekor qilish
              </button>
              <button type="submit" className="btn btn-primary">
                🚚 Qabulni tasdiqlash & Skladga kiritish
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
