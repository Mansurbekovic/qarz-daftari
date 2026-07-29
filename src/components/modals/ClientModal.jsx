import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';

export default function ClientModal({ clientId, onClose }) {
  const { db, addClient, updateClient, navigate } = useApp();
  const toast = useToast();

  const c = clientId ? db.clients.find(item => item.id === clientId) : null;
  const [relation, setRelation] = useState(c ? c.relation : 'owed_to_me');
  const [name, setName] = useState(c ? c.name : '');
  const [phone, setPhone] = useState(c ? c.phone || '' : '');
  const [address, setAddress] = useState(c ? c.address || '' : '');
  const [note, setNote] = useState(c ? c.note || '' : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast('Ismni kiriting', 'error');
      return;
    }

    if (c) {
      updateClient(c.id, { name: trimmedName, phone: phone.trim(), address: address.trim(), note: note.trim(), relation });
      toast("Ma'lumot yangilandi");
    } else {
      addClient({ name: trimmedName, phone: phone.trim(), address: address.trim(), note: note.trim(), relation });
      toast('Mijoz qo\'shildi');
      navigate('clients');
    }
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h3>{c ? 'Mijozni tahrirlash' : 'Yangi mijoz'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="relation-toggle">
            <button
              type="button"
              className={`sel-owed ${relation === 'owed_to_me' ? 'active' : ''}`}
              onClick={() => setRelation('owed_to_me')}
            >
              U menga qarzdor
              <span className="small">Masalan: do'kon mijozi, qarz oldi</span>
            </button>
            <button
              type="button"
              className={`sel-iowe ${relation === 'i_owe' ? 'active' : ''}`}
              onClick={() => setRelation('i_owe')}
            >
              Men unga qarzdorman
              <span className="small">Masalan: ta'minotchi, qarz oldim</span>
            </button>
          </div>

          <div className="form-field">
            <label>To'liq ism *</label>
            <input
              type="text"
              placeholder="Masalan: Aziz Karimov"
              value={name}
              onChange={e => setName(e.target.value)}
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

          <div className="form-field">
            <label>Manzil</label>
            <input
              type="text"
              placeholder="Ixtiyoriy"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Izoh</label>
            <textarea
              placeholder="Ixtiyoriy eslatma"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn btn-gold">{c ? 'Saqlash' : "Qo'shish"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
