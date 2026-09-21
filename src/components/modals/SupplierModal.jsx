import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { SUPPLIER_CATEGORIES } from '../../utils/constants';
import { formatINN, formatMFO } from '../../utils/helpers';

export default function SupplierModal({ supplierId, onClose }) {
  const { db, addSupplier, updateSupplier } = useApp();
  const { toast } = useToast();

  const isEdit = Boolean(supplierId);
  const existing = isEdit ? (db.suppliers || []).find(s => s.id === supplierId) : null;

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [category, setCategory] = useState(SUPPLIER_CATEGORIES[0]);
  const [phone, setPhone] = useState('+998 ');
  const [address, setAddress] = useState('');
  const [inn, setInn] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [mfo, setMfo] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (existing) {
      setName(existing.name || '');
      setCompany(existing.company || '');
      setCategory(existing.category || SUPPLIER_CATEGORIES[0]);
      setPhone(existing.phone || '+998 ');
      setAddress(existing.address || '');
      setInn(existing.inn || '');
      setBankAccount(existing.bankAccount || '');
      setMfo(existing.mfo || '');
      setNote(existing.note || '');
    }
  }, [existing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Ta\'minotchi nomini kiriting', 'error');
      return;
    }

    const payload = {
      name: name.trim(),
      company: company.trim(),
      category,
      phone: phone.trim(),
      address: address.trim(),
      inn: inn.trim(),
      bankAccount: bankAccount.trim(),
      mfo: mfo.trim(),
      note: note.trim()
    };

    if (isEdit) {
      updateSupplier(supplierId, payload);
    } else {
      addSupplier(payload);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '620px', width: '95%' }}>
        <div className="modal-head">
          <h3>{isEdit ? '🏭 Ta\'minotchini tahrirlash' : '🏭 Yangi Ta\'minotchi qo\'shish'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="field-label">Ta'minotchi / Mas'ul shaxs ismi *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Masalan: Sardor aka (Optom Un)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="field-label">Kompaniya / Zavod / Firma nomi</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Masalan: 'Toshkent Don MChJ'"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="field-label">Faoliyat turi / Kategoriya</label>
                <select
                  className="input"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {SUPPLIER_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Telefon raqami</label>
                <input
                  type="text"
                  className="input"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="field-label">Manzili / Baza yoki ombor joylashuvi</label>
              <input
                type="text"
                className="input"
                placeholder="Shahar, tuman, ko'cha yoki bozor qatori..."
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            {/* Bank Requisites */}
            <div style={{
              background: 'var(--surface-2)',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '10px', color: 'var(--gold)' }}>
                🏛️ Bank va soliq rekvizitlari (ixtiyoriy)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="field-label">INN (9 xona)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="123456789"
                    maxLength={9}
                    value={inn}
                    onChange={e => setInn(formatINN(e.target.value))}
                  />
                </div>
                <div>
                  <label className="field-label">MFO (5 xona)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="00401"
                    maxLength={5}
                    value={mfo}
                    onChange={e => setMfo(formatMFO(e.target.value))}
                  />
                </div>
                <div>
                  <label className="field-label">Hisob raqam (20 xona)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="20208000..."
                    maxLength={20}
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="field-label">Qo'shimcha eslatma / Izoh</label>
              <input
                type="text"
                className="input"
                placeholder="Yetkazib berish shartlari, to'lov muddatlari..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Bekor qilish
              </button>
              <button type="submit" className="btn btn-primary">
                {isEdit ? '💾 Saqlash' : '➕ Ta\'minotchi qo\'shish'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
