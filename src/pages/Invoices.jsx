import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, fmtDate, exportToCSV } from '../utils/helpers';
import { INVOICE_STATUSES } from '../utils/constants';
import InvoiceModal from '../components/modals/InvoiceModal';
import InvoiceViewModal from '../components/modals/InvoiceViewModal';

export default function Invoices() {
  const { db, deleteInvoice, updateInvoiceStatus } = useApp();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  const invoices = db?.invoices || [];

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(search.toLowerCase())) ||
      (inv.clientName && inv.clientName.toLowerCase().includes(search.toLowerCase())) ||
      (inv.clientPhone && inv.clientPhone.includes(search));
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Calculate Metrics
  const totalAmount = invoices.reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
  const pendingAmount = invoices.filter(i => i.status === 'sent' || i.status === 'partially_paid').reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);

  const handleOpenNewInvoice = () => {
    setEditingInvoiceId(null);
    setShowInvoiceModal(true);
  };

  const handleOpenEditInvoice = (id) => {
    setEditingInvoiceId(id);
    setShowInvoiceModal(true);
  };

  const handleOpenViewInvoice = (inv) => {
    setViewingInvoice(inv);
  };

  const handleExportCSV = () => {
    const headers = ['Faktura №', 'Mijoz', 'Sana', 'To\'lov muddati', 'Summa', 'Status'];
    const rows = filteredInvoices.map(i => [
      i.invoiceNo,
      i.clientName,
      i.date,
      i.dueDate,
      i.grandTotal,
      INVOICE_STATUSES[i.status]?.label || i.status
    ]);
    exportToCSV(headers, rows, `hisob-fakturalar-${new Date().toISOString().slice(0, 10)}.csv`);
    toast('Hisob-fakturalar ro\'yxati Excel (CSV) formatida yuklandi');
  };

  return (
    <div>
      {/* Top Stat Grid */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">Jami hisob-fakturalar</div>
          <div className="stat-value gold">{fmtMoney(totalAmount, db?.currency)}</div>
          <div className="stat-note">{invoices.length} ta B2B shartnoma hisobi</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">To'langan mablag'</div>
          <div className="stat-value teal">{fmtMoney(paidAmount, db?.currency)}</div>
          <div className="stat-note">Kassaga tushgan tushum</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Kutilayotgan to'lov</div>
          <div className="stat-value ink">{fmtMoney(pendingAmount, db?.currency)}</div>
          <div className="stat-note">Yuborilgan va faol fakturalar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Muddati o'tgan</div>
          <div className="stat-value rust">{fmtMoney(overdueAmount, db?.currency)}</div>
          <div className="stat-note">Kechikkan to'lovlar</div>
        </div>
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Faktura № yoki mijoz nomi bo'yicha qidiruv..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: '220px', flex: 1, padding: '10px 14px', borderRadius: '10px' }}
          />
          <select
            className="input-field"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '180px', padding: '10px 14px', borderRadius: '10px' }}
          >
            <option value="all">Barcha holatlar</option>
            {Object.entries(INVOICE_STATUSES).map(([key, info]) => (
              <option key={key} value={key}>{info.badge} {info.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
            📊 Excelga eksport
          </button>
          <button className="btn btn-gold btn-sm" onClick={handleOpenNewInvoice}>
            + Yangi hisob-faktura
          </button>
        </div>
      </div>

      {/* Table */}
      {filteredInvoices.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <div className="t">Hisob-faktura topilmadi</div>
          <div className="s">Korxona yoki mijozlarga rasmiy hisob-faktura (schet-faktura) tuzish uchun tugmani bosing.</div>
          <button className="btn btn-gold btn-sm" style={{ marginTop: '12px' }} onClick={handleOpenNewInvoice}>
            + Yangi faktura yaratish
          </button>
        </div>
      ) : (
        <div className="enterprise-table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Hujjat №</th>
                <th>Mijoz / Tashkilot</th>
                <th>Sana & Muddat</th>
                <th>Mahsulotlar</th>
                <th>Jami summa</th>
                <th>Holat (Status)</th>
                <th style={{ textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => {
                const statusInfo = INVOICE_STATUSES[inv.status] || INVOICE_STATUSES.sent;
                return (
                  <tr key={inv.id}>
                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {inv.invoiceNo}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{inv.clientName}</div>
                      {inv.clientPhone && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{inv.clientPhone}</div>}
                      {inv.clientInn && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>INN: {inv.clientInn}</div>}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>Tuzilgan: <b>{fmtDate(inv.date)}</b></div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>To'lov muddati: {fmtDate(inv.dueDate)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {inv.items ? `${inv.items.length} xil pozitsiya` : '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--gold)' }}>
                        {fmtMoney(inv.grandTotal, inv.currency || db?.currency)}
                      </div>
                    </td>
                    <td>
                      <select
                        value={inv.status}
                        onChange={e => updateInvoiceStatus(inv.id, e.target.value)}
                        className={`badge-status ${statusInfo.color}`}
                        style={{ border: 'none', cursor: 'pointer', background: 'var(--surface-2)', padding: '4px 8px' }}
                      >
                        {Object.entries(INVOICE_STATUSES).map(([k, s]) => (
                          <option key={k} value={k}>{s.badge} {s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          title="Fakturani ko'rish & Chop etish"
                          onClick={() => handleOpenViewInvoice(inv)}
                        >
                          👁️ Ko'rish / Print
                        </button>
                        <button
                          className="icon-btn"
                          title="Tahrirlash"
                          onClick={() => handleOpenEditInvoice(inv.id)}
                        >
                          ✏️
                        </button>
                        <button
                          className="icon-btn"
                          title="O'chirish"
                          onClick={() => {
                            if (window.confirm(`"${inv.invoiceNo}" raqamli fakturani o'chirishni tasdiqlaysizmi?`)) {
                              deleteInvoice(inv.id);
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

      {/* Invoice Edit/Create Modal */}
      {showInvoiceModal && (
        <InvoiceModal
          invoiceId={editingInvoiceId}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {/* Invoice View & Print Modal */}
      {viewingInvoice && (
        <InvoiceViewModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onEditStatus={(status) => {
            updateInvoiceStatus(viewingInvoice.id, status);
            setViewingInvoice(prev => ({ ...prev, status }));
          }}
        />
      )}
    </div>
  );
}
