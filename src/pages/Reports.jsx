import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, fmtDate, exportToCSV } from '../utils/helpers';

export default function Reports() {
  const { db, clientBalance, totals } = useApp();
  const { toast } = useToast();

  const [period, setPeriod] = useState('all'); // 'all' | 'month' | 'quarter'

  const t = totals();
  const currency = db?.currency || "so'm";
  const clients = db?.clients || [];
  const transactions = db?.transactions || [];
  const kassaEntries = db?.kassaEntries || [];
  const payrolls = db?.payrolls || [];
  const supplierPayments = db?.supplierPayments || [];

  // Financial Calculations
  const totalSalesRevenue = kassaEntries
    .filter(e => e.type === 'sale')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalCreditIssued = transactions
    .filter(t => t.type === 'debt')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalCreditCollected = transactions
    .filter(t => t.type === 'payment')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalSalariesPaid = payrolls
    .reduce((sum, p) => sum + (Number(p.netPayout || p.amount) || 0), 0);

  const totalSupplierPaid = supplierPayments
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Gross Profit estimation (Assuming 28% average trade margin if exact cost not set)
  const estimatedGrossProfit = Math.round(totalSalesRevenue * 0.28);
  const totalOperatingExpenses = totalSalariesPaid;
  const netEstimatedProfit = Math.max(0, estimatedGrossProfit - totalOperatingExpenses);

  // Debt Aging Analysis (Qarzlarning muddati tahlili)
  const now = Date.now();
  let agingCurrent = 0; // 0-30 days
  let agingWarning = 0; // 31-60 days
  let agingDanger = 0;  // 60+ days

  clients.forEach(c => {
    const bal = clientBalance(c.id);
    if (bal <= 0) return;

    const cTxs = transactions.filter(t => t.clientId === c.id && t.type === 'debt');
    if (cTxs.length === 0) {
      agingCurrent += bal;
      return;
    }
    const oldestTx = cTxs.reduce((min, tx) => new Date(tx.date) < new Date(min.date) ? tx : min, cTxs[0]);
    const daysOld = Math.floor((now - new Date(oldestTx.date).getTime()) / (1000 * 60 * 60 * 24));

    if (daysOld <= 30) agingCurrent += bal;
    else if (daysOld <= 60) agingWarning += bal;
    else agingDanger += bal;
  });

  const totalActiveDebt = agingCurrent + agingWarning + agingDanger;

  const handleExportFullReport = () => {
    const headers = ['Ko\'rsatkich nomi', 'Qiymat', 'Valyuta', 'Holat'];
    const rows = [
      ['Jami Kassa Savdosi (Tushum)', totalSalesRevenue, currency, 'Kassaga kirgan'],
      ['Berilgan Nasiyalar (Jami)', totalCreditIssued, currency, 'Qarz berilgan'],
      ['Qaytarilgan Nasiyalar', totalCreditCollected, currency, 'Yig\'ib olingan'],
      ['Mijozlarimizdagi Qarz Qoldig\'i', t.owedToMe, currency, 'Hozirgi aktiv qarz'],
      ['Xodimlarga To\'langan Oyliklar', totalSalariesPaid, currency, 'Xarajat'],
      ['Ta\'minotchilarga To\'langan Mablag\'', totalSupplierPaid, currency, 'Xarid xarajati'],
      ['Yalpi Taxminiy Foyda (28% marja)', estimatedGrossProfit, currency, 'Savdo yalpi daromadi'],
      ['Sof Moliyaviy Natija', netEstimatedProfit, currency, 'Sof rentabellik']
    ];
    exportToCSV(headers, rows, `moliya-foyda-zarar-${new Date().toISOString().slice(0, 10)}.csv`);
    toast('To\'liq moliyaviy hisobot Excel (CSV) faylida yuklandi');
  };

  return (
    <div>
      {/* Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Moliya & Foyda-Zarar (P&L) Hisoboti</h2>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
            Biznesingizning yalpi daromadi, nasiyalar xavfi va sof rentabelligi
          </div>
        </div>

        <button className="btn btn-gold btn-sm" onClick={handleExportFullReport}>
          📊 To'liq hisobotni Excelga yuklab olish
        </button>
      </div>

      {/* Top 4 Key Financial Metrics */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">Kassa Savdo Daromadi</div>
          <div className="stat-value teal">{fmtMoney(totalSalesRevenue, currency)}</div>
          <div className="stat-note">Kassadan o'tgan naqd va karta tushumi</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Yig'ib olingan nasiyalar</div>
          <div className="stat-value gold">{fmtMoney(totalCreditCollected, currency)}</div>
          <div className="stat-note">Mijozlar qaytargan qarzlar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Jami xarajatlar (Oylik+Xarid)</div>
          <div className="stat-value rust">{fmtMoney(totalSalariesPaid + totalSupplierPaid, currency)}</div>
          <div className="stat-note">Maoshlar va ta'minotchi chiqimlari</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Taxminiy Sof Foyda</div>
          <div className="stat-value teal">{fmtMoney(netEstimatedProfit, currency)}</div>
          <div className="stat-note">Operatsion xarajatlar chegirilgandan so'ng</div>
        </div>
      </div>

      {/* Profit & Loss Table */}
      <div className="settings-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
          📑 Daromad va Xarajatlar Vedomosti (P&L Statement)
        </h3>

        <div className="enterprise-table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Moliyaviy ko'rsatkich</th>
                <th>Toifa</th>
                <th style={{ textAlign: 'right' }}>Summa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>1. Jami Kassa Tushumi (Sotuvlar)</b></td>
                <td><span className="badge-status teal">Daromad</span></td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--teal)' }}>
                  +{fmtMoney(totalSalesRevenue, currency)}
                </td>
              </tr>
              <tr>
                <td><b>2. Mijozlardan Qaytgan Nasiyalar</b></td>
                <td><span className="badge-status teal">Pul oqimi (Cash-in)</span></td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--teal)' }}>
                  +{fmtMoney(totalCreditCollected, currency)}
                </td>
              </tr>
              <tr>
                <td><b>3. Sotilgan tovarlar tannarxi (Taxminiy)</b></td>
                <td><span className="badge-status rust">Tannarx (COGS)</span></td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--rust)' }}>
                  -{fmtMoney(Math.round(totalSalesRevenue * 0.72), currency)}
                </td>
              </tr>
              <tr style={{ background: 'var(--surface-2)' }}>
                <td><b>4. YALPI FOYDA (Gross Profit)</b></td>
                <td><span className="badge-status gold">Rentabellik</span></td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '15px', color: 'var(--gold)' }}>
                  {fmtMoney(estimatedGrossProfit, currency)}
                </td>
              </tr>
              <tr>
                <td><b>5. Xodimlarga to'langan oylik maoshlar</b></td>
                <td><span className="badge-status rust">Operatsion xarajat</span></td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--rust)' }}>
                  -{fmtMoney(totalSalariesPaid, currency)}
                </td>
              </tr>
              <tr>
                <td><b>6. Ta'minotchilarga to'langan xaridlar</b></td>
                <td><span className="badge-status info">Ta'minot xarajati</span></td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--rust)' }}>
                  -{fmtMoney(totalSupplierPaid, currency)}
                </td>
              </tr>
              <tr style={{ background: 'var(--surface-2)', borderTop: '2px solid var(--border)' }}>
                <td style={{ fontSize: '15px' }}><b>🏆 SOF FOYDA (Net Profit)</b></td>
                <td><span className="badge-status teal">Yakuniy sof foyda</span></td>
                <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '17px', color: 'var(--teal)' }}>
                  {fmtMoney(netEstimatedProfit, currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Debt Aging Analysis (Nasiyalar xavfi va muddatlari) */}
      <div className="settings-card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
          🛡️ Qarz Portfelining Xavflilik Tahlili (Debt Aging Analysis)
        </h3>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '18px' }}>
          Qaysi qarzlar o'z vaqtida qaytmoqda va qaysi qarzlar muammoli bo'lib qolish xavfi ostida:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--teal)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>0 — 30 kunlik qarzlar (Sog'lom)</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--teal)', marginTop: '4px' }}>
              {fmtMoney(agingCurrent, currency)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
              Jami qarzning {totalActiveDebt > 0 ? Math.round((agingCurrent / totalActiveDebt) * 100) : 0}% qismi
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--gold)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>31 — 60 kunlik qarzlar (Ogohlantirish)</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gold)', marginTop: '4px' }}>
              {fmtMoney(agingWarning, currency)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
              Jami qarzning {totalActiveDebt > 0 ? Math.round((agingWarning / totalActiveDebt) * 100) : 0}% qismi
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--rust)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>60+ kundan oshgan (Xavfli / Muammoli)</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--rust)', marginTop: '4px' }}>
              {fmtMoney(agingDanger, currency)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--rust)', marginTop: '4px', fontWeight: 700 }}>
              Zudlik bilan undirish talab etiladi! ({totalActiveDebt > 0 ? Math.round((agingDanger / totalActiveDebt) * 100) : 0}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
