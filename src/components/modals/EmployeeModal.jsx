import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { EMPLOYEE_ROLES } from '../../utils/constants';
import { fmtMoney } from '../../utils/helpers';

export default function EmployeeModal({ employeeId, onClose }) {
  const { db, addEmployee, updateEmployee } = useApp();
  const { toast } = useToast();

  const isEdit = Boolean(employeeId);
  const existing = isEdit ? (db.employees || []).find(e => e.id === employeeId) : null;

  const [name, setName] = useState('');
  const [role, setRole] = useState(EMPLOYEE_ROLES[2]); // Default: Sotuvchi / Kassir
  const [phone, setPhone] = useState('+998 ');
  const [passport, setPassport] = useState('');
  const [address, setAddress] = useState('');
  const [hireDate, setHireDate] = useState(new Date().toISOString().slice(0, 10));
  const [salaryType, setSalaryType] = useState('fixed'); // 'fixed' | 'commission' | 'both'
  const [baseSalary, setBaseSalary] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('3');

  useEffect(() => {
    if (existing) {
      setName(existing.name || '');
      setRole(existing.role || EMPLOYEE_ROLES[2]);
      setPhone(existing.phone || '+998 ');
      setPassport(existing.passport || '');
      setAddress(existing.address || '');
      setHireDate(existing.hireDate || new Date().toISOString().slice(0, 10));
      setSalaryType(existing.salaryType || 'fixed');
      setBaseSalary(existing.baseSalary || '');
      setCommissionPercent(existing.commissionPercent || '3');
    }
  }, [existing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Xodimning ismini kiriting', 'error');
      return;
    }

    const payload = {
      name: name.trim(),
      role,
      phone: phone.trim(),
      passport: passport.trim(),
      address: address.trim(),
      hireDate,
      salaryType,
      baseSalary: Number(baseSalary) || 0,
      commissionPercent: Number(commissionPercent) || 0,
    };

    if (isEdit) {
      updateEmployee(employeeId, payload);
    } else {
      addEmployee(payload);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '580px', width: '95%' }}>
        <div className="modal-head">
          <h3>{isEdit ? '👤 Xodimni tahrirlash' : '👤 Yangi Xodim qo\'shish'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
              <div>
                <label className="field-label">Xodimning F.I.SH *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Masalan: Sardor Ergashev"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="field-label">Lavozimi / Vazifasi</label>
                <select
                  className="input"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  {EMPLOYEE_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="field-label">Telefon raqami</label>
                <input
                  type="text"
                  className="input"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label">Pasport / ID seriya</label>
                <input
                  type="text"
                  className="input"
                  placeholder="AA 1234567"
                  value={passport}
                  onChange={e => setPassport(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="field-label">Yashash manzili</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Tuman, ko'cha, uy..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label">Ishga kirgan sana</label>
                <input
                  type="date"
                  className="input"
                  value={hireDate}
                  onChange={e => setHireDate(e.target.value)}
                />
              </div>
            </div>

            {/* Salary Setup */}
            <div style={{
              background: 'var(--surface-2)',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--gold)' }}>
                💰 Maosh va bonus to'lash shartlari
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <div>
                  <label className="field-label">Oylik hisoblash turi</label>
                  <select
                    className="input"
                    value={salaryType}
                    onChange={e => setSalaryType(e.target.value)}
                  >
                    <option value="fixed">Fiksirlangan (Oylik maosh)</option>
                    <option value="commission">Savdo foizi (KPI %)</option>
                    <option value="both">Oylik + Savdo foizi (%)</option>
                  </select>
                </div>

                {(salaryType === 'fixed' || salaryType === 'both') && (
                  <div>
                    <label className="field-label">Belgilangan oylik ({db?.currency || 'so\'m'})</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="0"
                      value={baseSalary}
                      onChange={e => setBaseSalary(e.target.value)}
                    />
                  </div>
                )}

                {(salaryType === 'commission' || salaryType === 'both') && (
                  <div>
                    <label className="field-label">Savdo aylanmasidan bonus (%)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="3"
                      min="0"
                      max="100"
                      step="0.5"
                      value={commissionPercent}
                      onChange={e => setCommissionPercent(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Bekor qilish
              </button>
              <button type="submit" className="btn btn-primary">
                {isEdit ? '💾 Saqlash' : '➕ Xodimni ro\'yxatga olish'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
