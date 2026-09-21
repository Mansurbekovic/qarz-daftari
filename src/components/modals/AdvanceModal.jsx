import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { fmtMoney } from '../../utils/helpers';

export default function AdvanceModal({ defaultEmployeeId, onClose }) {
  const { db, addAdvance, updateDB } = useApp();
  const { toast } = useToast();

  const employees = db?.employees || [];
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || (employees[0]?.id || ''));
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cardId, setCardId] = useState('');
  const [note, setNote] = useState('Oylik hisobidan avans');

  const emp = employees.find(e => e.id === employeeId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!employeeId) {
      toast('Xodimni tanlang', 'error');
      return;
    }
    const num = Number(amount);
    if (!num || num <= 0) {
      toast('Avans summasini kiriting', 'error');
      return;
    }

    addAdvance({
      employeeId,
      employeeName: emp ? emp.name : 'Xodim',
      amount: num,
      date,
      note: note.trim()
    });

    // If a bank card was chosen, deduct balance
    if (cardId) {
      updateDB(prev => ({
        ...prev,
        cards: (prev.cards || []).map(c => c.id === cardId ? { ...c, balance: c.balance - num } : c),
        cardTx: [...(prev.cardTx || []), {
          id: Date.now().toString(),
          type: 'salary_advance',
          cardId,
          amount: num,
          note: `Xodim avansi: ${emp?.name}`,
          date: new Date().toISOString()
        }]
      }));
    }

    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '500px', width: '95%' }}>
        <div className="modal-head">
          <h3>💸 Xodimga Avans / Qarz berish</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="field-label">Xodimni tanlang *</label>
              <select
                className="input"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                required
              >
                {employees.length === 0 ? (
                  <option value="">Xodimlar mavjud emas</option>
                ) : (
                  employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
                  ))
                )}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
              <div>
                <label className="field-label">Avans summasi ({db?.currency || 'so\'m'}) *</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  min="1000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="field-label">Berilgan sana</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {(db.cards || []).length > 0 && (
              <div>
                <label className="field-label">Qaysi hisobdan to'landi? (ixtiyoriy)</label>
                <select
                  className="input"
                  value={cardId}
                  onChange={e => setCardId(e.target.value)}
                >
                  <option value="">— Naqd kassadan —</option>
                  {db.cards.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.bank} •{c.last4} ({fmtMoney(c.balance, db.currency)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="field-label">Izoh</label>
              <input
                type="text"
                className="input"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Bekor qilish
              </button>
              <button type="submit" className="btn btn-primary">
                💸 Avansni berish
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
