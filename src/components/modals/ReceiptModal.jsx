import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { fmtMoney, fmtDate, generateReceiptNumber, telegramReceiptLink, whatsappReminderLink } from '../../utils/helpers';

export default function ReceiptModal({ client, transaction, onClose }) {
  const { db } = useApp();
  const toast = useToast();
  const [receiptNumber] = useState(transaction?.receiptNumber || generateReceiptNumber());
  const [format, setFormat] = useState('thermal'); // 'thermal' | 'standard'

  if (!client || !transaction) return null;

  const items = transaction.items || [];
  const totalBal = transaction.balanceAfter !== undefined ? transaction.balanceAfter : (transaction.type === 'debt' ? transaction.amount : 0);
  const card = db.cards && db.cards[0] ? `${db.cards[0].bank} ${db.cards[0].number ? db.cards[0].number.replace(/(.{4})/g, '$1 ') : '****' + db.cards[0].last4}` : '';

  const handlePrint = () => {
    window.print();
  };

  const handleSendTelegram = () => {
    const link = telegramReceiptLink(
      client.name,
      transaction.amount,
      db.currency,
      items,
      totalBal,
      db.businessName || 'Qarz Daftari',
      card
    );
    window.open(link, '_blank');
    toast('Telegram chek havolasi ochildi');
  };

  const handleSendWhatsApp = () => {
    if (!client.phone) {
      toast('Mijoz telefon raqami yo\'q', 'error');
      return;
    }
    const link = whatsappReminderLink(
      client.phone,
      client.name,
      transaction.amount,
      db.currency,
      db.businessName || 'Qarz Daftari'
    );
    window.open(link, '_blank');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${format === 'standard' ? 'wide' : ''}`} style={{ maxWidth: format === 'thermal' ? '380px' : '580px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head no-print">
          <h3>🧾 Xarid / Nasiya Cheki</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="no-print" style={{ padding: '0 22px 10px', display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${format === 'thermal' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setFormat('thermal')}
          >
            🧾 Termal chek (80mm)
          </button>
          <button
            className={`btn btn-sm ${format === 'standard' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setFormat('standard')}
          >
            📄 Standart Kvitansiya
          </button>
        </div>

        <div className="modal-body" style={{ paddingTop: 0 }}>
          {/* Printable Receipt Area */}
          <div className={`receipt-container ${format}`} id="printable-receipt">
            <div className="receipt-header">
              <div className="receipt-logo">QD</div>
              <div className="receipt-business-name">{db.businessName || 'SAVDO VA XIZMAT KO\'RSATISH'}</div>
              {db.phone && <div className="receipt-sub">Tel: {db.phone}</div>}
              {db.address && <div className="receipt-sub">Manzil: {db.address}</div>}
              <div className="receipt-divider" />
              <div className="receipt-title">
                {transaction.type === 'debt' ? 'NASIYA SAVDO CHEKI' : 'TO\'LOV QABUL KVITANSIYASI'}
              </div>
              <div className="receipt-row-meta">
                <span>Chek: <b>{receiptNumber}</b></span>
                <span>Sana: <b>{fmtDate(transaction.date)}</b></span>
              </div>
            </div>

            <div className="receipt-client-info">
              <div>Mijoz: <b>{client.name}</b></div>
              {client.phone && <div>Tel: {client.phone}</div>}
            </div>

            <div className="receipt-divider" />

            {/* Items Table */}
            {items && items.length > 0 ? (
              <div className="receipt-items-table">
                <div className="receipt-item-row header">
                  <span className="col-name">Mahsulot</span>
                  <span className="col-qty">Soni</span>
                  <span className="col-price">Narx</span>
                  <span className="col-total">Jami</span>
                </div>
                {items.map((it, idx) => (
                  <div key={idx} className="receipt-item-row">
                    <span className="col-name">{it.name}</span>
                    <span className="col-qty">{it.qty} {it.unit || 'dona'}</span>
                    <span className="col-price">{fmtMoney(it.price, '')}</span>
                    <span className="col-total">{fmtMoney(it.total, db.currency)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '8px 0', fontSize: '13px' }}>
                Izoh: {transaction.note || (transaction.type === 'debt' ? 'Nasiya mablag\'i' : 'Qarz to\'lovi')}
              </div>
            )}

            <div className="receipt-divider" />

            {/* Totals */}
            <div className="receipt-totals">
              <div className="receipt-total-row main">
                <span>{transaction.type === 'debt' ? 'Ushbu xarid summasi:' : 'Qabul qilingan to\'lov:'}</span>
                <span>{fmtMoney(transaction.amount, db.currency)}</span>
              </div>
              {transaction.dueDate && transaction.type === 'debt' && (
                <div className="receipt-total-row highlight">
                  <span>To'lov oxirgi muddati:</span>
                  <span>{fmtDate(transaction.dueDate)}</span>
                </div>
              )}
            </div>

            <div className="receipt-divider" />

            {/* Footer & QR Simulation */}
            <div className="receipt-footer">
              <div className="receipt-qr-box">
                <div className="receipt-qr-code">
                  <svg viewBox="0 0 100 100" width="64" height="64" fill="currentColor">
                    <rect x="0" y="0" width="30" height="30" />
                    <rect x="5" y="5" width="20" height="20" fill="#fff" />
                    <rect x="10" y="10" width="10" height="10" />
                    <rect x="70" y="0" width="30" height="30" />
                    <rect x="75" y="5" width="20" height="20" fill="#fff" />
                    <rect x="80" y="10" width="10" height="10" />
                    <rect x="0" y="70" width="30" height="30" />
                    <rect x="5" y="75" width="20" height="20" fill="#fff" />
                    <rect x="10" y="80" width="10" height="10" />
                    <rect x="40" y="10" width="15" height="10" />
                    <rect x="45" y="30" width="10" height="20" />
                    <rect x="65" y="45" width="20" height="10" />
                    <rect x="40" y="65" width="15" height="15" />
                    <rect x="70" y="70" width="20" height="20" />
                  </svg>
                </div>
                <div className="receipt-qr-text">
                  Hisobingizni tekshirish uchun skanerlang
                </div>
              </div>
              <div className="receipt-thankyou">
                Xaridingiz uchun rahmat!
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions no-print" style={{ marginTop: '16px', flexWrap: 'wrap' }}>
            <button className="btn btn-gold" onClick={handlePrint}>
              🖨️ Chop etish / PDF
            </button>
            <button className="btn btn-teal" onClick={handleSendTelegram}>
              ✈️ Telegram Chek
            </button>
            {client.phone && (
              <button className="btn btn-outline" onClick={handleSendWhatsApp}>
                💬 WhatsApp
              </button>
            )}
            <button className="btn btn-outline" onClick={onClose}>
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
