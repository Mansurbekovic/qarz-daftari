import React, { useState, useEffect } from 'react';
import { getApiBase } from '../../utils/helpers';

export default function AdminBroadcastOps() {
  const [message, setMessage] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [type, setType] = useState('info'); // 'info' | 'warning' | 'danger'
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetchBroadcast();
  }, []);

  const fetchBroadcast = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/admin/broadcast`);
      if (res.ok) {
        const data = await res.json();
        setMessage(data.message || '');
        setEnabled(Boolean(data.enabled));
        setType(data.type || 'info');
      }
    } catch (e) {
      console.warn('Could not fetch broadcast:', e);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await fetch(`${getApiBase()}/api/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, enabled, type })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('✅ Umumtizim e\'lon banneri muvaffaqiyatli saqlandi!');
      } else {
        setStatusMsg('❌ Saqlashda xatolik yuz berdi');
      }
    } catch (err) {
      setStatusMsg(`❌ Serverga ulanishda xatolik: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {statusMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          color: '#fff',
          fontSize: '14px'
        }}>
          {statusMsg}
        </div>
      )}

      {/* Live Preview */}
      <div className="settings-card">
        <div className="section-title" style={{ marginTop: 0 }}>
          📢 Jonli Ko'rinish (Live Preview)
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
          Ushbu banner barcha faol do'konlar va mijozlar ekranining yuqorisida ko'rinadi:
        </div>

        {enabled ? (
          <div style={{
            padding: '14px 20px',
            borderRadius: '10px',
            background: type === 'danger' ? 'rgba(239, 68, 68, 0.2)' : type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            border: `1px solid ${type === 'danger' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>
              {type === 'danger' ? '🚨' : type === 'warning' ? '⚠️' : '📢'}
            </span>
            <div style={{ flex: 1, fontSize: '14px', lineHeight: 1.4 }}>
              {message || 'E\'lon matni kiritilmagan'}
            </div>
          </div>
        ) : (
          <div style={{
            padding: '14px 20px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            fontSize: '13px'
          }}>
            Umumtizim e'loni hozirda o'chirilgan holatda.
          </div>
        )}
      </div>

      {/* Form Settings */}
      <div className="settings-card">
        <div className="section-title" style={{ marginTop: 0 }}>
          ⚙️ E'lon Sozlamalari
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="t" style={{ fontWeight: 600 }}>E'lonni hammaga ko'rsatish</div>
              <div className="s" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                Yoqilganda tizimga kirgan barcha foydalanuvchilar ekranida paydo bo'ladi
              </div>
            </div>
            <button
              type="button"
              className={`switch ${enabled ? 'on' : ''}`}
              onClick={() => setEnabled(!enabled)}
            />
          </div>

          <div className="form-field">
            <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block', color: 'rgba(255,255,255,0.8)' }}>
              Banner Turi & Rangi
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`btn btn-sm ${type === 'info' ? 'btn-gold' : 'btn-outline'}`}
                onClick={() => setType('info')}
              >
                ℹ️ Axborot (Moviy)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${type === 'warning' ? 'btn-gold' : 'btn-outline'}`}
                onClick={() => setType('warning')}
              >
                ⚠️ Ogohlantirish (Sariq)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${type === 'danger' ? 'btn-gold' : 'btn-outline'}`}
                onClick={() => setType('danger')}
              >
                🚨 Favqulodda (Qizil)
              </button>
            </div>
          </div>

          <div className="form-field">
            <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block', color: 'rgba(255,255,255,0.8)' }}>
              E'lon Matni (O'zbek tilida)
            </label>
            <textarea
              rows="3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Masalan: Bugun soat 23:00 dan 01:00 gacha serverda profilaktika ishlari olib boriladi..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-gold"
            style={{ alignSelf: 'flex-start', padding: '10px 24px' }}
            disabled={loading}
          >
            {loading ? 'Saqlanmoqda...' : '💾 E\'lonni Saqlash & Tarqatish'}
          </button>
        </form>
      </div>
    </div>
  );
}
