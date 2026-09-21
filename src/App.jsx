import React, { useState } from 'react';
import { useApp } from './contexts/AppContext';

// Auth Components
import AuthScreen from './components/auth/AuthScreen';
import LockScreen from './components/auth/LockScreen';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import MobileNav from './components/layout/MobileNav';

// Pages (Code-split with React.lazy for high performance)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Clients = React.lazy(() => import('./pages/Clients'));
const Messages = React.lazy(() => import('./pages/Messages'));
const DebtRequests = React.lazy(() => import('./pages/DebtRequests'));
const ClientDetail = React.lazy(() => import('./pages/ClientDetail'));
const Transactions = React.lazy(() => import('./pages/Transactions'));
const Kassa = React.lazy(() => import('./pages/Kassa'));
const Warehouse = React.lazy(() => import('./pages/Warehouse'));
const Suppliers = React.lazy(() => import('./pages/Suppliers'));
const Invoices = React.lazy(() => import('./pages/Invoices'));
const Branches = React.lazy(() => import('./pages/Branches'));
const Employees = React.lazy(() => import('./pages/Employees'));
const Reminders = React.lazy(() => import('./pages/Reminders'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Subscriptions = React.lazy(() => import('./pages/Subscriptions'));
const ClientPortal = React.lazy(() => import('./pages/ClientPortal'));
const Wallet = React.lazy(() => import('./pages/Wallet'));
const Stats = React.lazy(() => import('./pages/Stats'));
const Settings = React.lazy(() => import('./pages/Settings'));
const AdminPanel = React.lazy(() => import('./pages/admin/AdminPanel'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      color: 'var(--muted)',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '3px solid rgba(169, 130, 31, 0.2)',
        borderTopColor: 'var(--primary)',
        animation: 'spin 0.8s linear infinite'
      }} />
      <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em' }}>Sahifa yuklanmoqda...</div>
    </div>
  );
}

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
          <React.Suspense fallback={<PageLoader />}>
            {currentPage === 'dashboard' && (
              <Dashboard onOpenAddClient={handleOpenAddClient} />
            )}
            {currentPage === 'clients' && (
              <Clients onOpenAddClient={handleOpenAddClient} />
            )}
            {currentPage === 'messages' && <Messages />}
            {currentPage === 'debtRequests' && <DebtRequests />}
            {currentPage === 'clientDetail' && (
              <ClientDetail
                onOpenTxModal={handleOpenTxModal}
                onOpenEditClient={handleOpenEditClient}
              />
            )}
            {currentPage === 'warehouse' && <Warehouse />}
            {currentPage === 'kassa' && <Kassa />}
            {currentPage === 'suppliers' && <Suppliers />}
            {currentPage === 'invoices' && <Invoices />}
            {currentPage === 'branches' && <Branches />}
            {currentPage === 'employees' && <Employees />}
            {currentPage === 'reminders' && <Reminders />}
            {currentPage === 'reports' && <Reports />}
            {currentPage === 'subscriptions' && <Subscriptions />}
            {currentPage === 'clientPortal' && <ClientPortal />}
            {currentPage === 'transactions' && <Transactions />}
            {currentPage === 'wallet' && <Wallet />}
            {currentPage === 'stats' && <Stats />}
            {currentPage === 'settings' && (
              <Settings onLogoutClick={() => setShowLogoutModal(true)} />
            )}
            {currentPage === 'admin' && <AdminPanel />}
          </React.Suspense>
        </main>
      </div>

      {/* Mobile Touch-Friendly Bottom Navigation Bar */}
      <MobileNav onOpenMenu={() => setMobileMenuOpen(true)} />

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
