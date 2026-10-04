import React, { useState } from 'react';
import AdminUserManagement from './AdminUserManagement';
import AdminFinancialReports from './AdminFinancialReports';
import AdminAuditLogs from './AdminAuditLogs';
import AdminSystemSettings from './AdminSystemSettings';
import AdminAnalytics from './AdminAnalytics';
import { useApp } from '../../contexts/AppContext';

export default function AdminPanel({ onBackToNotebook }) {
  const { isAdmin, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('users'); 
  // 'users' | 'finances' | 'audit' | 'settings' | 'analytics'

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
        <h2 style={{ color: '#E04836', margin: '0 0 8px' }}>Ruxsat Etilmagan Hudud</h2>
        <p style={{ maxWidth: '420px', margin: '0 auto', fontSize: '14px', lineHeight: '1.5' }}>
          Ushbu sahifaga faqat platforma Administratori kirishi mumkin.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Banner with back button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        padding: '16px 20px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.15), rgba(15, 30, 20, 0.3))',
        border: '1px solid rgba(212, 160, 23, 0.35)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #D4A017 0%, #8A6109 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 900
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ink)' }}>
              Qarz Daftari — Tizim Administratori Boshqaruv Paneli
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
              Barcha foydalanuvchilar, qarzlar balansi, xavfsizlik auditi va tizim sozlamalari markazi
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onBackToNotebook && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onBackToNotebook}
              style={{ fontWeight: 800, borderRadius: '9px', background: 'var(--surface)' }}
            >
              ← Qarz daftariga qaytish
            </button>
          )}
          <span style={{
            padding: '5px 12px',
            borderRadius: '20px',
            background: 'rgba(31, 110, 92, 0.15)',
            color: '#1F6E5C',
            fontSize: '12px',
            fontWeight: 800,
            border: '1px solid rgba(31, 110, 92, 0.3)'
          }}>
            ● Admin: {currentUser}
          </span>
        </div>
      </div>

      {/* 5 Main Admin Pillars Navigation Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: '6px',
        borderRadius: '14px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          style={{
            flex: '1 1 180px',
            padding: '11px 14px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'users' ? '#D4A017' : 'transparent',
            color: activeTab === 'users' ? '#fff' : 'var(--muted)',
            transition: 'all 0.15s ease'
          }}
        >
          👥 1. Foydalanuvchilar & Do'konlar
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'finances' ? 'active' : ''}`}
          onClick={() => setActiveTab('finances')}
          style={{
            flex: '1 1 180px',
            padding: '11px 14px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'finances' ? '#D4A017' : 'transparent',
            color: activeTab === 'finances' ? '#fff' : 'var(--muted)',
            transition: 'all 0.15s ease'
          }}
        >
          💰 2. Qarzlar & Moliyaviy Nazorat
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
          style={{
            flex: '1 1 180px',
            padding: '11px 14px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'audit' ? '#D4A017' : 'transparent',
            color: activeTab === 'audit' ? '#fff' : 'var(--muted)',
            transition: 'all 0.15s ease'
          }}
        >
          🛡️ 3. Xavfsizlik & Audit Jurnali
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          style={{
            flex: '1 1 180px',
            padding: '11px 14px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'settings' ? '#D4A017' : 'transparent',
            color: activeTab === 'settings' ? '#fff' : 'var(--muted)',
            transition: 'all 0.15s ease'
          }}
        >
          ⚙️ 4. Tizim Sozlamalari & SMS
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
          style={{
            flex: '1 1 180px',
            padding: '11px 14px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'analytics' ? '#D4A017' : 'transparent',
            color: activeTab === 'analytics' ? '#fff' : 'var(--muted)',
            transition: 'all 0.15s ease'
          }}
        >
          📈 5. Statistika & Analitika
        </button>
      </div>

      {/* Render Selected Pillar */}
      {activeTab === 'users' && <AdminUserManagement />}
      {activeTab === 'finances' && <AdminFinancialReports />}
      {activeTab === 'audit' && <AdminAuditLogs />}
      {activeTab === 'settings' && <AdminSystemSettings />}
      {activeTab === 'analytics' && <AdminAnalytics />}
    </div>
  );
}
