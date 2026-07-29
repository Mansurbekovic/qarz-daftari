import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import AdminUserManagement from './AdminUserManagement';
import AdminSecurityMonitor from './AdminSecurityMonitor';
import { useApp } from '../../contexts/AppContext';

export default function AdminPanel() {
  const { isAdmin } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'users' | 'security'

  if (!isAdmin) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div className="t">Ruxsat Etilmagan Zone</div>
        <div className="s">Ushbu sahifaga faqat Tizim Administratori kirishi mumkin.</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* 3 Sub-page Tabs Header */}
      <div className="admin-nav-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20V10M11 20V4M18 20v-7" />
          </svg>
          📊 Tizim Statistikasi
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="8" r="3.2" />
            <path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" />
          </svg>
          👥 Foydalanuvchilar
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          🛡️ Xavfsizlik & Monitoring
        </button>
      </div>

      {/* Render Active Sub-Page */}
      {activeTab === 'dashboard' && <AdminDashboard />}
      {activeTab === 'users' && <AdminUserManagement />}
      {activeTab === 'security' && <AdminSecurityMonitor />}
    </div>
  );
}
