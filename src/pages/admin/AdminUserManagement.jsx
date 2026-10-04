import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { fmtDate, initials, fmtMoney, getApiBase } from '../../utils/helpers';
import { storage } from '../../utils/storage';
import UserInspectorModal from '../../components/modals/UserInspectorModal';

export default function AdminUserManagement() {
  const {
    accounts, adminBlockUser, adminUnblockUser,
    adminResetUserPassword, adminDeleteUser, adminCreateUser,
    currentUser, loadAccountsFromStorage
  } = useApp();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newBizName, setNewBizName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [creating, setCreating] = useState(false);

  const [selectedUserForPass, setSelectedUserForPass] = useState(null);
  const [newPassInput, setNewPassInput] = useState('123456');

  const [userToDelete, setUserToDelete] = useState(null);
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
            const transactions = data.transactions || [];
            let totalOwed = 0;
            let totalPaid = 0;
            for (const c of clients) {
              let bal = 0;
              for (const t of transactions) {
                if (t.clientId !== c.id) continue;
                const amt = Number(t.amount) || 0;
                bal += t.type === 'debt' ? amt : -amt;
                if (t.type === 'payment') totalPaid += amt;
              }
              if (bal > 0) totalOwed += bal;
            }
            stats[acc.username] = { clients: clients.length, totalOwed, totalPaid };
          } else {
            stats[acc.username] = { clients: 0, totalOwed: 0, totalPaid: 0 };
          }
        } catch (e) {
          stats[acc.username] = { clients: 0, totalOwed: 0, totalPaid: 0 };
        }
      }
      setUserStats(stats);
    }
    if (accounts.length > 0) loadStats();
  }, [accounts]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      toast('Login va parolni kiriting', 'error');
      return;
    }
    setCreating(true);
    try {
      await adminCreateUser(newUsername, newBizName, newEmail, newPassword, newRole);
      setShowAddModal(false);
      setNewUsername('');
      setNewBizName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
    } catch (err) {
      toast(err.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleResetPass = async () => {
    if (!selectedUserForPass || !newPassInput.trim()) return;
    await adminResetUserPassword(selectedUserForPass.username, newPassInput);
    setSelectedUserForPass(null);
    setNewPassInput('123456');
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    await adminDeleteUser(userToDelete.username);
    setUserToDelete(null);
  };

  let filtered = accounts.slice();
  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(a =>
      (a.username || '').toLowerCase().includes(q) ||
      (a.businessName || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q)
    );
  }

  if (statusFilter === 'active') filtered = filtered.filter(a => a.status !== 'banned');
  if (statusFilter === 'banned') filtered = filtered.filter(a => a.status === 'banned');

  const totalUsers = accounts.length;
  const activeUsers = accounts.filter(a => a.status !== 'banned').length;
  const bannedUsers = accounts.filter(a => a.status === 'banned').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        <div style={{ background: 'var(--surface)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Jami foydalanuvchilar</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)', marginTop: '2px' }}>{totalUsers} ta</div>
        </div>
        <div style={{ background: 'var(--surface)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Faol hisoblar</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#1F6E5C', marginTop: '2px' }}>{activeUsers} ta</div>
        </div>
        <div style={{ background: 'var(--surface)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Bloklanganlar</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#E04836', marginTop: '2px' }}>{bannedUsers} ta</div>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Add Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="🔍 Ism, login yoki email bo'yicha qidirish..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1.5px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--ink)',
              fontSize: '13.5px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Barchasi ({accounts.length})
          </button>
          <button
            type="button"
            className={`chip ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Faol ({activeUsers})
          </button>
          <button
            type="button"
            className={`chip ${statusFilter === 'banned' ? 'active' : ''}`}
            onClick={() => setStatusFilter('banned')}
          >
            Bloklangan ({bannedUsers})
          </button>

          <button
            type="button"
            className="btn btn-gold"
            onClick={() => setShowAddModal(true)}
            style={{ padding: '9px 16px', fontWeight: 800, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>➕</span> Yangi Foydalanuvchi
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ overflowX: 'auto', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <table className="admin-user-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 14px', textAlign: 'left', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>Foydalanuvchi</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>Biznes / Do'kon</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>Roli</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>Qarzdorlar</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>Jami Qarz</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>Holati</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>Boshqaruv Amallari</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  Foydalanuvchilar topilmadi
                </td>
              </tr>
            ) : (
              filtered.map(acc => {
                const isSelf = acc.username === currentUser;
                const isBanned = acc.status === 'banned';
                const st = userStats[acc.username] || { clients: 0, totalOwed: 0 };

                return (
                  <tr key={acc.username} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          background: acc.role === 'admin' ? 'rgba(212, 160, 23, 0.15)' : 'var(--surface-2)',
                          color: acc.role === 'admin' ? 'var(--gold)' : 'var(--ink)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '13px'
                        }}>
                          {initials(acc.businessName || acc.username)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '13.5px' }}>
                            {acc.username}
                            {isSelf && <span style={{ fontSize: '11px', color: 'var(--gold)', marginLeft: '4px' }}>(Siz)</span>}
                          </div>
                          {acc.email && (
                            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{acc.email}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--ink)' }}>
                      {acc.businessName || '—'}
                    </td>

                    <td style={{ padding: '12px 14px', fontSize: '12.5px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        background: acc.role === 'admin' ? 'rgba(212,160,23,0.15)' : 'var(--surface-2)',
                        color: acc.role === 'admin' ? 'var(--gold)' : 'var(--muted)'
                      }}>
                        {acc.role === 'admin' ? '⚡ Super Admin' : 'Foydalanuvchi'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700 }}>
                      👥 {st.clients} ta
                    </td>

                    <td style={{ padding: '12px 14px', fontSize: '13.5px', fontWeight: 800, color: st.totalOwed > 0 ? '#1F6E5C' : 'var(--muted)' }}>
                      {fmtMoney(st.totalOwed)} so'm
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '4px 9px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        background: isBanned ? 'rgba(224, 72, 54, 0.15)' : 'rgba(31, 110, 92, 0.15)',
                        color: isBanned ? '#E04836' : '#1F6E5C'
                      }}>
                        {isBanned ? '🚫 Bloklangan' : '✓ Faol'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          title="Qarz daftarini ko'rish"
                          onClick={() => setInspectUsername(acc.username)}
                          style={{ padding: '5px 9px', fontSize: '12px', fontWeight: 700 }}
                        >
                          👁️ Ko'rish
                        </button>

                        {!isSelf && acc.role !== 'admin' && (
                          isBanned ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-teal"
                              onClick={() => adminUnblockUser(acc.username)}
                              style={{ padding: '5px 9px', fontSize: '12px', fontWeight: 700 }}
                            >
                              ✓ Faollashtirish
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => adminBlockUser(acc.username)}
                              style={{ padding: '5px 9px', fontSize: '12px', fontWeight: 700, color: '#E04836', borderColor: 'rgba(224,72,54,0.3)' }}
                            >
                              🚫 Bloklash
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          title="Parolni o'zgartirish"
                          onClick={() => {
                            setSelectedUserForPass(acc);
                            setNewPassInput('123456');
                          }}
                          style={{ padding: '5px 9px', fontSize: '12px' }}
                        >
                          🔑 Parol
                        </button>

                        {!isSelf && acc.role !== 'admin' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            title="Foydalanuvchini o'chirish"
                            onClick={() => setUserToDelete(acc)}
                            style={{ padding: '5px 9px', fontSize: '12px', color: '#E04836' }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Modal */}
      {inspectUsername && (
        <UserInspectorModal
          targetUsername={inspectUsername}
          onClose={() => setInspectUsername(null)}
        />
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-head">
              <h3>➕ Yangi foydalanuvchi qo'shish</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form className="modal-body" onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>Login (Foydalanuvchi nomi) *</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: dilshod"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>Biznes / Do'kon nomi</label>
                <input
                  type="text"
                  placeholder="masalan: Dilshod Savdo"
                  value={newBizName}
                  onChange={e => setNewBizName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>Elektron pochta (Email)</label>
                <input
                  type="email"
                  placeholder="masalan: dilshod@gmail.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>Boshlang'ich parol *</label>
                <input
                  type="text"
                  required
                  placeholder="kamida 4 ta belgi"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>Tizimdagi roli</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)' }}
                >
                  <option value="user">Oddiy foydalanuvchi</option>
                  <option value="admin">Super Administrator</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" disabled={creating} className="btn btn-gold" style={{ flex: 1.5, fontWeight: 800 }}>
                  {creating ? 'Yaratilmoqda...' : '✓ Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {selectedUserForPass && (
        <div className="modal-backdrop" onClick={() => setSelectedUserForPass(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-head">
              <h3>🔑 Parolni o'zgartirish</h3>
              <button className="modal-close" onClick={() => setSelectedUserForPass(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
                <b>{selectedUserForPass.username}</b> uchun yangi parolni kiriting:
              </p>
              <input
                type="text"
                value={newPassInput}
                onChange={e => setNewPassInput(e.target.value)}
                style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '14px', marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedUserForPass(null)}>
                  Bekor qilish
                </button>
                <button className="btn btn-gold" style={{ flex: 1.5, fontWeight: 800 }} onClick={handleResetPass}>
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirm Modal */}
      {userToDelete && (
        <div className="modal-backdrop" onClick={() => setUserToDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-head">
              <h3 style={{ color: '#E04836' }}>Foydalanuvchini o'chirish</h3>
              <button className="modal-close" onClick={() => setUserToDelete(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', lineHeight: '1.5', marginBottom: '16px' }}>
                <b>{userToDelete.username}</b> foydalanuvchisi va uning barcha qarzlar daftari butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi. Rozimisiz?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setUserToDelete(null)}>
                  Bekor qilish
                </button>
                <button className="btn btn-danger" style={{ flex: 1, fontWeight: 800 }} onClick={handleDeleteUser}>
                  Ha, o'chirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
