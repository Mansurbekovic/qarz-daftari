import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { fmtMoney, fmtDate, initials } from '../../utils/helpers';
import { storage } from '../../utils/storage';

export default function UserInspectorModal({ targetUsername, onClose }) {
  const { adminBlockUser, adminUnblockUser, adminResetUserPassword, adminResetUserPin, accounts } = useApp();
  const { showToast } = useToast();
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const targetAccount = accounts.find(a => a.username === targetUsername);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await storage.get('qd-db::' + targetUsername, false);
        if (res && res.value) {
          setUserData(JSON.parse(res.value));
        } else {
          setError("Foydalanuvchi ma'lumotlari topilmadi.");
        }
      } catch (err) {
        console.error(err);
        setError('Xatolik yuz berdi.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [targetUsername]);

  const handleBlockToggle = () => {
    if (!targetAccount) return;
    if (targetAccount.status === 'blocked') {
      adminUnblockUser(targetUsername);
      showToast('Foydalanuvchi blokdan chiqarildi', 'success');
    } else {
      adminBlockUser(targetUsername);
      showToast('Foydalanuvchi bloklandi', 'warning');
    }
  };

  const handleResetPassword = () => {
    adminResetUserPassword(targetUsername);
    showToast('Parol tiklandi', 'success');
  };

  const handleResetPin = () => {
    adminResetUserPin(targetUsername);
    showToast('PIN kod tiklandi', 'success');
  };

  // Stats calculation
  const clients = userData?.clients || [];
  const cards = userData?.cards || [];
  const history = userData?.history || [];

  const totalClients = clients.length;
  let totalDebts = 0;
  let totalOwed = 0;

  clients.forEach(c => {
    if (c.balance > 0) totalDebts += c.balance;
    if (c.balance < 0) totalOwed += Math.abs(c.balance);
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: '95%', maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2 style={{ fontSize: '20px', margin: 0 }}>Foydalanuvchi: {targetUsername}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <p>Yuklanmoqda...</p>
          ) : error ? (
            <p style={{ color: '#f87171' }}>{error}</p>
          ) : (
            <>
              {/* Profile info */}
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <div className="avatar" style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                  {initials(targetAccount?.businessName || targetUsername)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{targetAccount?.businessName || "Noma'lum biznes"}</h3>
                  <p style={{ margin: '5px 0 0', opacity: 0.7, fontSize: '14px' }}>
                    Holat: <span className={targetAccount?.status === 'blocked' ? 'risk-badge' : ''} style={targetAccount?.status !== 'blocked' ? {color: '#4ade80'} : {}}>{targetAccount?.status === 'blocked' ? 'Bloklangan' : 'Faol'}</span> | Rol: {targetAccount?.role}
                  </p>
                  <p style={{ margin: '5px 0 0', opacity: 0.7, fontSize: '14px' }}>
                    Ro'yxatdan o'tgan: {targetAccount?.createdAt ? fmtDate(targetAccount.createdAt) : "Noma'lum"}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="stat-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card">
                  <div className="stat-label">Mijozlar</div>
                  <div className="stat-value">{totalClients}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Haqdorlik</div>
                  <div className="stat-value" style={{ color: '#4ade80' }}>{fmtMoney(totalDebts)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Qarzdorlik</div>
                  <div className="stat-value" style={{ color: '#f87171' }}>{fmtMoney(totalOwed)}</div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
                <button className={`btn btn-sm ${targetAccount?.status === 'blocked' ? 'btn-gold' : 'btn-danger'}`} onClick={handleBlockToggle}>
                  {targetAccount?.status === 'blocked' ? 'Blokdan chiqarish' : 'Bloklash'}
                </button>
                <button className="btn btn-sm btn-outline" onClick={handleResetPassword}>Parolni tiklash</button>
                <button className="btn btn-sm btn-outline" onClick={handleResetPin}>PIN kodni tiklash</button>
                <button className="btn btn-sm btn-danger">Hisobni o'chirish</button>
              </div>

              {/* Clients */}
              <h3 className="section-title">Mijozlar ({Math.min(clients.length, 5)}/{clients.length})</h3>
              <div className="ledger-card" style={{ marginBottom: '20px' }}>
                {clients.slice(0, 5).map(c => (
                  <div className="ledger-row" key={c.id}>
                    <div className="avatar">{initials(c.name)}</div>
                    <div className="row-main">
                      <div className="row-title">{c.name}</div>
                      <div className="row-sub">{c.phone || "Noma'lum raqam"}</div>
                    </div>
                    <div className="row-amount" style={{ color: c.balance >= 0 ? '#4ade80' : '#f87171' }}>
                      {c.balance > 0 ? '+' : ''}{fmtMoney(c.balance)}
                    </div>
                  </div>
                ))}
                {clients.length === 0 && <p style={{ padding: '15px', opacity: 0.5, margin: 0, textAlign: 'center' }}>Mijozlar yo'q</p>}
              </div>

              {/* Cards */}
              <h3 className="section-title">Kartalar</h3>
              <div className="ledger-card" style={{ marginBottom: '20px' }}>
                {cards.map(c => (
                  <div className="ledger-row" key={c.id}>
                    <div className="row-main">
                      <div className="row-title">{c.name}</div>
                      <div className="row-sub">{c.number}</div>
                    </div>
                    <div className="row-amount" style={{ color: '#4ade80' }}>{fmtMoney(c.balance)}</div>
                  </div>
                ))}
                {cards.length === 0 && <p style={{ padding: '15px', opacity: 0.5, margin: 0, textAlign: 'center' }}>Kartalar yo'q</p>}
              </div>

              {/* Recent History */}
              <h3 className="section-title">So'nggi tranzaksiyalar</h3>
              <div className="ledger-card">
                {history.slice(0, 10).map(h => (
                  <div className="ledger-row" key={h.id}>
                    <div className="row-main">
                      <div className="row-title">{h.desc || h.type}</div>
                      <div className="row-sub">{fmtDate(h.date)}</div>
                    </div>
                    <div className="row-amount" style={{ color: h.type === 'payment' || h.amount > 0 ? '#4ade80' : '#f87171' }}>
                      {fmtMoney(Math.abs(h.amount))}
                    </div>
                  </div>
                ))}
                {history.length === 0 && <p style={{ padding: '15px', opacity: 0.5, margin: 0, textAlign: 'center' }}>Tarix bo'sh</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
