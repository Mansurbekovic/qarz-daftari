import React from 'react';
import { useApp } from '../contexts/AppContext';
import { fmtMoney, initials } from '../utils/helpers';

export default function Stats() {
  const { db, totals, clientBalance, navigate } = useApp();

  if (!db) return null;

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('uz-UZ', { month: 'short' }),
      debt: 0,
      payment: 0,
    });
  }

  db.transactions.forEach(tx => {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const m = months.find(m => m.key === key);
    if (m) {
      m[tx.type] += Number(tx.amount);
    }
  });

  const max = Math.max(1, ...months.map(m => Math.max(m.debt, m.payment)));
  const chartH = 160;

  const t = totals();
  const topDebtors = [...db.clients]
    .filter(c => c.relation !== 'i_owe')
    .map(c => ({ c, bal: clientBalance(c.id) }))
    .filter(x => x.bal > 0)
    .sort((a, b) => b.bal - a.bal)
    .slice(0, 5);

  const topCreditors = [...db.clients]
    .filter(c => c.relation === 'i_owe')
    .map(c => ({ c, bal: clientBalance(c.id) }))
    .filter(x => x.bal > 0)
    .sort((a, b) => b.bal - a.bal)
    .slice(0, 5);

  return (
    <div>
      <div className="chart-card">
        <div className="section-title" style={{ margin: '0 0 4px' }}>Oylik harakat (so'nggi 6 oy)</div>
        <svg viewBox={`0 0 ${months.length * 100} 210`} width="100%" height="220" style={{ overflow: 'visible' }}>
          {months.map((m, i) => {
            const x = i * 100 + 20;
            const dh = (m.debt / max) * chartH;
            const ph = (m.payment / max) * chartH;
            return (
              <g key={m.key}>
                <rect x={x} y={chartH - dh + 10} width="26" height={dh} rx="4" fill="var(--rust)" />
                <rect x={x + 30} y={chartH - ph + 10} width="26" height={ph} rx="4" fill="var(--gold)" />
                <text
                  x={x + 28}
                  y={chartH + 30}
                  fontSize="11"
                  fill="var(--muted)"
                  textAnchor="middle"
                  fontFamily="Manrope"
                >
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="legend">
          <span><span className="dot" style={{ background: 'var(--rust)' }} />Berilgan qarzlar</span>
          <span><span className="dot" style={{ background: 'var(--gold)' }} />Qabul qilingan to'lovlar</span>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Menga qarzdorlik</div>
          <div className="stat-value rust">{fmtMoney(t.owedToMe, db.currency)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Mening qarzim</div>
          <div className="stat-value teal">{fmtMoney(t.iOwe, db.currency)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Muddati o'tgan</div>
          <div className="stat-value gold">{fmtMoney(t.overdueSum, db.currency)}</div>
        </div>
      </div>

      <div className="section-title">Eng ko'p qarzdor mijozlar</div>
      {topDebtors.length === 0 ? (
        <div className="empty-state">
          <div className="t">Qarzdorlar yo'q</div>
          <div className="s">Hozircha hech kim sizga qarzdor emas.</div>
        </div>
      ) : (
        <div className="ledger-card">
          {topDebtors.map(({ c, bal }) => (
            <div
              key={c.id}
              className="ledger-row type-debt"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('clientDetail', c.id)}
            >
              <div className="avatar">{initials(c.name)}</div>
              <div className="row-main">
                <div className="row-title">{c.name}</div>
              </div>
              <div className="row-amount rust">{fmtMoney(bal, db.currency)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="section-title">Men eng ko'p qarzdor bo'lgan shaxslar</div>
      {topCreditors.length === 0 ? (
        <div className="empty-state">
          <div className="t">Qarzlaringiz yo'q</div>
          <div className="s">Hozircha siz hech kimga qarzdor emassiz.</div>
        </div>
      ) : (
        <div className="ledger-card">
          {topCreditors.map(({ c, bal }) => (
            <div
              key={c.id}
              className="ledger-row type-debt"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('clientDetail', c.id)}
            >
              <div className="avatar">{initials(c.name)}</div>
              <div className="row-main">
                <div className="row-title">{c.name}</div>
              </div>
              <div className="row-amount teal">{fmtMoney(bal, db.currency)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
