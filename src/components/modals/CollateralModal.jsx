import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';

export default function CollateralModal({ clientId, onClose }) {
  const { db, addCollateral } = useApp();
  const { toast } = useToast();

  const clients = db?.clients || [];
  const client = clients.find(c => c.id === clientId);

  const [type, setType] = useState('texnika'); // tilla, avto, mulk, texnika, boshqa
  const [title, setTitle] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [condition, setCondition] = useState('Yaxshi / Butun');
  const [storageLocation, setStorageLocation] = useState('Do\'kon seyfida');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('+998 ');
  const [guarantorPassport, setGuarantorPassport] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast('Garov nomini kiriting', 'warning');
      return;
    }

    addCollateral({
      clientId: clientId || null,
      type,
      title,
      estimatedValue: Number(estimatedValue) || 0,
      condition,
      storageLocation,
      guarantorName,
      guarantorPhone,
      guarantorPassport,
      notes,
    });

    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div className="modal-head">
          <h3>Garov (Zalog) & Kafil Biriktirish</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {client && (
              <div style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Mijoz: </span>
                <b>{client.name}</b> {client.phone && `(${client.phone})`}
              </div>
            )}

            <div className="form-field">
              <label>Garov turi *</label>
              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="tilla">💍 Tilla / Zargarlik buyumi</option>
                <option value="texnika">📱 Texnika / Smartfon / Noutbuk</option>
                <option value="avto">🚗 Avtomobil / Transport vositasi</option>
                <option value="mulk">🏠 Ko'chmas mulk / Hujjatlar</option>
                <option value="boshqa">📦 Boshqa qimmatbaho mulk</option>
              </select>
            </div>

            <div className="form-field">
              <label>Garovga qo'yilgan mulk nomi & tavsifi *</label>
              <input
                type="text"
                required
                placeholder="Masalan: iPhone 15 Pro Max 256GB yoki 585 probali tilla zanjir 14 gr"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-field">
                <label>Baholangan qiymati ({db?.currency || "so'm"})</label>
                <input
                  type="number"
                  placeholder="10 000 000"
                  value={estimatedValue}
                  onChange={e => setEstimatedValue(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Mulk holati</label>
                <input
                  type="text"
                  placeholder="Yangi / Ishlatilgan / Ideall"
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label>Saqlash joyi</label>
              <input
                type="text"
                placeholder="Masalan: Bosh do'kon seyfida №3 katak"
                value={storageLocation}
                onChange={e => setStorageLocation(e.target.value)}
              />
            </div>

            <div style={{ margin: '18px 0 10px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--gold)', marginBottom: '8px' }}>
                🤝 Kafil (Garant) Ma'lumotlari (Ixtiyoriy)
              </div>
            </div>

            <div className="form-field">
              <label>Kafilning ismi-sharifi</label>
              <input
                type="text"
                placeholder="Masalan: Rustam Karimov"
                value={guarantorName}
                onChange={e => setGuarantorName(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-field">
                <label>Kafil telefoni</label>
                <input
                  type="text"
                  value={guarantorPhone}
                  onChange={e => setGuarantorPhone(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Pasport seriya & raqam</label>
                <input
                  type="text"
                  placeholder="AA 1234567"
                  value={guarantorPassport}
                  onChange={e => setGuarantorPassport(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label>Qo'shimcha eslatma</label>
              <textarea
                rows={2}
                placeholder="Mulkni qaytarish shartlari yoki guvohlar..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Bekor qilish
              </button>
              <button type="submit" className="btn btn-gold">
                Garovni biriktirish
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
