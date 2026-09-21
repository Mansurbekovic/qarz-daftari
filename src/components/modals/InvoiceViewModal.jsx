import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { fmtMoney, fmtDate, numberToUzbekWords } from '../../utils/helpers';
import { INVOICE_STATUSES } from '../../utils/constants';

export default function InvoiceViewModal({ invoice, onClose, onEditStatus }) {
  const { db } = useApp();

  if (!invoice) return null;

  const bizName = db?.businessName || 'Do\'kon / Tashkilot';
  const bizPhone = db?.phone || '';
  const bizAddress = db?.address || '';
  const bizInn = db?.inn || '123456789';
  const bizMfo = db?.mfo || '00401';
  const bizBankAcc = db?.bankAccount || '20208000000000000000';

  const statusInfo = INVOICE_STATUSES[invoice.status] || INVOICE_STATUSES.sent;
  const wordsTotal = numberToUzbekWords(invoice.grandTotal);

  const handlePrint = () => {
    window.print();
  };

  const handleShareTelegram = () => {
    const text = `Assalomu alaykum, ${invoice.clientName}!\n` +
      `Sizga "${bizName}" tomonidan № ${invoice.invoiceNo} sonli Hisob-Faktura taqdim etildi.\n` +
      `Sana: ${fmtDate(invoice.date)}\n` +
      `To'lov muddati: ${fmtDate(invoice.dueDate)}\n` +
      `Jami to'lov summasi: ${fmtMoney(invoice.grandTotal, invoice.currency)}\n\n` +
      `Iltimos, to'lovni o'z vaqtida amalga oshirishingizni so'raymiz. Rahmat!`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(bizName)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '860px', width: '95%', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3>🧾 Faktura № {invoice.invoiceNo}</h3>
            <span className={`badge-status ${invoice.status}`}>
              {statusInfo.badge} {statusInfo.label}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {onEditStatus && (
              <select
                className="input"
                style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                value={invoice.status}
                onChange={e => onEditStatus(invoice.id, e.target.value)}
              >
                {Object.entries(INVOICE_STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>{v.badge} {v.label}</option>
                ))}
              </select>
            )}
            <button type="button" className="btn btn-teal btn-sm" onClick={handleShareTelegram}>
              ✈️ Telegram
            </button>
            <button type="button" className="btn btn-gold btn-sm" onClick={handlePrint}>
              🖨️ Chop etish / PDF
            </button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', padding: '24px' }}>
          {/* Printable Invoice Paper Container */}
          <div id="printable-contract" className="printable-invoice-paper">
            {/* Header */}
            <div className="invoice-header-row">
              <div>
                <div className="invoice-brand-title">{bizName}</div>
                <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                  Savdo va xizmat ko'rsatish tizimi
                </div>
              </div>

              <div className="invoice-meta-right">
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0E2419' }}>
                  HISOB-FAKTURA & YUK XATI
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '3px' }}>
                  № {invoice.invoiceNo}
                </div>
                <div style={{ marginTop: '4px' }}>
                  Sana: <strong>{fmtDate(invoice.date)}</strong> yil
                </div>
                <div>
                  To'lov muddati: <strong>{fmtDate(invoice.dueDate)}</strong> yil
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '2px solid #0E2419', margin: '14px 0 20px 0' }} />

            {/* Requisites grid */}
            <div className="invoice-details-grid">
              <div>
                <strong>YETKAZIB BERUVCHI (Sotuvchi):</strong><br />
                <span>Nomi: {bizName}</span><br />
                <span>Manzil: {bizAddress || 'Toshkent sh.'}</span><br />
                <span>Telefon: {bizPhone || '—'}</span><br />
                <span>INN: {bizInn} | MFO: {bizMfo}</span><br />
                <span>H/r: {bizBankAcc}</span>
              </div>

              <div>
                <strong>BUYURTMACHI (Xaridor):</strong><br />
                <span>Nomi: {invoice.clientName}</span><br />
                <span>Manzil: {invoice.clientAddress || '—'}</span><br />
                <span>Telefon: {invoice.clientPhone || '—'}</span><br />
                <span>INN: {invoice.clientInn || '—'}</span>
              </div>
            </div>

            {/* Table */}
            <table className="invoice-table-print">
              <thead>
                <tr>
                  <th style={{ width: '35px' }}>№</th>
                  <th>Tovar / Xizmat nomi</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>Birlik</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>Miqdor</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Narxi</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Jami summa</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((it, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td><strong>{it.name}</strong></td>
                    <td style={{ textAlign: 'center' }}>{it.unit || 'dona'}</td>
                    <td style={{ textAlign: 'right' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{fmtMoney(it.price, invoice.currency)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {fmtMoney(it.subtotal || (it.quantity * it.price), invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total summary */}
            <div className="invoice-summary-box">
              <table className="invoice-summary-table">
                <tbody>
                  <tr>
                    <td>Oraliq summa:</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {fmtMoney(invoice.subtotal, invoice.currency)}
                    </td>
                  </tr>
                  {invoice.discountPercent > 0 && (
                    <tr style={{ color: '#b33a2b' }}>
                      <td>Chegirma ({invoice.discountPercent}%):</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        -{fmtMoney((invoice.subtotal * invoice.discountPercent) / 100, invoice.currency)}
                      </td>
                    </tr>
                  )}
                  {invoice.vatPercent > 0 && (
                    <tr style={{ color: '#1F6E5C' }}>
                      <td>QQS (12%):</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        +{fmtMoney((invoice.subtotal * 0.12), invoice.currency)}
                      </td>
                    </tr>
                  )}
                  <tr className="grand-row">
                    <td>JAMI TO'LOV:</td>
                    <td style={{ textAlign: 'right' }}>
                      {fmtMoney(invoice.grandTotal, invoice.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* In words */}
            <div style={{
              background: '#f8f9fa',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '30px'
            }}>
              <span>Jami yozma summa: </span>
              <strong>{wordsTotal}</strong>
            </div>

            {/* Signatures */}
            <div className="invoice-signatures">
              <div style={{ width: '45%' }}>
                <div><strong>Rahbar / Bosh hisobchi:</strong></div>
                <div style={{ marginTop: '25px' }}>Imzo: _________________________</div>
                <div className="invoice-seal-box">M.O'. (Muhr o'rni)</div>
              </div>

              <div style={{ width: '45%' }}>
                <div><strong>Tovarni qabul qildi (Xaridor):</strong></div>
                <div style={{ marginTop: '25px' }}>Imzo: _________________________</div>
                <div className="invoice-seal-box">M.O'. (Muhr o'rni)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
