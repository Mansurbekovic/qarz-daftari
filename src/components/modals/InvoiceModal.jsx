import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { fmtMoney, generateInvoiceNumber, calculateInvoiceTotals } from '../../utils/helpers';
import { MEASURE_UNITS, INVOICE_STATUSES } from '../../utils/constants';

export default function InvoiceModal({ invoiceId, defaultClientId, onClose }) {
  const { db, addInvoice, updateInvoice } = useApp();
  const { toast } = useToast();

  const isEdit = Boolean(invoiceId);
  const existing = isEdit ? (db.invoices || []).find(i => i.id === invoiceId) : null;

  const clients = db.clients || [];
  const products = db.products || [];

  const [invoiceNo] = useState(existing?.invoiceNo || generateInvoiceNumber());
  const [date, setDate] = useState(existing?.date || new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    if (existing?.dueDate) return existing.dueDate;
    const d = new Date();
    d.setDate(d.getDate() + 14); // 14 days default
    return d.toISOString().slice(0, 10);
  });

  const [clientId, setClientId] = useState(existing?.clientId || defaultClientId || '');
  const [clientName, setClientName] = useState(existing?.clientName || '');
  const [clientPhone, setClientPhone] = useState(existing?.clientPhone || '');
  const [clientInn, setClientInn] = useState(existing?.clientInn || '');
  const [clientAddress, setClientAddress] = useState(existing?.clientAddress || '');

  const [currency, setCurrency] = useState(existing?.currency || db?.currency || 'so\'m');
  const [status, setStatus] = useState(existing?.status || 'sent');
  const [discountPercent, setDiscountPercent] = useState(existing?.discountPercent || 0);
  const [vatPercent, setVatPercent] = useState(existing?.vatPercent !== undefined ? existing.vatPercent : 0);
  const [notes, setNotes] = useState(existing?.notes || '');

  const [items, setItems] = useState(() => {
    if (existing?.items && existing.items.length > 0) return existing.items;
    return [{ id: 1, name: '', qty: 1, unit: 'dona', price: '', productId: null, barcode: '' }];
  });

  // Client Selection auto-fill
  useEffect(() => {
    if (clientId) {
      const cl = clients.find(c => c.id === clientId);
      if (cl) {
        setClientName(cl.name);
        setClientPhone(cl.phone || '');
        setClientAddress(cl.address || '');
      }
    }
  }, [clientId, clients]);

  const handleProductSelect = (idx, prodId) => {
    const p = products.find(prod => prod.id === prodId);
    if (!p) return;
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        productId: p.id,
        name: p.name,
        unit: p.unit || 'dona',
        price: p.price,
        barcode: p.barcode || ''
      };
      return copy;
    });
  };

  const handleItemChange = (idx, field, val) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
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

  // Calculations
  const calculated = calculateInvoiceTotals(items, discountPercent, vatPercent);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast('Mijoz yoki tashkilot nomini kiriting', 'error');
      return;
    }
    const cleanItems = items.filter(it => it.name.trim() && Number(it.qty) > 0);
    if (cleanItems.length === 0) {
      toast('Kamida bitta tovar yoki xizmat kiritilishi shart', 'error');
      return;
    }

    const payload = {
      invoiceNo,
      date,
      dueDate,
      clientId: clientId || null,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientInn: clientInn.trim(),
      clientAddress: clientAddress.trim(),
      items: cleanItems.map(it => ({
        name: it.name.trim(),
        quantity: Number(it.qty) || 1,
        unit: it.unit || 'dona',
        price: Number(it.price) || 0,
        subtotal: (Number(it.qty) || 1) * (Number(it.price) || 0),
        productId: it.productId,
        barcode: it.barcode
      })),
      subtotal: calculated.subtotal,
      discountPercent: Number(discountPercent) || 0,
      vatPercent: Number(vatPercent) || 0,
      grandTotal: calculated.grandTotal,
      currency,
      status,
      notes: notes.trim()
    };

    if (isEdit) {
      updateInvoice(invoiceId, payload);
    } else {
      addInvoice(payload);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal wide" style={{ maxWidth: '820px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="modal-head">
          <h3>{isEdit ? `🧾 Faktura № ${invoiceNo} ni tahrirlash` : `🧾 Yangi Hisob-Faktura (№ ${invoiceNo})`}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top row: Client & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label className="field-label">Mijoz / Hamkor (ro'yxatdan)</label>
                <select
                  className="input"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                >
                  <option value="">-- Yangi mijoz (ro'yxatsiz) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.category ? `(${c.category})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Hujjat sanasi</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label">To'lov oxirgi muddati</label>
                <input
                  type="date"
                  className="input"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Client Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label className="field-label">Mijoz / Korxona nomi *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Masalan: 'Mega Trade MChJ' yoki Alisher"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label">Telefon</label>
                <input
                  type="text"
                  className="input"
                  placeholder="+998..."
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label">INN (Soliq raqami)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="9 xonali INN"
                  maxLength={9}
                  value={clientInn}
                  onChange={e => setClientInn(e.target.value)}
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{
              background: 'var(--surface-2)',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                <b style={{ fontSize: '13px' }}>📋 Tovar va xizmatlar tarkibi</b>
                <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 800 }}>
                  Jami: {fmtMoney(calculated.grandTotal, currency)}
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
                        style={{ fontSize: '11px', padding: '4px', marginBottom: '4px' }}
                        onChange={e => handleProductSelect(idx, e.target.value)}
                        value={it.productId || ''}
                      >
                        <option value="">-- Ombordan tovar tanlash --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({fmtMoney(p.price, currency)})</option>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      className="input"
                      placeholder="Nomi / Xizmat turi"
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
                      placeholder="Narxi"
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
                + Yana qator qo'shish
              </button>
            </div>

            {/* Discount & VAT & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px' }}>
              <div>
                <label className="field-label">Chegirma (%)</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label">QQS (NDS %)</label>
                <select
                  className="input"
                  value={vatPercent}
                  onChange={e => setVatPercent(e.target.value)}
                >
                  <option value="0">0% (QQSsiz)</option>
                  <option value="12">12% (Standart QQS)</option>
                </select>
              </div>

              <div>
                <label className="field-label">Faktura holati (Status)</label>
                <select
                  className="input"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  {Object.entries(INVOICE_STATUSES).map(([key, info]) => (
                    <option key={key} value={key}>{info.badge} {info.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Total calculation breakdown */}
            <div style={{
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '10px',
              padding: '14px 18px',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Oraliq summa (Subtotal):</span>
                <strong>{fmtMoney(calculated.subtotal, currency)}</strong>
              </div>
              {calculated.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--rust)' }}>
                  <span>Chegirma ({discountPercent}%):</span>
                  <strong>-{fmtMoney(calculated.discountAmount, currency)}</strong>
                </div>
              )}
              {calculated.vatAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--teal)' }}>
                  <span>QQS (12%):</span>
                  <strong>+{fmtMoney(calculated.vatAmount, currency)}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '6px', fontSize: '15px' }}>
                <span><strong>Jami to'lanishi lozim:</strong></span>
                <strong style={{ color: 'var(--gold)' }}>{fmtMoney(calculated.grandTotal, currency)}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Bekor qilish
              </button>
              <button type="submit" className="btn btn-primary">
                {isEdit ? '💾 Fakturani saqlash' : '🧾 Fakturani chiqarish'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
