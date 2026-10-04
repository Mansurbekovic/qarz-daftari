import React, { useState } from 'react';
import { useApp } from './contexts/AppContext';

// Auth Component
import AuthScreen from './components/auth/AuthScreen';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import MobileNav from './components/layout/MobileNav';

// Essential Pages
import Dashboard from './pages/Dashboard';
import ClientDetail from './pages/ClientDetail';
import Settings from './pages/Settings';

// Modals
import ClientModal from './components/modals/ClientModal';
import TransactionModal from './components/modals/TransactionModal';

export default function App() {
  const { authState, currentPage, logout, initialized } = useApp();

  // Global Modal States
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);

  const [showTxModal, setShowTxModal] = useState(false);
  const [txModalClientId, setTxModalClientId] = useState(null);
  const [txModalDefaultType, setTxModalDefaultType] = useState('debt');

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!initialized || authState === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0E2419',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'linear-gradient(145deg, #A9821F, #7a5f16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: '22px',
          marginBottom: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.35)'
        }}>
          QD
        </div>
        <div style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '0.04em' }}>Qarz Daftari</div>
        <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '8px' }}>Yuklanmoqda...</div>
      </div>
    );
  }

  if (authState === 'auth') {
    return <AuthScreen />;
  }

  const handleOpenAddClient = () => {
    setEditingClientId(null);
    setShowClientModal(true);
  };

  const handleOpenEditClient = (clientId) => {
    setEditingClientId(clientId);
    setShowClientModal(true);
  };

  const handleOpenTxModal = (clientId, defaultType = 'debt') => {
    setTxModalClientId(clientId);
    setTxModalDefaultType(defaultType);
    setShowTxModal(true);
  };

  return (
    <div className="app-shell" id="app">
      <Sidebar
        onLogoutClick={() => setShowLogoutModal(true)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="main">
        <Topbar
          onOpenAddClient={handleOpenAddClient}
          onOpenMenu={() => setMobileMenuOpen(true)}
        />

        <main className="page">
          {(currentPage === 'dashboard' || currentPage === 'clients') && (
            <Dashboard
              onOpenAddClient={handleOpenAddClient}
              onOpenTxModal={handleOpenTxModal}
            />
          )}

          {currentPage === 'clientDetail' && (
            <ClientDetail
              onOpenTxModal={handleOpenTxModal}
              onOpenEditClient={handleOpenEditClient}
            />
          )}

          {currentPage === 'settings' && (
            <Settings onLogoutClick={() => setShowLogoutModal(true)} />
          )}
        </main>
      </div>

      {/* Mobile Touch Bottom Nav */}
      <MobileNav
        onOpenAddClient={handleOpenAddClient}
      />

      {/* Qarz yozish / Mijoz qo'shish modali */}
      {showClientModal && (
        <ClientModal
          clientId={editingClientId}
          onClose={() => setShowClientModal(false)}
        />
      )}

      {/* Qarz qo'shish yoki To'lov qabul qilish modali */}
      {showTxModal && txModalClientId && (
        <TransactionModal
          clientId={txModalClientId}
          defaultType={txModalDefaultType}
          onClose={() => setShowTxModal(false)}
        />
      )}

      {/* Chiqishni tasdiqlash modali */}
      {showLogoutModal && (
        <div className="modal-backdrop" onClick={() => setShowLogoutModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-head">
              <h3>Chiqishni tasdiqlang</h3>
              <button className="modal-close" onClick={() => setShowLogoutModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', lineHeight: '1.6', marginBottom: '16px', color: 'var(--ink)' }}>
                Hisobingizdan chiqmoqchimisiz? Ma'lumotlaringiz saqlanib qoladi.
              </p>
              <div className="modal-actions" style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowLogoutModal(false)}>
                  Bekor qilish
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowLogoutModal(false);
                    logout();
                  }}
                >
                  Chiqish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
