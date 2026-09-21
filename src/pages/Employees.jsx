import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, fmtDate, initials, exportToCSV } from '../utils/helpers';
import EmployeeModal from '../components/modals/EmployeeModal';
import AdvanceModal from '../components/modals/AdvanceModal';
import PayrollModal from '../components/modals/PayrollModal';

export default function Employees() {
  const { db, deleteEmployee, deleteAdvance } = useApp();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('employees'); // 'employees' | 'advances' | 'payrolls'
  const [search, setSearch] = useState('');

  // Modal States
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState(null);

  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceEmpId, setAdvanceEmpId] = useState(null);

  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollEmpId, setPayrollEmpId] = useState(null);

  const employees = db?.employees || [];
  const advances = db?.advances || [];
  const payrolls = db?.payrolls || [];

  // Filtered employees
  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.role && e.role.toLowerCase().includes(search.toLowerCase())) ||
    (e.phone && e.phone.includes(search))
  );

  // Metrics
  const totalSalaryFund = employees.reduce((sum, e) => sum + (Number(e.baseSalary) || 0), 0);
  const totalUnsettledAdvances = advances
    .filter(a => a.status !== 'settled')
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const totalPaidPayrolls = payrolls.reduce((sum, p) => sum + (Number(p.netPayout || p.amount) || 0), 0);

  const handleOpenAddEmployee = () => {
    setEditingEmpId(null);
    setShowEmpModal(true);
  };

  const handleOpenEditEmployee = (id) => {
    setEditingEmpId(id);
    setShowEmpModal(true);
  };

  const handleOpenAdvance = (empId = null) => {
    setAdvanceEmpId(empId);
    setShowAdvanceModal(true);
  };

  const handleOpenPayroll = (empId = null) => {
    setPayrollEmpId(empId);
    setShowPayrollModal(true);
  };

  const handleExportCSV = () => {
    if (activeTab === 'employees') {
      const headers = ['Ism-sharif', 'Lavozim', 'Telefon', 'Oylik stavkasi', 'Olingan avanslar'];
      const rows = employees.map(e => {
        const empAdv = advances
          .filter(a => a.employeeId === e.id && a.status !== 'settled')
          .reduce((sum, a) => sum + Number(a.amount || 0), 0);
        return [e.name, e.role, e.phone || '—', e.baseSalary, empAdv];
      });
      exportToCSV(headers, rows, `xodimlar-${new Date().toISOString().slice(0, 10)}.csv`);
    } else if (activeTab === 'advances') {
      const headers = ['Sana', 'Xodim', 'Avans summasi', 'Holati', 'Izoh'];
      const rows = advances.map(a => [
        a.date,
        a.employeeName,
        a.amount,
        a.status === 'settled' ? 'Hisoblangan' : 'Ochiq qoldiq',
        a.note
      ]);
      exportToCSV(headers, rows, `avanslar-${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      const headers = ['Davr', 'Xodim', 'Asosiy oylik', 'Bonus', 'Ushlangan avans', 'To\'langan summa'];
      const rows = payrolls.map(p => [
        p.period,
        p.employeeName,
        p.baseSalary,
        p.bonusAmount || 0,
        p.totalAdvances || 0,
        p.netPayout || p.amount
      ]);
      exportToCSV(headers, rows, `oylik-vedomost-${new Date().toISOString().slice(0, 10)}.csv`);
    }
    toast('Excel hisobot yuklab olindi');
  };

  return (
    <div>
      {/* Top Stat Grid */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">Jami xodimlar</div>
          <div className="stat-value ink">{employees.length} nafar</div>
          <div className="stat-note">Sotuvchilar, kassirlar va boshqaruvchilar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Oylik maosh fondi</div>
          <div className="stat-value gold">{fmtMoney(totalSalaryFund, db?.currency)}</div>
          <div className="stat-note">Barcha xodimlarning oylik stavkasi</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ochiq avanslar</div>
          <div className="stat-value rust">{fmtMoney(totalUnsettledAdvances, db?.currency)}</div>
          <div className="stat-note">Xodimlarga berilgan, hali ushlanmagan</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">To'langan oyliklar</div>
          <div className="stat-value teal">{fmtMoney(totalPaidPayrolls, db?.currency)}</div>
          <div className="stat-note">{payrolls.length} ta oylik vedomosti tasdiqlangan</div>
        </div>
      </div>

      {/* Control & Tab Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div className="subnav-tabs" style={{ marginBottom: 0 }}>
          <button
            className={`subnav-tab ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            👥 Xodimlar jamoasi
            <span className="tab-badge">{employees.length}</span>
          </button>
          <button
            className={`subnav-tab ${activeTab === 'advances' ? 'active' : ''}`}
            onClick={() => setActiveTab('advances')}
          >
            💸 Berilgan avanslar
            <span className="tab-badge">{advances.length}</span>
          </button>
          <button
            className={`subnav-tab ${activeTab === 'payrolls' ? 'active' : ''}`}
            onClick={() => setActiveTab('payrolls')}
          >
            📑 Oylik vedomostlari
            <span className="tab-badge">{payrolls.length}</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
            📊 Excelga eksport
          </button>
          {activeTab === 'advances' ? (
            <button className="btn btn-gold btn-sm" onClick={() => handleOpenAdvance()}>
              + Avans berish
            </button>
          ) : activeTab === 'payrolls' ? (
            <button className="btn btn-gold btn-sm" onClick={() => handleOpenPayroll()}>
              + Oylik hisoblash
            </button>
          ) : (
            <button className="btn btn-gold btn-sm" onClick={handleOpenAddEmployee}>
              + Xodim qo'shish
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: EMPLOYEES */}
      {activeTab === 'employees' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Xodim ismi, lavozimi yoki telefoni bo'yicha qidiruv..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', borderRadius: '10px' }}
            />
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <div className="t">Xodimlar ro'yxati bo'sh</div>
              <div className="s">Do'koningiz sotuvchilari, kassirlari va ishchilarini qo'shib, ularning oylik va avanslarini avtomatlashtiring.</div>
              <button className="btn btn-gold btn-sm" style={{ marginTop: '12px' }} onClick={handleOpenAddEmployee}>
                + Xodim qo'shish
              </button>
            </div>
          ) : (
            <div className="enterprise-table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Xodim</th>
                    <th>Lavozim</th>
                    <th>Telefon</th>
                    <th>Oylik stavkasi</th>
                    <th>Ochiq avanslar</th>
                    <th style={{ textAlign: 'right' }}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => {
                    const empAdv = advances
                      .filter(a => a.employeeId === emp.id && a.status !== 'settled')
                      .reduce((sum, a) => sum + Number(a.amount || 0), 0);

                    return (
                      <tr key={emp.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '12px' }}>
                              {initials(emp.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{emp.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                Ishga kirgan: {fmtDate(emp.hireDate)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge-status info" style={{ fontSize: '11px' }}>
                            {emp.role}
                          </span>
                        </td>
                        <td>{emp.phone || '—'}</td>
                        <td>
                          <div style={{ fontWeight: 800, color: 'var(--gold)' }}>
                            {fmtMoney(emp.baseSalary, db?.currency)}
                          </div>
                          {emp.commissionPercent > 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--teal)' }}>
                              +{emp.commissionPercent}% sotuvdan
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }} className={empAdv > 0 ? 'rust' : 'teal'}>
                            {fmtMoney(empAdv, db?.currency)}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              className="btn btn-sm btn-outline"
                              title="Avans berish"
                              onClick={() => handleOpenAdvance(emp.id)}
                            >
                              💸 Avans
                            </button>
                            <button
                              className="btn btn-sm btn-gold"
                              title="Oylik hisoblash"
                              onClick={() => handleOpenPayroll(emp.id)}
                            >
                              📑 Oylik berish
                            </button>
                            <button
                              className="icon-btn"
                              title="Tahrirlash"
                              onClick={() => handleOpenEditEmployee(emp.id)}
                            >
                              ✏️
                            </button>
                            <button
                              className="icon-btn"
                              title="O'chirish"
                              onClick={() => {
                                if (window.confirm(`"${emp.name}" xodimini o'chirishni tasdiqlaysizmi?`)) {
                                  deleteEmployee(emp.id);
                                }
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB 2: ADVANCES */}
      {activeTab === 'advances' && (
        <>
          {advances.length === 0 ? (
            <div className="empty-state">
              <div className="t">Berilgan avanslar yo'q</div>
              <div className="s">Xodimlarga oylik hisobidan avans berilganda bu yerda saqlanadi.</div>
              <button className="btn btn-gold btn-sm" style={{ marginTop: '12px' }} onClick={() => handleOpenAdvance()}>
                + Avans berish
              </button>
            </div>
          ) : (
            <div className="enterprise-table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Sana</th>
                    <th>Xodim</th>
                    <th>Avans summasi</th>
                    <th>Holati</th>
                    <th>Izoh</th>
                    <th style={{ textAlign: 'right' }}>O'chirish</th>
                  </tr>
                </thead>
                <tbody>
                  {[...advances].reverse().map(a => (
                    <tr key={a.id}>
                      <td>{fmtDate(a.date)}</td>
                      <td><b>{a.employeeName}</b></td>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--rust)' }}>
                          {fmtMoney(a.amount, db?.currency)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status ${a.status === 'settled' ? 'teal' : 'gold'}`}>
                          {a.status === 'settled' ? '✅ Oylikdan ushlandi' : '⏳ Ochiq (Kutilmoqda)'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{a.note || '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="icon-btn"
                          title="O'chirish"
                          onClick={() => {
                            if (window.confirm('Ushbu avans yozuvini o\'chirmoqchimisiz?')) {
                              deleteAdvance(a.id);
                            }
                          }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB 3: PAYROLLS */}
      {activeTab === 'payrolls' && (
        <>
          {payrolls.length === 0 ? (
            <div className="empty-state">
              <div className="t">Oylik vedomostlari hali tuzilmagan</div>
              <div className="s">Oy yakunida xodimlarning maoshi, bonusi va avanslarini biriktirib oylik chiqaring.</div>
              <button className="btn btn-gold btn-sm" style={{ marginTop: '12px' }} onClick={() => handleOpenPayroll()}>
                + Oylik vedomosti yaratish
              </button>
            </div>
          ) : (
            <div className="enterprise-table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Davr (Oy)</th>
                    <th>Xodim</th>
                    <th>Asosiy oylik</th>
                    <th>Bonus</th>
                    <th>Ushlangan avans</th>
                    <th>Qo'lga tegadigan</th>
                  </tr>
                </thead>
                <tbody>
                  {[...payrolls].reverse().map(p => (
                    <tr key={p.id}>
                      <td><b>{p.period}</b></td>
                      <td><b>{p.employeeName}</b></td>
                      <td>{fmtMoney(p.baseSalary, db?.currency)}</td>
                      <td>
                        <span style={{ color: 'var(--teal)' }}>
                          +{fmtMoney(p.bonusAmount || 0, db?.currency)}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--rust)' }}>
                          -{fmtMoney(p.totalAdvances || 0, db?.currency)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--gold)' }}>
                          {fmtMoney(p.netPayout || p.amount, db?.currency)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showEmpModal && (
        <EmployeeModal
          employeeId={editingEmpId}
          onClose={() => setShowEmpModal(false)}
        />
      )}

      {showAdvanceModal && (
        <AdvanceModal
          defaultEmployeeId={advanceEmpId}
          onClose={() => setShowAdvanceModal(false)}
        />
      )}

      {showPayrollModal && (
        <PayrollModal
          employeeId={payrollEmpId}
          onClose={() => setShowPayrollModal(false)}
        />
      )}
    </div>
  );
}
