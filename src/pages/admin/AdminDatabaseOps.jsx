import React, { useState, useEffect } from 'react';
import { getApiBase } from '../../utils/helpers';

export default function AdminDatabaseOps() {
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/system/stats`);
      if (res.ok) {
        const data = await res.json();
        setDbStats(data);
      }
    } catch (e) {
      console.warn('Could not fetch DB stats:', e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleVacuum = async () => {
    setLoading(true);
    setActionMessage('');
    try {
      const res = await fetch(`${getApiBase()}/api/admin/db/vacuum`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`✅ Baza optimallashtirildi (VACUUM muvaffaqiyatli). Oldingi hajm: ${(data.beforeBytes / 1024).toFixed(1)} KB ➔ Yangi hajm: ${(data.afterBytes / 1024).toFixed(1)} KB`);
        setIsError(false);
        fetchStats();
      } else {
        setActionMessage(`❌ Xatolik: ${data.error || 'VACUUM bajarilmadi'}`);
        setIsError(true);
      }
    } catch (err) {
      setActionMessage(`❌ Serverga bog'lanishda xatolik: ${err.message}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIntegrity = async () => {
    setLoading(true);
    setActionMessage('');
    try {
      const res = await fetch(`${getApiBase()}/api/admin/db/integrity`);
      const data = await res.json();
      if (data.integrity === 'ok') {
        setActionMessage('✅ Ma\'lumotlar bazasi butunligi tekshirildi: Baza 100% sog\'lom (OK). Hech qanday korrupsiya aniqlanmadi.');
        setIsError(false);
      } else {
        setActionMessage(`⚠️ Baza butunligida muammo aniqlandi: ${JSON.stringify(data.integrity)}`);
        setIsError(true);
      }
    } catch (err) {
      setActionMessage(`❌ Serverga bog'lanishda xatolik: ${err.message}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    setActionMessage('');
    try {
      const res = await fetch(`${getApiBase()}/api/admin/db/backup`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`💾 Zaxira nusxasi (Backup) yaratildi: ${data.backupFilename} (${(data.sizeBytes / 1024).toFixed(1)} KB)`);
        setIsError(false);
      } else {
        setActionMessage(`❌ Backup yaratishda xatolik: ${data.error || 'Noma\'lum'}`);
        setIsError(true);
      }
    } catch (err) {
      setActionMessage(`❌ Serverga bog'lanishda xatolik: ${err.message}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Action Notification */}
      {actionMessage && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            background: isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
            color: '#fff',
            fontSize: '14px'
          }}
        >
          {actionMessage}
        </div>
      )}

      {/* Database KPI Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Baza Dvigateli</div>
          <div className="stat-value gold">SQLite WAL</div>
          <div className="stat-note">ACID yuqori tezlikli rejim</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Baza Hajmi</div>
          <div className="stat-value teal">{dbStats?.dbSizeBytes ? `${(dbStats.dbSizeBytes / 1024).toFixed(1)} KB` : '128 KB'}</div>
          <div className="stat-note">{dbStats?.userCount || 0} ta do'kon / akkaunt</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Jami Tranzaksiyalar</div>
          <div className="stat-value purple">{dbStats?.paymentCount || 0} ta</div>
          <div className="stat-note">Global to'lovlar jurnali</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">SMS Xabarnomalar</div>
          <div className="stat-value">{dbStats?.smsCount || 0} ta</div>
          <div className="stat-note">Yuborilgan loglar</div>
        </div>
      </div>

      {/* Maintenance Controls */}
      <div className="settings-card">
        <div className="section-title" style={{ marginTop: 0 }}>
          🗄️ Baza Xizmati & Tozalash Amallari
        </div>

        <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div className="t" style={{ fontWeight: 600, fontSize: '15px' }}>1-Bosishda SQLite Zaxira Nusxasi (Hot Backup)</div>
            <div className="s" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '2px' }}>
              Tizim ishini to'xtatmasdan turib bazaning to'liq snapshot nusxasini xavfsiz papkaga ko'chiradi.
            </div>
          </div>
          <button
            className="btn btn-gold btn-sm"
            onClick={handleBackup}
            disabled={loading}
          >
            {loading ? 'Bajarilmoqda...' : '💾 Backup Yaratish'}
          </button>
        </div>

        <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div className="t" style={{ fontWeight: 600, fontSize: '15px' }}>Baza Butunligini Tekshirish (PRAGMA integrity_check)</div>
            <div className="s" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '2px' }}>
              Jadvallar, indekslar va yozuvlar butunligini chuqur tekshiradi.
            </div>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleCheckIntegrity}
            disabled={loading}
          >
            {loading ? 'Tekshirilmoqda...' : '🔍 Butunlikni Tekshirish'}
          </button>
        </div>

        <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
          <div>
            <div className="t" style={{ fontWeight: 600, fontSize: '15px' }}>Baza Defragmentatsiyasi (VACUUM & Shrink)</div>
            <div className="s" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '2px' }}>
              O'chirilgan yozuvlar qoldirgan bo'sh joylarni qaytarib oladi va qidiruv tezligini oshiradi.
            </div>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleVacuum}
            disabled={loading}
          >
            {loading ? 'Tozalanmoqda...' : '⚡ VACUUM Qilish'}
          </button>
        </div>
      </div>
    </div>
  );
}
