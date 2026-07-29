import React from 'react';
import { useApp } from '../../contexts/AppContext';

export default function AdminUsers() {
  const { accounts, db, navigate, toggleUserBlock, setUserRisk } = useApp();

  return (
    <div className="admin-grid">
      <div className="admin-card">
        <div className="admin-section-title">Foydalanuvchilar holati</div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Foydalanuvchi</th>
                <th>Hisob nomi</th>
                <th>Status</th>
                <th>Ma'lumotlar</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const hasData = (db?.clients?.length || 0) > 0 || (db?.transactions?.length || 0) > 0;
                return (
                  <tr key={account.username}>
                    <td>{account.username}</td>
                    <td>{account.businessName || '—'}</td>
                    <td>
                      <span className={`admin-status ${account.isBlocked ? 'danger' : 'ok'}`}>
                        {account.isBlocked ? 'Bloklangan' : 'Faol'}
                      </span>
                    </td>
                    <td>{hasData ? 'Mavjud' : 'Bo‘sh'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-section-title">Tekshiruv nazorati</div>
        <div className="admin-note">
          VPN yoki noma’lum tarmoq holatlari uchun hisobni belgilash, bloklash va tekshirish mumkin. Bu yerda faqat mahalliy xavfsizlik nazorati ishlaydi — real IP/VPN aniqlash brauzer orqali to‘liq amalga oshirilmaydi.
        </div>
        <div className="admin-actions">
          {accounts.map((account) => (
            <div key={account.username} className="admin-check-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <strong>{account.username}</strong>
              <div className="admin-actions" style={{ marginTop: '8px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => toggleUserBlock(account.username)}>
                  {account.isBlocked ? 'Blokni ochish' : 'Bloklash'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setUserRisk(account.username, account.riskLevel === 'suspicious' ? 'clear' : 'suspicious')}>
                  {account.riskLevel === 'suspicious' ? 'Xavfni olib tashlash' : 'Xavfli deb belgilash'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="admin-actions" style={{ marginTop: '12px' }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('admin-security')}>Xavfsizlikni ko‘rish</button>
        </div>
      </div>
    </div>
  );
}
