import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, fmtDate, todayISO, calculateClientScore } from '../utils/helpers';

export default function DebtRequests() {
  const { db, updateDB, navigate, clientBalance } = useApp();
  const toast = useToast();

  const requests = db.debtRequests || [];
  const clients = db.clients || [];

  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [showNewModal, setShowNewModal] = useState(false);

  // New Request Form State
  const [borrowerType, setBorrowerType] = useState('existing'); // 'existing' | 'new'
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [newBorrowerName, setNewBorrowerName] = useState('');
  const [newBorrowerPhone, setNewBorrowerPhone] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [purposeInput, setPurposeInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Reject Modal State
  const [rejectReqId, setRejectReqId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Filter requests
  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  // Submit new debt request
  const handleCreateRequest = (e) => {
    e.preventDefault();
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) {
      toast("Noto'g'ri summa kiritildi", 'error');
      return;
    }

    let clientId = selectedClientId;
    let clientName = '';
    let clientPhone = '';

    if (borrowerType === 'existing') {
      const c = clients.find(item => item.id === selectedClientId);
      if (!c) {
        toast("Mijozni tanlang", 'error');
        return;
      }
      clientName = c.name;
      clientPhone = c.phone || '';
    } else {
      if (!newBorrowerName.trim()) {
        toast("Qarz oluvchi ismini kiriting", 'error');
        return;
      }
      // Create client automatically
      const newClientId = 'cl_' + Date.now();
      const newClient = {
        id: newClientId,
        name: newBorrowerName.trim(),
        phone: newBorrowerPhone.trim(),
        relation: 'owed_to_me',
        createdAt: new Date().toISOString()
      };
      updateDB(prev => ({
        ...prev,
        clients: [...prev.clients, newClient]
      }));
      clientId = newClientId;
      clientName = newClient.name;
      clientPhone = newClient.phone;
    }

    const newRequest = {
      id: 'req_' + Date.now(),
      clientId,
      clientName,
      clientPhone,
      amount,
      purpose: purposeInput.trim() || 'Nasiya xarid / Qarz so\'rovi',
      dueDate: dueDateInput || null,
      notes: notesInput.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    updateDB(prev => ({
      ...prev,
      debtRequests: [newRequest, ...(prev.debtRequests || [])]
    }));

    toast("Qarz so'rovi qabul qilindi va ro'yxatga qo'shildi!");
    setShowNewModal(false);
    setAmountInput('');
    setPurposeInput('');
    setDueDateInput('');
    setNotesInput('');
  };

  // Approve Debt Request -> Converts into actual Debt Transaction
  const handleApprove = (req) => {
    if (!confirm(`${req.clientName} ga ${fmtMoney(req.amount, db.currency)} miqdorida nasiya qarz berishni tasdiqlaysizmi?`)) {
      return;
    }

    const newTx = {
      id: 'tx_' + Date.now(),
      clientId: req.clientId,
      type: 'debt',
      amount: req.amount,
      date: todayISO(),
      dueDate: req.dueDate || null,
      note: `Tasdiqlangan so'rov bo'yicha: ${req.purpose}`,
      timestamp: new Date().toISOString()
    };

    updateDB(prev => ({
      ...prev,
      transactions: [newTx, ...(prev.transactions || [])],
      debtRequests: (prev.debtRequests || []).map(r =>
        r.id === req.id
          ? { ...r, status: 'approved', approvedAt: new Date().toISOString() }
          : r
      )
    }));

    toast(`${req.clientName} ga nasiya ajratildi va qarz daftariga yozildi!`, 'success');
  };

  // Reject Request
  const handleRejectConfirm = () => {
    if (!rejectReqId) return;

    updateDB(prev => ({
      ...prev,
      debtRequests: (prev.debtRequests || []).map(r =>
        r.id === rejectReqId
          ? { ...r, status: 'rejected', rejectReason: rejectReason.trim(), rejectedAt: new Date().toISOString() }
          : r
      )
    }));

    toast("Qarz so'rovi rad etildi", 'info');
    setRejectReqId(null);
    setRejectReason('');
  };

  return (
    <div>
      {/* Top Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div className="chip-group">
          <button
            className={`chip ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            ⏳ Kutilmoqda ({requests.filter(r => r.status === 'pending').length})
          </button>
          <button
            className={`chip ${filterStatus === 'approved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('approved')}
          >
            ✅ Tasdiqlangan ({requests.filter(r => r.status === 'approved').length})
          </button>
          <button
            className={`chip ${filterStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            ❌ Rad etilgan ({requests.filter(r => r.status === 'rejected').length})
          </button>
          <button
            className={`chip ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Barchasi ({requests.length})
          </button>
        </div>

        <button
          className="btn btn-gold"
          onClick={() => setShowNewModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>➕</span>
          <b>Yangi Qarz So'rovi Kiritish</b>
        </button>
      </div>

      {/* Requests List Grid */}
      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
          <div className="t">So'rovlar topilmadi</div>
          <div className="s">
            {filterStatus === 'pending'
              ? "Ayni paytda kutilayotgan qarz so'rovlari mavjud emas."
              : "Ushbu bo'limda hozircha arizalar yo'q."}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredRequests.map(req => {
            const clientObj = clients.find(c => c.id === req.clientId);
            const score = calculateClientScore(clientObj, db.transactions);
            const currentBal = clientObj ? clientBalance(clientObj.id) : 0;

            return (
              <div
                key={req.id}
                className="stat-card"
                style={{
                  padding: '18px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Header: Name, Score, Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <b style={{ fontSize: '15.5px', color: 'var(--ink)' }}>{req.clientName}</b>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                      {req.clientPhone ? `📞 ${req.clientPhone}` : "Telefon ko'rsatilmagan"}
                    </div>
                  </div>

                  <span className={`badge-status ${req.status === 'approved' ? 'teal' : (req.status === 'rejected' ? 'rust' : 'gold')}`}>
                    {req.status === 'approved' ? '✅ Tasdiqlangan' : (req.status === 'rejected' ? '❌ Rad etilgan' : '⏳ Kutilmoqda')}
                  </span>
                </div>

                {/* Score & Risk Indicator */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--surface-2)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}>
                  <span className={`badge ${score.color}`} style={{ padding: '2px 6px', fontSize: '11px' }}>
                    {score.label} ({score.points || 85}/100)
                  </span>
                  <span style={{ color: 'var(--muted)', marginLeft: 'auto' }}>
                    Mavjud qarz: <b>{fmtMoney(currentBal, db.currency)}</b>
                  </span>
                </div>

                {/* Amount and Terms */}
                <div style={{
                  background: 'var(--surface-3)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    So'ralayotgan Summa
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', margin: '2px 0 6px' }}>
                    {fmtMoney(req.amount, db.currency)}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ink)', lineHeight: '1.4' }}>
                    <b>Maqsad:</b> {req.purpose}
                  </div>
                  {req.dueDate && (
                    <div style={{ fontSize: '12px', color: 'var(--gold)', marginTop: '4px', fontWeight: 600 }}>
                      📅 Qaytarish sanasi: {fmtDate(req.dueDate)}
                    </div>
                  )}
                  {req.rejectReason && (
                    <div style={{ fontSize: '12px', color: 'var(--rust)', marginTop: '4px' }}>
                      ❌ Rad etish sababi: {req.rejectReason}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ariza sanasi: {new Date(req.createdAt).toLocaleDateString()}</span>
                  <span>ID: #{req.id.slice(-6)}</span>
                </div>

                {/* Action Buttons */}
                {req.status === 'pending' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    <button
                      className="btn btn-gold btn-sm"
                      onClick={() => handleApprove(req)}
                      style={{ justifyContent: 'center' }}
                    >
                      ✓ Tasdiqlash
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setRejectReqId(req.id)}
                      style={{ color: 'var(--rust)', borderColor: 'var(--rust-soft)', justifyContent: 'center' }}
                    >
                      ✕ Rad etish
                    </button>
                  </div>
                )}

                {/* Quick Profile & Message Jump */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('clientDetail', req.clientId)}
                    style={{ flex: 1, fontSize: '11.5px', padding: '6px' }}
                  >
                    👤 Mijoz profili
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('messages')}
                    style={{ flex: 1, fontSize: '11.5px', padding: '6px' }}
                  >
                    💬 SMS yozish
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Debt Request Modal */}
      {showNewModal && (
        <div className="modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-head">
              <h3>➕ Yangi Qarz / Nasiya So'rovi</h3>
              <button className="modal-close" onClick={() => setShowNewModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateRequest} className="modal-body">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${borrowerType === 'existing' ? 'btn-gold' : 'btn-outline'}`}
                  onClick={() => setBorrowerType('existing')}
                  style={{ flex: 1 }}
                >
                  Mavjud Mijoz
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${borrowerType === 'new' ? 'btn-gold' : 'btn-outline'}`}
                  onClick={() => setBorrowerType('new')}
                  style={{ flex: 1 }}
                >
                  Yangi Ariza Beruvchi
                </button>
              </div>

              {borrowerType === 'existing' ? (
                <div className="form-field">
                  <label>Mijozni tanlang</label>
                  <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} required>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} — Qarz: {fmtMoney(clientBalance(c.id), db.currency)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-field">
                    <label>F.I.SH / Ismi</label>
                    <input
                      type="text"
                      placeholder="Mijoz ismi"
                      value={newBorrowerName}
                      onChange={e => setNewBorrowerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Telefon raqami</label>
                    <input
                      type="text"
                      placeholder="+998 90 123 45 67"
                      value={newBorrowerPhone}
                      onChange={e => setNewBorrowerPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="form-field">
                <label>So'ralayotgan summa ({db.currency})</label>
                <input
                  type="number"
                  placeholder="Masalan: 3000000"
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>Qarz maqsadi / Mahsulot</label>
                <input
                  type="text"
                  placeholder="Masalan: Qurilish mollari, Savdo aylanmasi"
                  value={purposeInput}
                  onChange={e => setPurposeInput(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Qaytarish va'da qilingan sana</label>
                <input
                  type="date"
                  value={dueDateInput}
                  onChange={e => setDueDateInput(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Qo'shimcha izoh / Kafil</label>
                <textarea
                  rows={2}
                  placeholder="Kafil yoki garov shartlari..."
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowNewModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-gold">
                  Arizani Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectReqId && (
        <div className="modal-backdrop" onClick={() => setRejectReqId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-head">
              <h3>Qarz so'rovini rad etish</h3>
              <button className="modal-close" onClick={() => setRejectReqId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Rad etish sababi</label>
                <input
                  type="text"
                  placeholder="Masalan: Limit yetarli emas yoki qarzdorlik ko'p"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setRejectReqId(null)}>
                  Bekor qilish
                </button>
                <button className="btn btn-danger" onClick={handleRejectConfirm}>
                  Rad etishni tasdiqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
