import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { todayISO } from '../../utils/helpers';

export default function ClientModal({ clientId, onClose }) {
  const { db, addClient, updateClient, addTransaction, navigate } = useApp();
  const toast = useToast();

  const c = clientId ? db.clients.find(item => item.id === clientId) : null;
  const [name, setName] = useState(c ? c.name : '');
  const [address, setAddress] = useState(c ? c.address || '' : '');
  const [phone, setPhone] = useState(c ? c.phone || '' : '');
  const [initialDebt, setInitialDebt] = useState('');
  const [relation, setRelation] = useState(c ? c.relation : 'owed_to_me');
  const [note, setNote] = useState(c ? c.note || '' : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast('Ismni kiriting', 'error');
      return;
    }

    if (c) {
      updateClient(c.id, {
        name: trimmedName,
        address: address.trim(),
        phone: phone.trim(),
        note: note.trim(),
        relation,
      });
      toast("Ma'lumotlar yangilandi");
    } else {
      const newClientId = 'cl_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      addClient({
        id: newClientId,
        name: trimmedName,
        address: address.trim(),
        phone: phone.trim(),
        note: note.trim(),
        relation,
      });

      // Agar boshlang'ich qarz summasi kiritilgan bo'lsa, darhol tranzaksiya yozamiz
      const debtAmount = Number(initialDebt);
      if (debtAmount > 0) {
        addTransaction({
          clientId: newClientId,
          type: 'debt',
          amount: debtAmount,
          date: todayISO(),
          note: note.trim() || 'Dastlabki qarz',
        });
      }

      toast('Yangi qarz yozildi');
      navigate('dashboard');
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-head">
          <h3>{c ? 'Qarzdorni tahrirlash' : 'Yangi qarz yozish'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Kim kimga qarzdor */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setRelation('owed_to_me')}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: relation === 'owed_to_me' ? '#1F6E5C' : 'var(--border)',
                background: relation === 'owed_to_me' ? 'rgba(31, 110, 92, 0.15)' : 'var(--surface-2)',
                color: relation === 'owed_to_me' ? '#1F6E5C' : 'var(--ink)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              🟢 U menga qarzdor
            </button>
            <button
              type="button"
              onClick={() => setRelation('i_owe')}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: relation === 'i_owe' ? '#E04836' : 'var(--border)',
                background: relation === 'i_owe' ? 'rgba(224, 72, 54, 0.15)' : 'var(--surface-2)',
                color: relation === 'i_owe' ? '#E04836' : 'var(--ink)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              🔴 Men qarzdorman
            </button>
          </div>

          {/* Ismi */}
          <div className="form-field" style={{ margin: 0 }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
              Ismi-sharifi *
            </label>
            <input
              type="text"
              placeholder="Masalan: Alisher Vohidov"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              style={{ padding: '11px 13px', fontSize: '14px', borderRadius: '10px' }}
            />
          </div>

          {/* Manzili */}
          <div className="form-field" style={{ margin: 0 }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
              Manzili
            </label>
            <input
              type="text"
              placeholder="Masalan: Chilonzor 9, 12-uy yoki Qishloq"
              value={address}
              onChange={e => setAddress(e.target.value)}
              style={{ padding: '11px 13px', fontSize: '14px', borderRadius: '10px' }}
            />
          </div>

          {/* Telefoni */}
          <div className="form-field" style={{ margin: 0 }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
              Telefon raqami (ixtiyoriy)
            </label>
            <input
              type="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ padding: '11px 13px', fontSize: '14px', borderRadius: '10px' }}
            />
          </div>

          {/* Qarz summasi (agar yangi bo'lsa) */}
          {!c && (
            <div className="form-field" style={{ margin: 0 }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                Qarz summasi (so'mda) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Masalan: 250000"
                value={initialDebt}
                onChange={e => setInitialDebt(e.target.value)}
                style={{ padding: '11px 13px', fontSize: '16px', fontWeight: 700, borderRadius: '10px' }}
              />
            </div>
          )}

          {/* Izoh */}
          <div className="form-field" style={{ margin: 0 }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
              Nima uchun berilgan / Izoh
            </label>
            <input
              type="text"
              placeholder="Masalan: 2 qop un, telefon uchun..."
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ padding: '11px 13px', fontSize: '14px', borderRadius: '10px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
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
