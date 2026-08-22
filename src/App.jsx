import React, { useState } from 'react';
import { useApp } from './contexts/AppContext';

// Auth Components
import AuthScreen from './components/auth/AuthScreen';
import LockScreen from './components/auth/LockScreen';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';

// Pages
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Transactions from './pages/Transactions';
import Kassa from './pages/Kassa';
import Wallet from './pages/Wallet';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import AdminPanel from './pages/admin/AdminPanel';

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
        <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '8px' }}>Xavfsiz hisob-kitob tizimi yuklanmoqda...</div>
      </div>
    );
  }

  if (authState === 'auth') {
    return <AuthScreen />;
  }

  if (authState === 'pin') {
    return <LockScreen />;
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
      <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />

      <div className="main">
        <Topbar onOpenAddClient={handleOpenAddClient} />

        <main className="page">
          {currentPage === 'dashboard' && (
            <Dashboard onOpenAddClient={handleOpenAddClient} />
          )}
          {currentPage === 'clients' && (
            <Clients onOpenAddClient={handleOpenAddClient} />
          )}
          {currentPage === 'clientDetail' && (
            <ClientDetail
              onOpenTxModal={handleOpenTxModal}
              onOpenEditClient={handleOpenEditClient}
            />
          )}
          {currentPage === 'kassa' && <Kassa />}
          {currentPage === 'transactions' && <Transactions />}
          {currentPage === 'wallet' && <Wallet />}
          {currentPage === 'stats' && <Stats />}
          {currentPage === 'settings' && (
            <Settings onLogoutClick={() => setShowLogoutModal(true)} />
          )}
          {currentPage === 'admin' && <AdminPanel />}
        </main>
      </div>

      {/* Global Client Modal */}
      {showClientModal && (
        <ClientModal
          clientId={editingClientId}
          onClose={() => setShowClientModal(false)}
        />
      )}

      {/* Global Transaction Modal */}
      {showTxModal && txModalClientId && (
        <TransactionModal
          clientId={txModalClientId}
          defaultType={txModalDefaultType}
          onClose={() => setShowTxModal(false)}
        />
      )}

      {/* Global Logout Confirm Modal */}
      {showLogoutModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>Chiqishni tasdiqlang</h3>
              <button className="modal-close" onClick={() => setShowLogoutModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', lineHeight: '1.6', marginBottom: '16px' }}>
                Joriy hisobdan chiqasiz. Ma'lumotlaringiz saqlanib qoladi, keyingi safar shu login/parol bilan qayta kirishingiz mumkin.
              </p>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowLogoutModal(false)}>Bekor qilish</button>
                <button
                  className="btn btn-danger"
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
