import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { exportToCSV, todayISO } from '../utils/helpers';

export default function Settings({ onLogoutClick }) {
  const { db, currentUser, accounts, toggleTheme, updateDB, navigate, clientBalance } = useApp();
  const toast = useToast();

  const currentAcc = (accounts || []).find(a => a.username === currentUser) || {};
  const [bizName, setBizName] = useState(db?.businessName || currentUser || '');

  const handleSaveBizName = (e) => {
    e.preventDefault();
    updateDB(prev => ({ ...prev, businessName: bizName.trim() || currentUser }));
    toast('Nomi muvaffaqiyatli saqlandi');
  };

  const handleExportCSV = () => {
    if (!db || !db.clients || db.clients.length === 0) {
      toast('Qarz daftarida ma\'lumot yo\'q', 'error');
      return;
    }

    const headers = ['Ismi', 'Manzili', 'Telefoni', 'Qarz summasi', 'Holati', 'Izoh'];
    const rows = db.clients.map(c => {
      const bal = clientBalance(c.id);
      const iowe = c.relation === 'i_owe';
      return [
        c.name,
        c.address || '',
        c.phone || '',
        Math.abs(bal),
        bal === 0 ? "Qarz yo'q" : (iowe ? "Men qarzdorman" : "U menga qarzdor"),
        c.note || ''
      ];
    });

    exportToCSV(headers, rows, `qarz-daftari-${todayISO()}.csv`);
    toast('Qarz daftari Excel (CSV) formatida yuklab olindi');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Profil ma'lumotlari */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '17px', fontWeight: 800, color: 'var(--ink)' }}>
          👤 Profil ma'lumotlari
        </h3>

        <form onSubmit={handleSaveBizName} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--muted)', marginBottom: '4px' }}>
              Foydalanuvchi nomi (Login)
            </label>
            <input
              type="text"
              disabled
              value={currentUser || ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--ink)',
                fontSize: '14px',
                opacity: 0.8
              }}
            />
          </div>

          {currentAcc.email && (
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--muted)', marginBottom: '4px' }}>
                Elektron pochta (Email)
              </label>
              <input
                type="text"
                disabled
                value={currentAcc.email}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--ink)',
                  fontSize: '14px',
                  opacity: 0.8
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--muted)', marginBottom: '4px' }}>
              Daftar / Do'kon nomi
            </label>
            <input
              type="text"
              value={bizName}
              onChange={e => setBizName(e.target.value)}
              placeholder="Masalan: Umar savdo yoki Shaxsiy daftarcha"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--ink)',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-gold"
            style={{ alignSelf: 'flex-start', padding: '9px 18px', fontWeight: 700, borderRadius: '10px' }}
          >
            Saqlash
          </button>
        </form>
      </div>

      {/* 2. Mavzu va Ko'rinish */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
            🌓 Tizim ko'rinishi
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
            Yorug' yoki qorong'u (tun) rejimini tanlang
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={toggleTheme}
          style={{ fontWeight: 700, borderRadius: '10px' }}
        >
          {db?.theme === 'dark' ? '☀️ Kunduzgi rejim' : '🌙 Tungi rejim'}
        </button>
      </div>

      {/* 3. Zaxira nusxa / Excel */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
            📊 Ma'lumotlarni Excelga olish
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
            Barcha qarzdorlar ro'yxatini CSV/Excel fayl qilib yuklab oling
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleExportCSV}
          style={{ fontWeight: 700, borderRadius: '10px' }}
        >
          📥 Yuklab olish
        </button>
      </div>

      {/* 4. Chiqish */}
      <div style={{
        background: 'var(--surface)',
        border: '1.5px solid rgba(224, 72, 54, 0.25)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#E04836' }}>
            🚪 Tizimdan chiqish
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
            Joriy hisobingizdan xavfsiz chiqasiz
          </div>
        </div>

        <button
          type="button"
          className="btn btn-danger"
          onClick={onLogoutClick}
          style={{ fontWeight: 800, borderRadius: '10px', padding: '10px 20px' }}
        >
          Chiqish
        </button>
      </div>
    </div>
  );
}
