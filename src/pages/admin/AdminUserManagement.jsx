import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { fmtDate, initials, fmtMoney, getApiBase } from '../../utils/helpers';
import { storage } from '../../utils/storage';
import UserInspectorModal from '../../components/modals/UserInspectorModal';

export default function AdminUserManagement() {
  const {
    accounts, adminBlockUser, adminUnblockUser,
    adminResetUserPassword, adminResetUserPin, currentUser,
    loadAccountsFromStorage
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);
  const [actionType, setActionType] = useState(null); // 'pass' | 'pin'
  const [newPassInput, setNewPassInput] = useState('123456');
  
  const [inspectUsername, setInspectUsername] = useState(null);
  const [userStats, setUserStats] = useState({});

  useEffect(() => {
    if (loadAccountsFromStorage) {
      loadAccountsFromStorage();
    }
  }, [loadAccountsFromStorage]);

  useEffect(() => {
    async function loadStats() {
      const stats = {};
      for (const acc of accounts) {
        try {
          let data = null;
          const res = await storage.get('qd-db::' + acc.username, false);
          if (res && res.value) {
            data = JSON.parse(res.value);
          }

          try {
            const backendRes = await fetch(`${getApiBase()}/api/users/${acc.username}/db`);
            if (backendRes.ok) {
              const serverData = await backendRes.json();
              if (serverData && Object.keys(serverData).length > 0) {
                data = { ...(data || {}), ...serverData };
              }
            }
          } catch (e) { /* ignore backend offline */ }

          if (data) {
            const clients = data.clients || [];
            const cards = data.cards || [];
            const transactions = data.transactions || [];
            let totalOwed = 0;
            for (const c of clients) {
              let bal = 0;
              for (const t of transactions) {
                if (t.clientId !== c.id) continue;
                bal += t.type === 'debt' ? Number(t.amount) : -Number(t.amount);
              }
              if (bal > 0) totalOwed += bal;
            }
            stats[acc.username] = { clients: clients.length, cards: cards.length, totalOwed };
          } else {
            stats[acc.username] = { clients: 0, cards: 0, totalOwed: 0 };
          }
        } catch (e) {
          stats[acc.username] = { clients: 0, cards: 0, totalOwed: 0 };
        }
      }
      setUserStats(stats);
    }
    if (accounts.length > 0) loadStats();
  }, [accounts]);


  let filtered = accounts.slice();
  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    filtered = filtered.filter(a => a.username.toLowerCase().includes(q) || (a.businessName || '').toLowerCase().includes(q));
  }

  if (statusFilter === 'active') filtered = filtered.filter(a => a.status !== 'banned');
  if (statusFilter === 'banned') filtered = filtered.filter(a => a.status === 'banned');

  const calculateRiskScore = (acc) => {
    if (acc.status === 'banned') return { level: 'banned', label: 'BLOKLANGAN' };
    if (acc.username === 'admin') return { level: 'low', label: 'SUPER ADMIN' };
    // Normal heuristic calculation
    return { level: 'low', label: 'ODDIY' };
  };

  const handleConfirmAction = async () => {
    if (!selectedUserForAction) return;
    if (actionType === 'pass') {
      await adminResetUserPassword(selectedUserForAction.username, newPassInput);
    } else if (actionType === 'pin') {
      await adminResetUserPin(selectedUserForAction.username);
    }
    setSelectedUserForAction(null);
    setActionType(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Toolbar */}
      <div className="client-toolbar">
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Foydalanuvchi nomi yoki biznes nomi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="chip-group">
          <button
            className={`chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Barchasi ({accounts.length})
          </button>
          <button
            className={`chip ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Faol ({accounts.filter(a => a.status !== 'banned').length})
          </button>
          <button
            className={`chip ${statusFilter === 'banned' ? 'active' : ''}`}
            onClick={() => setStatusFilter('banned')}
          >
            Bloklangan ({accounts.filter(a => a.status === 'banned').length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-user-table">
          <thead>
            <tr>
              <th>Foydalanuvchi</th>
              <th>Biznes Nomi</th>
              <th>Roli</th>
              <th>Ro'yxatdan O'tgan</th>
              <th>Mijozlar</th>
              <th>Kartalar</th>
              <th>Umumiy Qarz</th>
              <th>Xavf Holati</th>
              <th>Amallar (Admin Controls)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(acc => {
              const risk = calculateRiskScore(acc);
              const isSelf = acc.username === currentUser;

              return (
                <tr key={acc.username}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                        {initials(acc.businessName || acc.username)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{acc.username}</div>
                        {isSelf && <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700 }}> (Siz)</div>}
                      </div>
                    </div>
                  </td>
                  <td>{acc.businessName || '—'}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: acc.role === 'admin' ? 'var(--gold)' : 'var(--muted)' }}>
                      {acc.role === 'admin' ? '⚡ Administrator' : 'Foydalanuvchi'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    {fmtDate(acc.createdAt)}
                  </td>
                  <td>{userStats[acc.username]?.clients || 0}</td>
                  <td>{userStats[acc.username]?.cards || 0}</td>
                  <td style={{ fontWeight: 600, color: 'var(--red)' }}>
                    {fmtMoney(userStats[acc.username]?.totalOwed || 0)} so'm
                  </td>
                  <td>
                    <span className={`risk-badge ${risk.level}`}>
                      {risk.label}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => setInspectUsername(acc.username)}
                      >
                        📊 Inspect
                      </button>
                      
                      {acc.status === 'banned' ? (
                        <button
                          className="btn btn-sm btn-teal"
                          onClick={() => adminUnblockUser(acc.username)}
                        >
                          ✅ Unban
                        </button>
                      ) : (
                        !isSelf && acc.role !== 'admin' && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => adminBlockUser(acc.username)}
                          >
                            🚫 Bloklash
                          </button>
                        )
                      )}

                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          setSelectedUserForAction(acc);
                          setActionType('pass');
                        }}
                      >
                        🔑 Parol nollash
                      </button>

                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          setSelectedUserForAction(acc);
                          setActionType('pin');
                        }}
                      >
                        🔓 PIN nollash
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      {selectedUserForAction && actionType && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>
                {actionType === 'pass' && `${selectedUserForAction.username} parolini nollash`}
                {actionType === 'pin' && `${selectedUserForAction.username} PIN-kodini nollash`}
              </h3>
              <button className="modal-close" onClick={() => setSelectedUserForAction(null)}>✕</button>
            </div>
            <div className="modal-body">
              {actionType === 'pass' && (
                <>
                  <p style={{ marginBottom: '14px', fontSize: '13px' }}>
                    Foydalanuvchi uchun yangi vaqtinchalik parol kiriting:
                  </p>
                  <div className="form-field">
                    <label>Yangi parol</label>
                    <input
                      type="text"
                      value={newPassInput}
                      onChange={e => setNewPassInput(e.target.value)}
                    />
                  </div>
                </>
              )}

              {actionType === 'pin' && (
                <p style={{ marginBottom: '14px', fontSize: '13px', lineHeight: 1.5 }}>
                  Foydalanuvchining PIN-kodi tozalanadi. Keyingi safar ilovaga kirganda unga yangi PIN-kod o'rnatish taklif etiladi.
                </p>
              )}

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setSelectedUserForAction(null)}>Bekor qilish</button>
                <button className="btn btn-gold" onClick={handleConfirmAction}>Tasdiqlash</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {inspectUsername && (
        <UserInspectorModal 
          targetUsername={inspectUsername} 
          onClose={() => setInspectUsername(null)} 
        />
      )}
    </div>
  );
}
