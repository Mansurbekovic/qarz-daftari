import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, fmtDate, initials, exportToCSV } from '../utils/helpers';
import { SUPPLIER_CATEGORIES } from '../utils/constants';
import SupplierModal from '../components/modals/SupplierModal';
import SupplyOrderModal from '../components/modals/SupplyOrderModal';

export default function Suppliers() {
  const { db, supplierBalance, deleteSupplier, addSupplierPayment } = useApp();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('suppliers'); // 'suppliers' | 'orders' | 'payments'
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal States
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderSupplierId, setOrderSupplierId] = useState(null);

  // Pay Supplier Quick Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [paySupplier, setPaySupplier] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payCardId, setPayCardId] = useState('');
  const [payNote, setPayNote] = useState('');

  const suppliers = db?.suppliers || [];
  const supplyOrders = db?.supplyOrders || [];
  const supplierPayments = db?.supplierPayments || [];

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.company && s.company.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.includes(search));
    const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // Totals
  const totalDebtToSuppliers = suppliers.reduce((sum, s) => {
    const bal = supplierBalance(s.id);
    return sum + (bal > 0 ? bal : 0);
  }, 0);

  const totalOrdersSum = supplyOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const totalPaymentsSum = supplierPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handleOpenAddSupplier = () => {
    setEditingSupplierId(null);
    setShowSupplierModal(true);
  };

  const handleOpenEditSupplier = (id) => {
    setEditingSupplierId(id);
    setShowSupplierModal(true);
  };

  const handleOpenNewOrder = (supplierId = null) => {
    setOrderSupplierId(supplierId);
    setShowOrderModal(true);
  };

  const handleOpenPayModal = (supplier) => {
    setPaySupplier(supplier);
    const bal = supplierBalance(supplier.id);
    setPayAmount(bal > 0 ? String(bal) : '');
    setPayCardId(db?.cards?.[0]?.id || '');
    setPayNote(`"${supplier.name}" ga to'lov`);
    setShowPayModal(true);
  };

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    if (!paySupplier || !payAmount || Number(payAmount) <= 0) {
      toast('Iltimos, to\'g\'ri summa kiriting', 'warning');
      return;
    }

    addSupplierPayment({
      supplierId: paySupplier.id,
      supplierName: paySupplier.name,
      amount: Number(payAmount),
      cardId: payCardId || null,
      note: payNote,
      date: new Date().toISOString().slice(0, 10),
    });

    setShowPayModal(false);
  };

  const handleExportCSV = () => {
    if (activeTab === 'suppliers') {
      const headers = ['Ism/Mas\'ul', 'Kompaniya', 'Kategoriya', 'Telefon', 'INN', 'Qarzimiz'];
      const rows = suppliers.map(s => [
        s.name,
        s.company || '—',
        s.category || '—',
        s.phone || '—',
        s.inn || '—',
        supplierBalance(s.id)
      ]);
      exportToCSV(headers, rows, `taminotchilar-${new Date().toISOString().slice(0, 10)}.csv`);
    } else if (activeTab === 'orders') {
      const headers = ['Buyurtma №', 'Ta\'minotchi', 'Sana', 'Summa', 'Mahsulotlar soni'];
      const rows = supplyOrders.map(o => {
        const sup = suppliers.find(s => s.id === o.supplierId);
        return [o.orderNo, sup ? sup.name : '—', o.date, o.totalAmount, o.items ? o.items.length : 0];
      });
      exportToCSV(headers, rows, `tovar-kirimlari-${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      const headers = ['Sana', 'Ta\'minotchi', 'Summa', 'Karta/Hisob', 'Izoh'];
      const rows = supplierPayments.map(p => [p.date, p.supplierName, p.amount, p.cardId || 'Kassa (Naqd)', p.note]);
      exportToCSV(headers, rows, `taminotchi-tolovlari-${new Date().toISOString().slice(0, 10)}.csv`);
    }
    toast('Excel (CSV) hisobot muvaffaqiyatli yuklandi');
  };

  return (
    <div>
      {/* Top Stat Grid */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">Ta'minotchilarga qarzimiz</div>
          <div className="stat-value rust">{fmtMoney(totalDebtToSuppliers, db?.currency)}</div>
          <div className="stat-note">Yetkazib beruvchilar oldidagi jami qarz</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Jami xaridlar (Kirim)</div>
          <div className="stat-value gold">{fmtMoney(totalOrdersSum, db?.currency)}</div>
          <div className="stat-note">{supplyOrders.length} ta partiya tovar qabul qilingan</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">To'langan mablag'</div>
          <div className="stat-value teal">{fmtMoney(totalPaymentsSum, db?.currency)}</div>
          <div className="stat-note">{supplierPayments.length} ta to'lov amalga oshirilgan</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ta'minotchilar soni</div>
          <div className="stat-value ink">{suppliers.length} ta</div>
          <div className="stat-note">Hamkor zavod va optom bazalar</div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div className="subnav-tabs" style={{ marginBottom: 0 }}>
          <button
            className={`subnav-tab ${activeTab === 'suppliers' ? 'active' : ''}`}
            onClick={() => setActiveTab('suppliers')}
          >
            🏭 Ta'minotchilar
            <span className="tab-badge">{suppliers.length}</span>
          </button>
          <button
            className={`subnav-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📦 Tovar qabuli (Kirim)
            <span className="tab-badge">{supplyOrders.length}</span>
          </button>
          <button
            className={`subnav-tab ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            💳 To'lovlar jurnali
            <span className="tab-badge">{supplierPayments.length}</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
            📊 Excelga eksport
          </button>
          {activeTab === 'orders' ? (
            <button className="btn btn-gold btn-sm" onClick={() => handleOpenNewOrder()}>
              + Yangi tovar qabuli
            </button>
          ) : (
            <button className="btn btn-gold btn-sm" onClick={handleOpenAddSupplier}>
              + Ta'minotchi qo'shish
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: SUPPLIERS LIST */}
      {activeTab === 'suppliers' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Ta'minotchi yoki kompaniya nomi bo'yicha qidiruv..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
              />
            </div>
            <select
              className="input-field"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '180px', padding: '10px 14px', borderRadius: '10px' }}
            >
              <option value="all">Barcha toifalar</option>
              {SUPPLIER_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {filteredSuppliers.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <div className="t">Ta'minotchi topilmadi</div>
              <div className="s">Yangi zavod, diler yoki optom bazani ro'yxatga kiriting.</div>
              <button className="btn btn-gold btn-sm" style={{ marginTop: '12px' }} onClick={handleOpenAddSupplier}>
                + Yangi ta'minotchi qo'shish
              </button>
            </div>
          ) : (
            <div className="enterprise-table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Ta'minotchi / Mas'ul</th>
                    <th>Toifa</th>
                    <th>Telefon & Manzil</th>
                    <th>Rekvizitlar (INN)</th>
                    <th>Qarzimiz balansi</th>
                    <th style={{ textAlign: 'right' }}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map(s => {
                    const bal = supplierBalance(s.id);
                    return (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '12px' }}>
                              {initials(s.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{s.name}</div>
                              {s.company && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{s.company}</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge-status info" style={{ fontSize: '11px' }}>
                            {s.category || 'Ta\'minotchi'}
                          </span>
                        </td>
                        <td>
                          <div>{s.phone || '—'}</div>
                          {s.address && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{s.address}</div>}
                        </td>
                        <td>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                            INN: {s.inn || '—'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, fontSize: '14px' }} className={bal > 0 ? 'rust' : 'teal'}>
                            {fmtMoney(bal, db?.currency)}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            {bal > 0 ? 'To\'lashimiz kerak' : 'Hisob-kitob toza'}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              className="btn btn-sm btn-outline"
                              title="Tovar qabuli (Kirim)"
                              onClick={() => handleOpenNewOrder(s.id)}
                            >
                              📦 Kirim
                            </button>
                            <button
                              className="btn btn-sm btn-gold"
                              title="To'lov qilish"
                              onClick={() => handleOpenPayModal(s)}
                            >
                              💰 To'lov
                            </button>
                            <button
                              className="icon-btn"
                              title="Tahrirlash"
                              onClick={() => handleOpenEditSupplier(s.id)}
                            >
                              ✏️
                            </button>
                            <button
                              className="icon-btn"
                              title="O'chirish"
                              onClick={() => {
                                if (window.confirm(`"${s.name}" ta'minotchisini o'chirishni xohlaysizmi?`)) {
                                  deleteSupplier(s.id);
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

      {/* TAB 2: SUPPLY ORDERS (KIRIMLAR) */}
      {activeTab === 'orders' && (
        <>
          {supplyOrders.length === 0 ? (
            <div className="empty-state">
              <div className="t">Tovar kirimlari hali qayd etilmagan</div>
              <div className="s">Ta'minotchidan tovar olganingizda, uni skladga avtomatik kirim qilish uchun buyurtma oching.</div>
              <button className="btn btn-gold btn-sm" style={{ marginTop: '12px' }} onClick={() => handleOpenNewOrder()}>
                + Yangi tovar qabuli
              </button>
            </div>
          ) : (
            <div className="enterprise-table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Hujjat №</th>
                    <th>Ta'minotchi</th>
                    <th>Sana</th>
                    <th>Mahsulotlar</th>
                    <th>Jami summa</th>
                  </tr>
                </thead>
                <tbody>
                  {[...supplyOrders].reverse().map(o => {
                    const sup = suppliers.find(s => s.id === o.supplierId);
                    return (
                      <tr key={o.id}>
                        <td>
                          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{o.orderNo}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{sup ? sup.name : 'Ta\'minotchi'}</div>
                          {sup?.company && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{sup.company}</div>}
                        </td>
                        <td>{fmtDate(o.date)}</td>
                        <td>
                          <div style={{ fontSize: '12px' }}>
                            {o.items ? (
                              <span>
                                <b>{o.items.length} xil tovar</b>: {o.items.map(it => `${it.name} (${it.quantity || it.qty} ${it.unit})`).slice(0, 2).join(', ')}
                                {o.items.length > 2 && ' va h.k.'}
                              </span>
                            ) : '—'}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--gold)' }}>
                            {fmtMoney(o.totalAmount, db?.currency)}
                          </span>
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

      {/* TAB 3: SUPPLIER PAYMENTS */}
      {activeTab === 'payments' && (
        <>
          {supplierPayments.length === 0 ? (
            <div className="empty-state">
              <div className="t">To'lovlar jurnali bo'sh</div>
              <div className="s">Ta'minotchiga to'lov qilinganida bu yerda to'liq audit jurnali aks etadi.</div>
            </div>
          ) : (
            <div className="enterprise-table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Sana</th>
                    <th>Ta'minotchi</th>
                    <th>To'langan summa</th>
                    <th>To'lov manbasi</th>
                    <th>Izoh</th>
                  </tr>
                </thead>
                <tbody>
                  {[...supplierPayments].reverse().map(p => {
                    const card = db?.cards?.find(c => c.id === p.cardId);
                    return (
                      <tr key={p.id}>
                        <td>{fmtDate(p.date)}</td>
                        <td>
                          <span style={{ fontWeight: 700 }}>{p.supplierName || 'Ta\'minotchi'}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, color: 'var(--teal)' }}>
                            {fmtMoney(p.amount, db?.currency)}
                          </span>
                        </td>
                        <td>
                          {card ? (
                            <span style={{ fontSize: '12px' }}>💳 {card.bank} •{card.last4}</span>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--gold)' }}>💵 Kassa (Naqd pul)</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{p.note || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <SupplierModal
          supplierId={editingSupplierId}
          onClose={() => setShowSupplierModal(false)}
        />
      )}

      {/* Supply Order Modal */}
      {showOrderModal && (
        <SupplyOrderModal
          defaultSupplierId={orderSupplierId}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      {/* Quick Pay Modal */}
      {showPayModal && paySupplier && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-head">
              <h3>Ta'minotchiga to'lov: {paySupplier.name}</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <form onSubmit={handleConfirmPayment}>
              <div className="modal-body">
                <div style={{ marginBottom: '14px', background: 'var(--surface-2)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Joriy qarzimiz:</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--rust)' }}>
                    {fmtMoney(supplierBalance(paySupplier.id), db?.currency)}
                  </div>
                </div>

                <div className="form-field">
                  <label>To'lov summasi ({db?.currency || "so'm"}) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Masalan: 500000"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Qaysi kartadan yoki kassadan to'lanmoqda?</label>
                  <select value={payCardId} onChange={e => setPayCardId(e.target.value)}>
                    <option value="">💵 Asosiy Kassa (Naqd pul)</option>
                    {(db?.cards || []).map(cd => (
                      <option key={cd.id} value={cd.id}>
                        💳 {cd.bank} •{cd.last4} ({fmtMoney(cd.balance, db?.currency)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>To'lov izohi</label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={e => setPayNote(e.target.value)}
                    placeholder="Masalan: Tovar partiyasi uchun to'lov"
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowPayModal(false)}>
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn btn-teal">
                    To'lovni tasdiqlash
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
