import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { fmtMoney, fmtDate } from '../../utils/helpers';

export default function ReconciliationModal({ supplier, onClose }) {
  const { db } = useApp();

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const bizName = db?.businessName || 'Do\'kon / Korxona';
  const bizPhone = db?.phone || '';
  const bizInn = db?.inn || '';

  // Filter supply orders and payments for this supplier within date range
  const allOrders = (db?.supplyOrders || []).filter(o => o.supplierId === supplier.id);
  const allPayments = (db?.supplierPayments || []).filter(p => p.supplierId === supplier.id);

  const filteredOrders = allOrders.filter(o => o.date >= startDate && o.date <= endDate);
  const filteredPayments = allPayments.filter(p => p.date >= startDate && p.date <= endDate);

  const periodOrdered = filteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const periodPaid = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Overall lifetime balance
  const totalLifetimeOrdered = allOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const totalLifetimePaid = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const currentTotalDebt = totalLifetimeOrdered - totalLifetimePaid;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '820px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head no-print">
          <h3>📑 O'zaro hisob-kitoblar solishtirma dalolatnomasi (Акт сверки)</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" className="btn btn-gold btn-sm" onClick={handlePrint}>
              🖨️ Chop etish / PDF
            </button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="no-print" style={{
          padding: '12px 20px',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Davr:</span>
          <input
            type="date"
            className="input"
            style={{ width: '150px' }}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <span>—</span>
          <input
            type="date"
            className="input"
            style={{ width: '150px' }}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', padding: '24px' }}>
          {/* Printable Document Sheet */}
          <div id="printable-contract" className="printable-invoice-paper">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                O'ZARO HISOB-KITOBLARNI SOLISHTIRMA DALOLATNOMASI
              </div>
              <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                {fmtDate(startDate)} dan {fmtDate(endDate)} gacha bo'lgan davr uchun
              </div>
            </div>

            <p style={{ fontSize: '13px', textIndent: '20px', textAlign: 'justify', lineHeight: '1.6' }}>
              Biz, quyida imzo chekuvchilar, bir tomondan <strong>"{bizName}"</strong> (INN: {bizInn || '—'}, Tel: {bizPhone || '—'}) va ikkinchi tomondan <strong>"{supplier.name}"</strong> (Firma: {supplier.company || '—'}, INN: {supplier.inn || '—'}), ushbu dalolatnomani tuzdik, unga ko'ra yuqorida ko'rsatilgan davr uchun o'zaro hisob-kitoblar holati quyidagicha tasdiqlanadi:
            </p>

            {/* Reconciliation Data Table */}
            <table className="invoice-table-print" style={{ marginTop: '16px' }}>
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Sana</th>
                  <th style={{ width: '120px' }}>Hujjat №</th>
                  <th>Operatsiya tavsifi</th>
                  <th style={{ textAlign: 'right' }}>Tovar kirimi (Kredit)</th>
                  <th style={{ textAlign: 'right' }}>To'lov (Debet)</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 && filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: '#777' }}>
                      Belgilangan davr uchun harakatlar mavjud emas
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredOrders.map(o => (
                      <tr key={o.id}>
                        <td>{fmtDate(o.date)}</td>
                        <td><strong>{o.orderNo}</strong></td>
                        <td>
                          Tovar qabuli: {o.items?.map(it => `${it.name} (${it.quantity} ${it.unit})`).slice(0, 3).join(', ')}
                          {(o.items?.length || 0) > 3 ? '...' : ''}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {fmtMoney(o.totalAmount, db?.currency)}
                        </td>
                        <td style={{ textAlign: 'right', color: '#999' }}>—</td>
                      </tr>
                    ))}
                    {filteredPayments.map(p => (
                      <tr key={p.id}>
                        <td>{fmtDate(p.date)}</td>
                        <td>To'lov</td>
                        <td>Ta'minotchiga to'lov ({p.note || 'To\'lov'})</td>
                        <td style={{ textAlign: 'right', color: '#999' }}>—</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#1F6E5C' }}>
                          {fmtMoney(p.amount, db?.currency)}
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>

            {/* Total balance summary */}
            <div style={{
              background: '#f8f9fa',
              padding: '14px 18px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              marginTop: '16px',
              fontSize: '13.5px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Ko'rsatilgan davrda jami olingan tovar:</span>
                <strong>{fmtMoney(periodOrdered, db?.currency)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Ko'rsatilgan davrda jami to'langan mablag':</span>
                <strong style={{ color: '#1F6E5C' }}>{fmtMoney(periodPaid, db?.currency)}</strong>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '2px solid #0E2419',
                fontSize: '15px'
              }}>
                <span><strong>Hozirgi kunda jami qoldiq qarz:</strong></span>
                <strong style={{ color: currentTotalDebt > 0 ? '#b33a2b' : '#1F6E5C' }}>
                  {fmtMoney(Math.abs(currentTotalDebt), db?.currency)} {currentTotalDebt > 0 ? `("${bizName}" qarzdor)` : '(Qarzdorlik yo\'q)'}
                </strong>
              </div>
            </div>

            {/* Signatures and Stamps */}
            <div className="invoice-signatures" style={{ marginTop: '50px' }}>
              <div style={{ width: '45%' }}>
                <div><strong>"{bizName}" nomidan:</strong></div>
                <div style={{ marginTop: '25px' }}>Imzo: _________________________</div>
                <div className="invoice-seal-box">M.O'. (Muhr o'rni)</div>
              </div>

              <div style={{ width: '45%' }}>
                <div><strong>"{supplier.name}" nomidan:</strong></div>
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
