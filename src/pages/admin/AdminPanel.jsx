import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import AdminUserManagement from './AdminUserManagement';
import AdminSecurityMonitor from './AdminSecurityMonitor';
import AdminDatabaseOps from './AdminDatabaseOps';
import AdminBroadcastOps from './AdminBroadcastOps';
import AdminAuditLogs from './AdminAuditLogs';
import { useApp } from '../../contexts/AppContext';

export default function AdminPanel() {
  const { isAdmin } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard'); 
  // 'dashboard' | 'users' | 'database' | 'broadcast' | 'audit' | 'security'

  if (!isAdmin) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div className="t">Ruxsat Etilmagan Hudud</div>
        <div className="s">Ushbu sahifaga faqat qarzdorlar.uz Tizim Super Administratori kirishi mumkin.</div>
      </div>
    );
  }

  return (
    <div className="admin-container" style={{ paddingBottom: '60px' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        padding: '16px 20px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(229,169,60,0.12), rgba(30,58,138,0.2))',
        border: '1px solid rgba(229,169,60,0.25)'
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gold, #E5A93C)' }}>
            ⚡ qarzdorlar.uz — Super Administrator Boshqaruv Markazi
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
            Multi-tenant do'konlar boshqaruvi, SQLite server operatsiyalari va tizim xavfsizlik konsoli
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: '20px',
          background: 'rgba(34, 197, 94, 0.2)',
          color: '#4ade80',
          fontSize: '12px',
          fontWeight: 700,
          border: '1px solid rgba(34, 197, 94, 0.4)'
        }}>
          Tizim Holati: Normal
        </span>
      </div>

      {/* Sub-page Navigation Tabs */}
      <div className="admin-nav-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Tizim Statistikasi
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Do'konlar & Foydalanuvchilar
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          🗄️ Baza & Server Xizmati
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
          onClick={() => setActiveTab('broadcast')}
        >
          📢 Umumiy E'lonlar
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          📝 Audit & Loglar
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🛡️ Qoidalar & Filtrlar
        </button>
      </div>

      {/* Render Selected Sub-Page */}
      {activeTab === 'dashboard' && <AdminDashboard />}
      {activeTab === 'users' && <AdminUserManagement />}
      {activeTab === 'database' && <AdminDatabaseOps />}
      {activeTab === 'broadcast' && <AdminBroadcastOps />}
      {activeTab === 'audit' && <AdminAuditLogs />}
      {activeTab === 'security' && <AdminSecurityMonitor />}
    </div>
  );
}
