import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, fmtDate, todayISO, exportToCSV } from '../utils/helpers';

export default function Kassa() {
  const { db, updateDB, navigate } = useApp();
  const toast = useToast();

  const [filterPeriod, setFilterPeriod] = useState('today'); // 'today' | 'yesterday' | 'week' | 'month' | 'all'
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [entryType, setEntryType] = useState('income'); // 'income' | 'expense'
  const [entryCategory, setEntryCategory] = useState('Naqd savdo');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryNote, setEntryNote] = useState('');

  const today = todayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  // Combine regular debt/payment transactions with manual kassa entries
  const allTxs = db.transactions || [];
  const manualEntries = db.kassaEntries || [];

  // Filter transactions by period
  const filterByDate = (dateStr) => {
    if (!dateStr) return false;
    if (filterPeriod === 'today') return dateStr === today;
    if (filterPeriod === 'yesterday') return dateStr === yesterday;
    if (filterPeriod === 'week') return dateStr >= oneWeekAgo;
    if (filterPeriod === 'month') return dateStr >= startOfMonth;
    return true;
  };

  const periodTxs = allTxs.filter(t => filterByDate(t.date));
  const periodManual = manualEntries.filter(e => filterByDate(e.date));

  // Calculations
  const debtGiven = periodTxs
    .filter(t => t.type === 'debt')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const paymentsReceived = periodTxs
    .filter(t => t.type === 'payment')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const cashSales = periodManual
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const expenses = periodManual
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalCashflowIn = paymentsReceived + cashSales;
  const netProfitCash = totalCashflowIn - expenses;

  // Add manual kassa entry
  const handleSaveEntry = (e) => {
    e.preventDefault();
    const num = parseFloat(entryAmount);
    if (!num || num <= 0) {
      toast('To\'g\'ri summa kiriting', 'error');
      return;
    }

    const newEntry = {
      id: 'kassa_' + Date.now(),
      type: entryType,
      category: entryCategory,
      amount: num,
      note: entryNote.trim(),
      date: todayISO(),
      timestamp: new Date().toISOString(),
    };

    updateDB(prev => ({
      ...prev,
      kassaEntries: [newEntry, ...(prev.kassaEntries || [])],
    }));

    toast(entryType === 'income' ? 'Kassaga tushum qo\'shildi' : 'Kassadan xarajat qayd etildi');
    setShowAddEntryModal(false);
    setEntryAmount('');
    setEntryNote('');
  };

  const handleDeleteManual = (id) => {
    updateDB(prev => ({
      ...prev,
      kassaEntries: (prev.kassaEntries || []).filter(e => e.id !== id),
    }));
    toast('O\'chirildi');
  };

  // Export Daily Z-Report
  const handleExportZReport = () => {
    const headers = ['Sana', 'Tur', 'Kategoriya', 'Mijoz / Izoh', 'Summa'];
    const rows = [];

    periodTxs.forEach(t => {
      const c = db.clients.find(cl => cl.id === t.clientId);
      rows.push([
        t.date,
        t.type === 'debt' ? 'Nasiya berildi' : 'Qarz to\'landi',
        t.paymentMethod || 'Kassa',
        c ? c.name : 'Mijoz',
        t.amount
      ]);
    });

    periodManual.forEach(m => {
      rows.push([
        m.date,
        m.type === 'income' ? 'To\'g\'ridan-to\'g\'ri tushum' : 'Xarajat',
        m.category,
        m.note || '—',
        m.amount
      ]);
    });

    exportToCSV(headers, rows, `kassa-z-hisobot-${filterPeriod}-${todayISO()}.csv`);
    toast('Z-Hisobot yuklab olindi');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div className="chip-group">
          <button className={`chip ${filterPeriod === 'today' ? 'active' : ''}`} onClick={() => setFilterPeriod('today')}>
            Bugun
          </button>
          <button className={`chip ${filterPeriod === 'yesterday' ? 'active' : ''}`} onClick={() => setFilterPeriod('yesterday')}>
            Kecha
          </button>
          <button className={`chip ${filterPeriod === 'week' ? 'active' : ''}`} onClick={() => setFilterPeriod('week')}>
            Oxirgi 7 kun
          </button>
          <button className={`chip ${filterPeriod === 'month' ? 'active' : ''}`} onClick={() => setFilterPeriod('month')}>
            Bu oy
          </button>
          <button className={`chip ${filterPeriod === 'all' ? 'active' : ''}`} onClick={() => setFilterPeriod('all')}>
            Barchasi
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportZReport}>
            📊 Z-Hisobot (Excel)
          </button>
          <button className="btn btn-gold btn-sm" onClick={() => setShowAddEntryModal(true)}>
            + Kassa amali qo'shish
          </button>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '20px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--teal)' }}>
          <div className="stat-label">💵 Jami Pul Tushumi (Naqd/Karta)</div>
          <div className="stat-value teal">{fmtMoney(totalCashflowIn, db.currency)}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            Qarz to'lovlari: {fmtMoney(paymentsReceived, db.currency)} · Naqd savdo: {fmtMoney(cashSales, db.currency)}
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--rust)' }}>
          <div className="stat-label">🛍️ Nasiyaga Berilgan Savdo</div>
          <div className="stat-value rust">{fmtMoney(debtGiven, db.currency)}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            {periodTxs.filter(t => t.type === 'debt').length} ta nasiya xaridi
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #ED1C24' }}>
          <div className="stat-label">💸 Do'kon Xarajatlari</div>
          <div className="stat-value" style={{ color: '#ED1C24' }}>{fmtMoney(expenses, db.currency)}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            Ijara, yetkazish, ish haqi va h.k.
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--gold)' }}>
          <div className="stat-label">💰 Sof Kassa Qoldig'i</div>
          <div className="stat-value gold">{fmtMoney(netProfitCash, db.currency)}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            Tushum minus Xarajatlar
          </div>
        </div>
      </div>

      {/* Combined Activity Stream */}
      <div className="section-title">Kassa Harakatlari Jurnali</div>

      {(periodTxs.length === 0 && periodManual.length === 0) ? (
        <div className="empty-state">
          <div className="t">Tanlangan davrda kassa harakati yo'q</div>
          <div className="s">Mijozlardan to'lov qabul qilinganda yoki kassa amali kiritilganda bu yerda ko'rinadi.</div>
        </div>
      ) : (
        <div className="ledger-card">
          {/* Manual Kassa entries */}
          {periodManual.map(entry => (
            <div key={entry.id} className={`ledger-row type-${entry.type === 'income' ? 'payment' : 'debt'}`}>
              <div className="avatar" style={{ background: entry.type === 'income' ? 'rgba(31,110,92,0.15)' : 'rgba(139,58,43,0.15)', color: entry.type === 'income' ? 'var(--teal)' : 'var(--rust)' }}>
                {entry.type === 'income' ? '💰' : '💸'}
              </div>
              <div className="row-main">
                <div className="row-title">{entry.category}</div>
                <div className="row-sub">
                  Kassa amali · {fmtDate(entry.date)}{entry.note ? ` · ${entry.note}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={`row-amount ${entry.type === 'income' ? 'teal' : 'rust'}`}>
                  {entry.type === 'income' ? '+' : '−'}{fmtMoney(entry.amount, db.currency)}
                </div>
                <button
                  onClick={() => handleDeleteManual(entry.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '14px' }}
                  title="O'chirish"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {/* Transactions */}
          {periodTxs.map(tx => {
            const c = db.clients.find(cl => cl.id === tx.clientId);
            const isDebt = tx.type === 'debt';
            return (
              <div
                key={tx.id}
                className={`ledger-row type-${tx.type}`}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('clientDetail', tx.clientId)}
              >
                <div className="avatar">{isDebt ? '🛍️' : '💳'}</div>
                <div className="row-main">
                  <div className="row-title">
                    {c ? c.name : 'Mijoz'} — {isDebt ? 'Nasiya berildi' : 'Qarz to\'landi'}
                  </div>
                  <div className="row-sub">
                    {fmtDate(tx.date)} · {tx.paymentMethod === 'card' ? 'Plastik karta' : tx.paymentMethod === 'payme' ? 'Payme' : tx.paymentMethod === 'click' ? 'Click' : 'Naqd pul'}
                    {tx.note ? ` · ${tx.note}` : ''}
                  </div>
                </div>
                <div className={`row-amount ${isDebt ? 'rust' : 'teal'}`}>
                  {isDebt ? '🛍️ ' : '+'}{fmtMoney(tx.amount, db.currency)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Kassa Entry Modal */}
      {showAddEntryModal && (
        <div className="modal-backdrop" onClick={() => setShowAddEntryModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Kassa amali kiritish</h3>
              <button className="modal-close" onClick={() => setShowAddEntryModal(false)}>✕</button>
            </div>
            <form className="modal-body" onSubmit={handleSaveEntry}>
              <div className="type-toggle" style={{ marginBottom: '14px' }}>
                <button
                  type="button"
                  className={`sel-a ${entryType === 'income' ? 'active' : ''}`}
                  onClick={() => { setEntryType('income'); setEntryCategory('Naqd savdo'); }}
                >
                  ➕ Kassa Tushumi
                  <span className="small">Naqd savdo, boshqa tushum</span>
                </button>
                <button
                  type="button"
                  className={`sel-b ${entryType === 'expense' ? 'active' : ''}`}
                  onClick={() => { setEntryType('expense'); setEntryCategory('Xarajat'); }}
                >
                  ➖ Kassadan Chiqim
                  <span className="small">Ijara, ta'minot, ish haqi</span>
                </button>
              </div>

              <div className="form-field">
                <label>Kategoriya</label>
                <select value={entryCategory} onChange={e => setEntryCategory(e.target.value)}>
                  {entryType === 'income' ? (
                    <>
                      <option value="Naqd savdo">Naqd savdo tushumi</option>
                      <option value="Xizmat ko'rsatish">Xizmat haqi</option>
                      <option value="Karta tushumi">Karta orqali savdo</option>
                      <option value="Boshqa tushum">Boshqa tushum</option>
                    </>
                  ) : (
                    <>
                      <option value="Do'kon ijarasi">Do'kon ijarasi</option>
                      <option value="Xodimlar oyligi">Ish haqi / Oylik</option>
                      <option value="Kommunal to'lovlar">Kommunal to'lovlar (Svet, Gaz)</option>
                      <option value="Transport / Yetkazib berish">Yetkazib berish / Yo'l kira</option>
                      <option value="Tushlik / Ovqatlanish">Tushlik / Ovqatlanish</option>
                      <option value="Boshqa xarajat">Boshqa xarajat</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-field">
                <label>Summa ({db.currency}) *</label>
                <input
                  type="number"
                  placeholder="0"
                  min="1"
                  value={entryAmount}
                  onChange={e => setEntryAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>Izoh</label>
                <input
                  type="text"
                  placeholder="Masalan: Tushlik yoki yetkazuvchiga..."
                  value={entryNote}
                  onChange={e => setEntryNote(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddEntryModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-gold">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
