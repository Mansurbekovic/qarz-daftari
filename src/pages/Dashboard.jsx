import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { fmtMoney, fmtDate, initials } from '../utils/helpers';

export default function Dashboard({ onOpenAddClient }) {
  const { db, totals, totalCardBalance, navigate, clientBalance, clientIsOverdue } = useApp();

  if (!db) return null;

  const t = totals();
  const recent = [...(db.transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const overdueClients = (db.clients || []).filter(c => clientIsOverdue(c.id));
  const branches = db?.branches || [];
  const currentBranch = branches.find(b => b.id === (db?.currentBranchId || 'main')) || branches[0];

  // Currency converter state
  const [usdRate] = useState(db?.exchangeRate || 12850);
  const [usdInput, setUsdInput] = useState('');
  const [uzsInput, setUzsInput] = useState('');

  const handleUsdChange = (val) => {
    setUsdInput(val);
    if (!val || isNaN(val)) setUzsInput('');
    else setUzsInput(Math.round(Number(val) * usdRate));
  };

  const handleUzsChange = (val) => {
    setUzsInput(val);
    if (!val || isNaN(val)) setUsdInput('');
    else setUsdInput((Number(val) / usdRate).toFixed(2));
  };

  const txLabel = (tx, client) => {
    const iowe = client && client.relation === 'i_owe';
    if (tx.type === 'debt') return iowe ? 'Qarz oldim' : 'Qarz berdim';
    return iowe ? 'Qarzni qaytardim' : "To'lov qabul qildim";
  };

  return (
    <div>
      {/* Branch & Subscription Header Strip */}
      <div style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🏪</span>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              FAOL SAVDO NUQTASI
            </div>
            <div style={{ fontWeight: 800, fontSize: '14px' }}>
              {currentBranch?.name || 'Bosh savdo markazi'}
              {branches.length > 1 && (
                <span style={{ fontSize: '12px', color: 'var(--gold)', marginLeft: '6px', cursor: 'pointer' }} onClick={() => navigate('branches')}>
                  ({branches.length} ta filial) ⇄
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-sm btn-outline"
            style={{ fontSize: '12px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => navigate('subscriptions')}
          >
            <span>👑</span>
            <span>{(db?.subscription?.plan || 'pro').toUpperCase()} TARIF</span>
          </button>
          <button
            className="btn btn-sm btn-gold"
            onClick={onOpenAddClient}
          >
            + Yangi Mijoz
          </button>
        </div>
      </div>

      {/* Main Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Menga qarzdorlar</div>
          <div className="stat-value rust">{fmtMoney(t.owedToMe, db.currency)}</div>
          <div className="stat-note">Mijozlar sizga qarzdor</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Men qarzdorman</div>
          <div className="stat-value teal">{fmtMoney(t.iOwe, db.currency)}</div>
          <div className="stat-note">Siz boshqalarga qarzdorsiz</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sof holat</div>
          <div className={`stat-value ${t.net >= 0 ? 'gold' : 'rust'}`}>{fmtMoney(t.net, db.currency)}</div>
          <div className="stat-note">Qarzdorlik − qarzim</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Kartalarimda</div>
          <div className="stat-value teal">{fmtMoney(totalCardBalance(), db.currency)}</div>
          <div className="stat-note">{db.cards.length} ta karta ulangan</div>
        </div>
      </div>

      {/* Enterprise Quick Hub (5x Faster Navigation & Functions) */}
      <div style={{ marginTop: '24px', marginBottom: '24px' }}>
        <div className="section-title" style={{ marginBottom: '12px' }}>
          ⚡ Tezkor Biznes Modullari
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          <div
            className="settings-card"
            style={{ textAlign: 'center', padding: '14px 10px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
            onClick={() => navigate('suppliers')}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏭</div>
            <div style={{ fontWeight: 700, fontSize: '12.5px' }}>Ta'minotchilar</div>
            <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Optom kirim</div>
          </div>

          <div
            className="settings-card"
            style={{ textAlign: 'center', padding: '14px 10px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
            onClick={() => navigate('invoices')}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>📑</div>
            <div style={{ fontWeight: 700, fontSize: '12.5px' }}>B2B Fakturalar</div>
            <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Schet-faktura</div>
          </div>

          <div
            className="settings-card"
            style={{ textAlign: 'center', padding: '14px 10px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
            onClick={() => navigate('branches')}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏢</div>
            <div style={{ fontWeight: 700, fontSize: '12.5px' }}>Filiallar</div>
            <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Do'konlar tarmog'i</div>
          </div>

          <div
            className="settings-card"
            style={{ textAlign: 'center', padding: '14px 10px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
            onClick={() => navigate('employees')}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>👥</div>
            <div style={{ fontWeight: 700, fontSize: '12.5px' }}>Xodimlar</div>
            <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Oylik & Avans</div>
          </div>

          <div
            className="settings-card"
            style={{ textAlign: 'center', padding: '14px 10px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
            onClick={() => navigate('reminders')}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔔</div>
            <div style={{ fontWeight: 700, fontSize: '12.5px' }}>Aqlli Eslatma</div>
            <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>SMS & Telegram</div>
          </div>

          <div
            className="settings-card"
            style={{ textAlign: 'center', padding: '14px 10px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
            onClick={() => navigate('reports')}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>📊</div>
            <div style={{ fontWeight: 700, fontSize: '12.5px' }}>Foyda-Zarar</div>
            <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>P&L Analitika</div>
          </div>

          <div
            className="settings-card"
            style={{ textAlign: 'center', padding: '14px 10px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
            onClick={() => navigate('clientPortal')}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🌐</div>
            <div style={{ fontWeight: 700, fontSize: '12.5px' }}>Mijoz Portali</div>
            <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Ochiq to'lov</div>
          </div>

          <div
            className="settings-card"
            style={{ textAlign: 'center', padding: '14px 10px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
            onClick={() => navigate('subscriptions')}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>👑</div>
            <div style={{ fontWeight: 700, fontSize: '12.5px' }}>PRO & SMS</div>
            <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Tariflar do'koni</div>
          </div>
        </div>
      </div>

      {/* Currency Converter Widget */}
      <div className="settings-card" style={{ marginTop: '20px', marginBottom: '20px', background: 'var(--surface-2)' }}>
        <div className="section-title" style={{ marginTop: 0, justifyContent: 'space-between' }}>
          <span>💱 Jonli Valyuta Kalkulyatori (USD / UZS)</span>
          <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>1 USD = {fmtMoney(usdRate, "so'm")}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'center' }}>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>AQSH Dollari ($ USD)</label>
            <input
              type="number"
              placeholder="100"
              value={usdInput}
              onChange={e => handleUsdChange(e.target.value)}
            />
          </div>
          <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 800, color: 'var(--gold)' }}>
            ⇄
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>O'zbek so'mi (UZS)</label>
            <input
              type="number"
              placeholder="1 285 000"
              value={uzsInput}
              onChange={e => handleUzsChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Overdue Alert */}
      {t.overdueCount > 0 && db.notifications && (
        <>
          <div className="section-title">
            ⚠ Muddati o'tgan qarzlar ({t.overdueCount} ta)
            <span className="link" onClick={() => navigate('reminders')}>Eslatmalarni boshqarish</span>
          </div>
          <div className="ledger-card">
            {overdueClients.slice(0, 5).map(c => {
              const bal = clientBalance(c.id);
              return (
                <div
                  key={c.id}
                  className="ledger-row type-debt"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('clientDetail', c.id)}
                >
                  <div className="avatar">{initials(c.name)}</div>
                  <div className="row-main">
                    <div className="row-title">{c.name}</div>
                    <div className="row-sub">{c.phone || 'Telefon kiritilmagan'}</div>
                  </div>
                  <div className="row-amount rust">{fmtMoney(bal, db.currency)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Recent Transactions */}
      <div className="section-title">
        So'nggi tranzaksiyalar
        <span className="link" onClick={() => navigate('transactions')}>Barchasini ko'rish</span>
      </div>

      {recent.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10M7 12h10M7 16h6" />
          </svg>
          <div className="t">Hali tranzaksiya yo'q</div>
          <div className="s">Mijoz qo'shib, birinchi qarz yoki to'lovni kiriting.</div>
        </div>
      ) : (
        <div className="ledger-card">
          {recent.map(tx => {
            const c = db.clients.find(cl => cl.id === tx.clientId);
            const lbl = txLabel(tx, c);
            return (
              <div
                key={tx.id}
                className={`ledger-row type-${tx.type}`}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('clientDetail', tx.clientId)}
              >
                <div className="avatar">{c ? initials(c.name) : '?'}</div>
                <div className="row-main">
                  <div className="row-title">{c ? c.name : "O'chirilgan mijoz"}</div>
                  <div className="row-sub">{lbl} · {fmtDate(tx.date)}</div>
                </div>
                <div className={`row-amount ${tx.type === 'debt' ? 'rust' : 'gold'}`}>
                  {tx.type === 'debt' ? '+' : '−'}{fmtMoney(tx.amount, db.currency)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
