import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, fmtDate } from '../utils/helpers';

export default function Branches() {
  const { db, addBranch, updateBranch, deleteBranch, switchBranch } = useApp();
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [manager, setManager] = useState('');

  const branches = db?.branches || [];
  const currentBranchId = db?.currentBranchId || 'main';
  const currency = db?.currency || "so'm";

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setAddress('');
    setPhone('+998 ');
    setManager('');
    setShowModal(true);
  };

  const handleOpenEdit = (b) => {
    setEditingId(b.id);
    setName(b.name);
    setAddress(b.address || '');
    setPhone(b.phone || '+998 ');
    setManager(b.manager || '');
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Filial nomini kiriting', 'warning');
      return;
    }

    if (editingId) {
      updateBranch(editingId, { name, address, phone, manager });
    } else {
      addBranch({ name, address, phone, manager });
    }
    setShowModal(false);
  };

  return (
    <div>
      {/* Top Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(169, 130, 31, 0.15), rgba(31, 110, 92, 0.15))',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🏢</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Filiallar va Savdo Nuqtalari Tarmog'i</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', maxWidth: '600px' }}>
            Bitta hisob ostida bir nechta savdo nuqtasi, ombor va do'konlaringizni birlashtiring.
            Har bir filialning o'z hisob-kitobi va umumiy konsolidatsiya qilingan moliyaviy balansi.
          </p>
        </div>

        <button className="btn btn-gold" onClick={handleOpenAdd}>
          + Yangi Filial Qo'shish
        </button>
      </div>

      {/* Branches Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
        {branches.map(b => {
          const isSelected = b.id === currentBranchId;

          return (
            <div
              key={b.id}
              className="settings-card"
              style={{
                position: 'relative',
                border: isSelected ? '2px solid var(--gold)' : '1px solid var(--border)',
                background: isSelected ? 'var(--surface-2)' : 'var(--surface)',
                boxShadow: isSelected ? '0 4px 20px rgba(169, 130, 31, 0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'var(--gold)',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '0.04em'
                }}>
                  HOZIRGI FAOL FILIAL
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: isSelected ? 'var(--gold)' : 'var(--border)',
                  color: isSelected ? '#fff' : 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  🏪
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>{b.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {b.isMain ? '⭐ Bosh savdo markazi' : 'Qo\'shimcha filial'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--ink)', lineHeight: '1.7', marginBottom: '16px' }}>
                <div>📍 <b>Manzil:</b> {b.address || 'Kiritilmagan'}</div>
                <div>📞 <b>Telefon:</b> {b.phone || 'Kiritilmagan'}</div>
                <div>👤 <b>Mas'ul boshqaruvchi:</b> {b.manager || 'Tayinlanmagan'}</div>
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                {!isSelected ? (
                  <button
                    className="btn btn-sm btn-gold"
                    style={{ flex: 1 }}
                    onClick={() => {
                      switchBranch(b.id);
                      toast(`Faol filial: "${b.name}" ga o'tkazildi`);
                    }}
                  >
                    Ushbu filialga o'tish
                  </button>
                ) : (
                  <button
                    className="btn btn-sm btn-outline"
                    style={{ flex: 1, cursor: 'default' }}
                    disabled
                  >
                    ✓ Tanlangan
                  </button>
                )}

                <button
                  className="icon-btn"
                  title="Tahrirlash"
                  onClick={() => handleOpenEdit(b)}
                >
                  ✏️
                </button>

                {!b.isMain && (
                  <button
                    className="icon-btn"
                    title="O'chirish"
                    onClick={() => {
                      if (window.confirm(`"${b.name}" filialini o'chirishni tasdiqlaysizmi?`)) {
                        deleteBranch(b.id);
                      }
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Branch Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-head">
              <h3>{editingId ? 'Filialni tahrirlash' : 'Yangi filial qo\'shish'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-field">
                  <label>Filial yoki do'kon nomi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Chorsu filiali"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Do'kon manzili</label>
                  <input
                    type="text"
                    placeholder="Masalan: Shayxontohur tumani, Navoiy ko'chasi 14"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Bog'lanish uchun telefon</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Mas'ul mudir / Sotuvchi</label>
                  <input
                    type="text"
                    placeholder="Masalan: Alisher Vohidov"
                    value={manager}
                    onChange={e => setManager(e.target.value)}
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn btn-gold">
                    Saqlash
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
