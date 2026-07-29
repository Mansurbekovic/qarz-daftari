import React from 'react';
import { useApp } from '../../contexts/AppContext';

export default function AdminContent() {
  const { db, navigate } = useApp();

  return (
    <div className="admin-grid">
      <div className="admin-card">
        <div className="admin-section-title">Kontent va sozlamalar</div>
        <div className="admin-note">
          Bu yerda biznes nomi, valyuta, avtomatik qulflash, bildirishnomalar va boshqa asosiy parametrlar ko‘riladi va boshqariladi.
        </div>
        <div className="admin-check-list">
          <div className="admin-check-item">
            <span>Biznes nomi</span>
            <strong>{db?.businessName || '—'}</strong>
          </div>
          <div className="admin-check-item">
            <span>Valyuta</span>
            <strong>{db?.currency || 'so‘m'}</strong>
          </div>
          <div className="admin-check-item">
            <span>Bildirishnomalar</span>
            <strong>{db?.notifications ? 'Yoqilgan' : 'O‘chirilgan'}</strong>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-section-title">Boshqaruv</div>
        <div className="admin-actions">
          <button className="btn btn-gold btn-sm" onClick={() => navigate('settings')}>Sozlamalar sahifasiga o‘tish</button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('admin-dashboard')}>Admin bosh sahifa</button>
        </div>
      </div>
    </div>
  );
}
