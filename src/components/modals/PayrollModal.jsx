import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { fmtMoney } from '../../utils/helpers';

export default function PayrollModal({ employeeId, onClose }) {
  const { db, addPayroll, updateDB } = useApp();
  const { toast } = useToast();

  const employees = db?.employees || [];
  const emp = employees.find(e => e.id === employeeId) || employees[0];

  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-09"
  const [period, setPeriod] = useState(currentMonthStr);
  const [baseSalary, setBaseSalary] = useState(emp ? emp.baseSalary || 0 : 0);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [cardId, setCardId] = useState('');
  const [note, setNote] = useState('');

  // Unsettled advances for this employee
  const empAdvances = (db?.advances || []).filter(a => a.employeeId === emp?.id && a.status !== 'settled');
  const totalAdvances = empAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  // Calculate Net Payout
  const grossEarnings = (Number(baseSalary) || 0) + (Number(bonusAmount) || 0);
  const netPayout = Math.max(0, grossEarnings - totalAdvances);

  useEffect(() => {
    if (emp) {
      setBaseSalary(emp.baseSalary || 0);
      // Auto estimate commission if commission percent is set
      if (emp.commissionPercent > 0) {
        // Find total sales volume for period
        const totalBizSales = (db?.transactions || [])
          .filter(t => t.type === 'debt' && t.date?.startsWith(period))
          .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        // Estimate portion
        const estComm = (totalBizSales * (emp.commissionPercent / 100)) / (employees.length || 1);
        setBonusAmount(Math.round(estComm));
      }
    }
  }, [emp, period, db, employees.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!emp) {
      toast('Xodim topilmadi', 'error');
      return;
    }

    const payload = {
      employeeId: emp.id,
      employeeName: emp.name,
      employeeRole: emp.role,
      period,
      baseSalary: Number(baseSalary) || 0,
      bonusAmount: Number(bonusAmount) || 0,
      deductions: totalAdvances,
      netAmount: netPayout,
      date: new Date().toISOString().slice(0, 10),
      note: note.trim()
    };

    addPayroll(payload);

    // If card was selected, deduct balance
    if (cardId && netPayout > 0) {
      updateDB(prev => ({
        ...prev,
        cards: (prev.cards || []).map(c => c.id === cardId ? { ...c, balance: c.balance - netPayout } : c),
        cardTx: [...(prev.cardTx || []), {
          id: Date.now().toString(),
          type: 'salary_payout',
          cardId,
          amount: netPayout,
          note: `Oylik maosh: ${emp.name} (${period})`,
          date: new Date().toISOString()
        }]
      }));
    }

    onClose();
  };

  if (!emp) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '580px', width: '95%' }}>
        <div className="modal-head">
          <h3>💳 Oylik maosh hisoblash ({emp.name})</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="field-label">Maosh davri (Oy)</label>
                <input
                  type="month"
                  className="input"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label">Lavozimi</label>
                <input
                  type="text"
                  className="input"
                  value={emp.role}
                  disabled
                  style={{ opacity: 0.8 }}
                />
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div style={{
              background: 'var(--surface-2)',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <b style={{ fontSize: '13px' }}>💵 Daromad qismi:</b>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="field-label">Asosiy maosh ({db?.currency || 'so\'m'})</label>
                  <input
                    type="number"
                    className="input"
                    value={baseSalary}
                    onChange={e => setBaseSalary(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label">Bonus / Savdo KPI (%)</label>
                  <input
                    type="number"
                    className="input"
                    value={bonusAmount}
                    onChange={e => setBonusAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Deductions (Advances) */}
            <div style={{
              background: 'rgba(217, 83, 79, 0.08)',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid rgba(217, 83, 79, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '13px', color: 'var(--rust)' }}>
                  ⚠️ Ushlab qolinadigan avanslar:
                </b>
                <strong style={{ fontSize: '14px', color: 'var(--rust)' }}>
                  -{fmtMoney(totalAdvances, db?.currency)}
                </strong>
              </div>
              {empAdvances.length > 0 ? (
                <div style={{ fontSize: '11.5px', marginTop: '6px', color: 'var(--text-sec)' }}>
                  {empAdvances.map(a => (
                    <div key={a.id}>• {fmtMoney(a.amount, db?.currency)} ({a.date}) — {a.note}</div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--teal)' }}>
                  Avans olinmagan (0 so'm)
                </div>
              )}
            </div>

            {/* Payout Summary */}
            <div style={{
              background: 'rgba(212, 175, 55, 0.1)',
              borderRadius: '12px',
              padding: '14px 18px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-sec)' }}>Qo'lga tegadigan sof maosh:</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gold)' }}>
                  {fmtMoney(netPayout, db?.currency)}
                </div>
              </div>

              {(db.cards || []).length > 0 && (
                <div>
                  <label className="field-label" style={{ fontSize: '11px' }}>To'lov manbai</label>
                  <select
                    className="input"
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                    value={cardId}
                    onChange={e => setCardId(e.target.value)}
                  >
                    <option value="">— Naqd kassadan —</option>
                    {db.cards.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.bank} •{c.last4}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Bekor qilish
              </button>
              <button type="submit" className="btn btn-primary">
                ✅ Oylik to'lovini tasdiqlash & Yopish
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
