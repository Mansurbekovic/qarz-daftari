import React from 'react';
import { useApp } from '../../contexts/AppContext';

export default function AdminDashboard() {
  const {
    accounts, systemConfig, toggleSystemLockdown, toggleMaintenance,
    updateSystemConfigValues, systemLogs
  } = useApp();

  const totalUsers = accounts.length;
  const activeUsers = accounts.filter(a => a.status !== 'banned').length;
  const bannedUsers = accounts.filter(a => a.status === 'banned').length;
  const dangerLogs = systemLogs.filter(l => l.severity === 'danger').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* System Alert Banners */}
      {systemConfig.lockdown && (
        <div className="admin-alert-banner">
          <div>
            <b>🚨 FAVQULODDA REJIM (LOCKDOWN) YOQILGAN</b>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
              Administrator vaqtinchalik admin bo'lmagan barcha foydalanuvchilar kirishini chekladi.
            </div>
          </div>
          <button className="btn btn-sm btn-outline" style={{ color: '#fff', borderColor: '#fff' }} onClick={toggleSystemLockdown}>
            Qulflashni o'chirish
          </button>
        </div>
      )}

      {systemConfig.maintenance && (
        <div className="admin-alert-banner green">
          <div>
            <b>🛠 PROFILAKTIKA REJIMI FAOL</b>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
              Tizimda profilaktika va yangilanish ishlari olib borilmoqda.
            </div>
          </div>
          <button className="btn btn-sm btn-outline" onClick={toggleMaintenance}>
            Yakunlash
          </button>
        </div>
      )}

      {/* Main Metric Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Jami foydalanuvchilar</div>
          <div className="stat-value gold">{totalUsers} ta</div>
          <div className="stat-note">Ro'yxatdan o'tgan hisoblar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Faol foydalanuvchilar</div>
          <div className="stat-value teal">{activeUsers} ta</div>
          <div className="stat-note">Normal holatda</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Bloklanganlar</div>
          <div className="stat-value rust">{bannedUsers} ta</div>
          <div className="stat-note">Noqonuniy/xavfli harakatlar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Xavfsizlik hodisalari</div>
          <div className="stat-value rust">{dangerLogs} ta</div>
          <div className="stat-note">Ogohlik signallari</div>
        </div>
      </div>

      {/* Emergency Control Panel */}
      <div className="settings-card">
        <div className="section-title" style={{ marginTop: 0 }}>Favqulodda Nazorat & Kalitlar</div>
        
        <div className="settings-row">
          <div>
            <div className="t" style={{ color: 'var(--rust)' }}>Favqulodda Tizimni Qulflash (System Lockdown)</div>
            <div className="s">Kiberhujum yoki bug aniqlanganda barcha oddiy foydalanuvchilar kirishini darhol bloklaydi</div>
          </div>
          <button
            className={`switch ${systemConfig.lockdown ? 'on' : ''}`}
            onClick={toggleSystemLockdown}
          />
        </div>

        <div className="settings-row">
          <div>
            <div className="t">Profilaktika rejimi (Maintenance Mode)</div>
            <div className="s">Tizim yangilanishi va profilaktika haqida ogohlantirish berish</div>
          </div>
          <button
            className={`switch ${systemConfig.maintenance ? 'on' : ''}`}
            onClick={toggleMaintenance}
          />
        </div>

        <div className="settings-row">
          <div>
            <div className="t">VPN / Proxy avtomatik detektor</div>
            <div className="s">Noqonuniy anonim tarmoqlar orqali kirishni aniqlash va cheklash</div>
          </div>
          <button
            className={`switch ${systemConfig.detectVpnProxy ? 'on' : ''}`}
            onClick={() => updateSystemConfigValues({ detectVpnProxy: !systemConfig.detectVpnProxy })}
          />
        </div>
      </div>

      {/* System Health Status */}
      <div className="settings-card">
        <div className="section-title" style={{ marginTop: 0 }}>Tizim Barqarorligi (System Health)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '10px' }}>
          <div style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Shifrlash Darajasi</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--teal)', marginTop: '4px' }}>SHA-256 Hash Guard</div>
          </div>
          <div style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Ma'lumotlar Saqlanishi</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gold)', marginTop: '4px' }}>Local Storage Enclave</div>
          </div>
          <div style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Anti-Bug / Anti-Spam</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--teal)', marginTop: '4px' }}>Active Rate Limiting</div>
          </div>
        </div>
      </div>
    </div>
  );
}
