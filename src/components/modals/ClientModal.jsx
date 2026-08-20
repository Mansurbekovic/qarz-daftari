import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { CLIENT_CATEGORIES } from '../../utils/constants';

export default function ClientModal({ clientId, onClose }) {
  const { db, addClient, updateClient, navigate } = useApp();
  const toast = useToast();

  const c = clientId ? db.clients.find(item => item.id === clientId) : null;
  const [relation, setRelation] = useState(c ? c.relation : 'owed_to_me');
  const [name, setName] = useState(c ? c.name : '');
  const [phone, setPhone] = useState(c ? c.phone || '' : '');
  const [address, setAddress] = useState(c ? c.address || '' : '');
  const [note, setNote] = useState(c ? c.note || '' : '');
  const [category, setCategory] = useState(c?.category || 'Oddiy');
  const [creditLimit, setCreditLimit] = useState(c?.creditLimit || '');
  const [passport, setPassport] = useState(c?.passport || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast('Mijoz ismini kiriting', 'error');
      return;
    }

    const clientPayload = {
      name: trimmedName,
      phone: phone.trim(),
      address: address.trim(),
      note: note.trim(),
      relation,
      category,
      creditLimit: creditLimit ? Number(creditLimit) : null,
      passport: passport.trim(),
    };

    if (c) {
      updateClient(c.id, clientPayload);
      toast("Mijoz ma'lumotlari muvaffaqiyatli yangilandi");
    } else {
      addClient(clientPayload);
      toast('Yangi mijoz qo\'shildi');
      navigate('clients');
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-head">
          <h3>{c ? 'Mijoz profilini tahrirlash' : 'Yangi mijoz qo\'shish'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="relation-toggle" style={{ marginBottom: '14px' }}>
            <button
              type="button"
              className={`sel-owed ${relation === 'owed_to_me' ? 'active' : ''}`}
              onClick={() => setRelation('owed_to_me')}
            >
              U menga qarzdor
              <span className="small">Masalan: do'kon mijozi, xaridor</span>
            </button>
            <button
              type="button"
              className={`sel-iowe ${relation === 'i_owe' ? 'active' : ''}`}
              onClick={() => setRelation('i_owe')}
            >
              Men unga qarzdorman
              <span className="small">Masalan: ta'minotchi, diller</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
            <div className="form-field">
              <label>Mijoz Ism-familiyasi *</label>
              <input
                type="text"
                placeholder="Masalan: Aziz Karimov"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Telefon raqami</label>
              <input
                type="text"
                placeholder="+998 90 123 45 67"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-field">
              <label>Mijoz toifasi</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {CLIENT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Qarz limiti ({db.currency})</label>
              <input
                type="number"
                placeholder="Masalan: 3000000"
                value={creditLimit}
                onChange={e => setCreditLimit(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-field">
              <label>Manzil yoki hudud</label>
              <input
                type="text"
                placeholder="Masalan: Chilonzor, 12-uy"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Pasport / ID seriya (ixtiyoriy)</label>
              <input
                type="text"
                placeholder="Masalan: AA 1234567"
                value={passport}
                onChange={e => setPassport(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Qo'shimcha eslatma / Izoh</label>
            <textarea
              placeholder="Mijoz haqida foydali ma'lumotlar..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn btn-gold">{c ? 'Saqlash' : "Mijozni qo'shish"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
