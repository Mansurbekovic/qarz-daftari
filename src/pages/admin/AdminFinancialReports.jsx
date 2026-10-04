import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { fmtMoney, fmtDate, exportToCSV, todayISO, getApiBase } from '../../utils/helpers';
import { storage } from '../../utils/storage';
import UserInspectorModal from '../../components/modals/UserInspectorModal';

export default function AdminFinancialReports() {
  const { accounts, db } = useApp();
  const [loading, setLoading] = useState(true);
  const [storeReports, setStoreReports] = useState([]);
  const [topDebtors, setTopDebtors] = useState([]);
  const [totals, setTotals] = useState({
    totalDebtGiven: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalClientsCount: 0,
  });

  const [inspectUser, setInspectUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadFinancialData() {
      setLoading(true);
      try {
        let allGiven = 0;
        let allPaid = 0;
        let allOutstanding = 0;
        let allClients = 0;
        const reports = [];
        const debtorsPool = [];

        for (const acc of accounts) {
          let userData = null;
          try {
            const res = await storage.get('qd-db::' + acc.username, false);
            if (res && res.value) {
              userData = JSON.parse(res.value);
            }

            try {
              const backendRes = await fetch(`${getApiBase()}/api/users/${acc.username}/db`);
              if (backendRes.ok) {
                const sData = await backendRes.json();
                if (sData && Object.keys(sData).length > 0) {
                  userData = { ...(userData || {}), ...sData };
                }
              }
            } catch (e) { /* ignore backend offline */ }

            if (userData) {
              const clients = userData.clients || [];
              const transactions = userData.transactions || [];
              let storeGiven = 0;
              let storePaid = 0;

              for (const t of transactions) {
                const amt = Number(t.amount) || 0;
                if (t.type === 'debt') {
                  storeGiven += amt;
                } else if (t.type === 'payment') {
                  storePaid += amt;
                }
              }

              let storeOutstanding = 0;
              for (const c of clients) {
                let bal = 0;
                for (const t of transactions) {
                  if (t.clientId !== c.id) continue;
                  const amt = Number(t.amount) || 0;
                  bal += t.type === 'debt' ? amt : -amt;
                }
                if (bal > 0) {
                  storeOutstanding += bal;
                  debtorsPool.push({
                    clientName: c.name,
                    clientAddress: c.address || '—',
                    clientPhone: c.phone || '—',
                    debtAmount: bal,
                    storeUsername: acc.username,
                    storeBizName: acc.businessName || acc.username,
                  });
                }
              }

              allGiven += storeGiven;
              allPaid += storePaid;
              allOutstanding += storeOutstanding;
              allClients += clients.length;

              reports.push({
                username: acc.username,
                businessName: acc.businessName || acc.username,
                role: acc.role,
                clientsCount: clients.length,
                totalGiven: storeGiven,
                totalPaid: storePaid,
                outstandingDebt: storeOutstanding,
                recoveryRate: storeGiven > 0 ? Math.round((storePaid / storeGiven) * 100) : 0,
              });
            }
          } catch (e) {
            console.error('Error calculating for', acc.username, e);
          }
        }

        debtorsPool.sort((a, b) => b.debtAmount - a.debtAmount);
        reports.sort((a, b) => b.outstandingDebt - a.outstandingDebt);

        setTotals({
          totalDebtGiven: allGiven,
          totalPaid: allPaid,
          totalOutstanding: allOutstanding,
          totalClientsCount: allClients,
        });
        setStoreReports(reports);
        setTopDebtors(debtorsPool.slice(0, 10));
      } catch (err) {
        console.error('Load financial data error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (accounts.length > 0) {
      loadFinancialData();
    }
  }, [accounts]);

  const handleExportCSV = () => {
    const headers = ['Do\'kon / Foydalanuvchi', 'Biznes Nomi', 'Mijozlar Soni', 'Berilgan Qarz', 'To\'langan Summa', 'Qoldiq Qarz', 'Qaytish %'];
    const rows = storeReports.map(r => [
      r.username,
      r.businessName,
      r.clientsCount,
      r.totalGiven,
      r.totalPaid,
      r.outstandingDebt,
      `${r.recoveryRate}%`
    ]);
    exportToCSV(headers, rows, `moliyaviy-hisobot-${todayISO()}.csv`);
  };

  const filteredReports = storeReports.filter(r => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return r.username.toLowerCase().includes(q) || r.businessName.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Global Financial Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        <div style={{
          background: 'var(--surface)',
          padding: '16px 18px',
          borderRadius: '14px',
          border: '1.5px solid rgba(212, 160, 23, 0.4)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            💰 Jami Qoldiq Qarzlar
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--gold)', marginTop: '4px' }}>
            {fmtMoney(totals.totalOutstanding)} {db?.currency || "so'm"}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
            Tizimdagi to'lanmagan sof qarz
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          padding: '16px 18px',
          borderRadius: '14px',
          border: '1.5px solid rgba(224, 72, 54, 0.3)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            🔴 Jami Berilgan Nasiyalar
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#E04836', marginTop: '4px' }}>
            {fmtMoney(totals.totalDebtGiven)} {db?.currency || "so'm"}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
            Barcha foydalanuvchilar chiqimi
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          padding: '16px 18px',
          borderRadius: '14px',
          border: '1.5px solid rgba(31, 110, 92, 0.3)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            🟢 Jami Qaytgan To'lovlar
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#1F6E5C', marginTop: '4px' }}>
            {fmtMoney(totals.totalPaid)} {db?.currency || "so'm"}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
            Undirilgan to'lovlar
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          padding: '16px 18px',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            👥 Jami Qarzdorlar Soni
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--ink)', marginTop: '4px' }}>
            {totals.totalClientsCount} kishi
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
            {storeReports.length} ta do'kon bo'yicha
          </div>
        </div>
      </div>

      {/* 2. Store-by-Store Breakdown Table */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
              📊 Do'konlar & Foydalanuvchilar Bo'yicha Moliyaviy Balans
            </h3>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
              Har bir hisobning umumiy bergan qarzi, qaytgan to'lovlari va qoldig'i
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '13px'
              }}
            />
            <button
              className="btn btn-outline btn-sm"
              onClick={handleExportCSV}
              style={{ fontWeight: 700 }}
            >
              📥 Excel (CSV) Eksport
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Do'kon / Foydalanuvchi</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Mijozlar</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Berilgan Qarz</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Qaytgan To'lov</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Qoldiq Qarz</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Qaytish Koeffitsienti</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                    Ma'lumotlar hisoblanmoqda...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                    Foydalanuvchi ma'lumotlari topilmadi
                  </td>
                </tr>
              ) : (
                filteredReports.map(r => (
                  <tr key={r.username} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <b style={{ color: 'var(--ink)' }}>{r.businessName}</b>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>@{r.username}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                      👥 {r.clientsCount} ta
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#E04836' }}>
                      {fmtMoney(r.totalGiven)} {db?.currency || "so'm"}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1F6E5C' }}>
                      {fmtMoney(r.totalPaid)} {db?.currency || "so'm"}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 900, color: r.outstandingDebt > 0 ? 'var(--gold)' : 'var(--muted)' }}>
                      {fmtMoney(r.outstandingDebt)} {db?.currency || "so'm"}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          flex: 1,
                          height: '6px',
                          background: 'var(--surface-2)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          minWidth: '50px'
                        }}>
                          <div style={{
                            width: `${Math.min(r.recoveryRate, 100)}%`,
                            height: '100%',
                            background: r.recoveryRate > 70 ? '#1F6E5C' : r.recoveryRate > 40 ? 'var(--gold)' : '#E04836',
                            borderRadius: '3px'
                          }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800 }}>{r.recoveryRate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => setInspectUser(r.username)}
                        style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 700 }}
                      >
                        👁️ Tafsilot
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Top 10 Largest Debtors Across Platform */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#E04836' }}>
            ⚠️ Tizimdagi Eng Yirik Qarzdorlar (Top 10)
          </h3>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
            Barcha do'konlar bo'yicha eng katta qarzi bor shaxslar ro'yxati
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px' }}>#</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px' }}>Qarzdor Ismi</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px' }}>Manzili / Telefoni</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px' }}>Tegishli Do'kon</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--muted)', fontSize: '11px' }}>Qarz Summasi</th>
              </tr>
            </thead>
            <tbody>
              {topDebtors.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                    Qarzdorlar topilmadi
                  </td>
                </tr>
              ) : (
                topDebtors.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 800, color: 'var(--muted)' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 800, color: 'var(--ink)' }}>{d.clientName}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)', fontSize: '12px' }}>
                      📍 {d.clientAddress} {d.clientPhone !== '—' ? `· 📞 ${d.clientPhone}` : ''}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--ink)' }}>
                      🏪 {d.storeBizName} (@{d.storeUsername})
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 900, color: '#E04836', fontSize: '14.5px' }}>
                      {fmtMoney(d.debtAmount)} {db?.currency || "so'm"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectUser && (
        <UserInspectorModal
          targetUsername={inspectUser}
          onClose={() => setInspectUser(null)}
        />
      )}
    </div>
  );
}
