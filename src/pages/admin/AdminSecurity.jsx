import React from 'react';
import { useApp } from '../../contexts/AppContext';

export default function AdminSecurity() {
  const { db, accounts, navigate, toggleUserBlock, setUserRisk } = useApp();

  const securityChecks = [
    { label: 'PIN sozlamasi', value: db?.pinHash ? 'O‘rnatilgan' : 'Yo‘q' },
    { label: 'Avtomatik qulflash', value: `${db?.autoLockMinutes || 5} daqiqa` },
    { label: 'Yosh tasdiqi', value: db?.ageConfirmed ? 'Tasdiqlangan' : 'Tasdiqlanmagan' },
    { label: 'Hisoblar soni', value: `${accounts.length} ta` },
  ];

  return (
    <div className="admin-grid">
      <div className="admin-card">
        <div className="admin-section-title">Xavfsizlik tekshiruvlari</div>
        <div className="admin-check-list">
          {securityChecks.map((item) => (
            <div key={item.label} className="admin-check-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-section-title">Nazorat choralari</div>
        <div className="admin-note">
          VPN, noqonuniy foydalanish yoki xavfli holatlar aniqlanganda foydalanuvchini bloklash, PIN-ni qayta tiklash yoki ma’lumotlarni tekshirish uchun bu bo‘limdan harakat qilinadi. Bu ilova brauzerda ishlagani uchun haqiqiy tarmoq darajasidagi VPN aniqlash imkonsiz; lekin xavfli hisoblarni mahalliy nazorat ro‘yxatga olish va bloklash qilish mumkin.
        </div>
        <div className="admin-actions">
          {accounts.slice(0, 3).map((account) => (
            <button key={account.username} className="btn btn-outline btn-sm" onClick={() => toggleUserBlock(account.username)}>
              {account.username}: {account.isBlocked ? 'Bloklangan' : 'Faol'}
            </button>
          ))}
          <button className="btn btn-outline btn-sm" onClick={() => navigate('admin-users')}>Foydalanuvchilar ro‘yxati</button>
        </div>
        <div className="admin-actions" style={{ marginTop: '12px' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setUserRisk(accounts[0]?.username, 'suspicious')}>Birinchi hisobni xavfli deb belgilash</button>
        </div>
      </div>
    </div>
  );
}
