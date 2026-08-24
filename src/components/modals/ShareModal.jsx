import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { fmtMoney, generatePaymentLink } from '../../utils/helpers';

export default function ShareModal({ client, balance = 0, onClose }) {
  const { db } = useApp();
  const { toast } = useToast();

  const [customAmount, setCustomAmount] = useState(balance > 0 ? balance : 0);
  const [selectedCard, setSelectedCard] = useState(() => (db.cards && db.cards[0]?.number) || '');
  const [customMsg, setCustomMsg] = useState('');

  const bizName = db?.businessName || 'Qarz Daftari';
  const bizPhone = db?.phone || '';
  const currentCard = (db.cards || []).find(c => c.number === selectedCard) || (db.cards && db.cards[0]);

  // Default reminder text
  const defaultText = `Assalomu alaykum, ${client?.name || 'Hurmatli mijoz'}!\n` +
    `Sizning "${bizName}" oldidagi qarz balansingiz: ${fmtMoney(customAmount, db?.currency)}.\n` +
    (currentCard ? `Plastik karta orqali to'lash uchun karta: ${currentCard.number} (${currentCard.bank || 'Karta'})\n` : '') +
    (bizPhone ? `Bog'lanish uchun: ${bizPhone}\n` : '') +
    `Iltimos, to'lovni o'z vaqtida amalga oshirishingizni so'raymiz. Rahmat!`;

  const messageToSend = customMsg || defaultText;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageToSend);
    toast('Eslatma matni nusxalandi');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(bizName)}&text=${encodeURIComponent(messageToSend)}`;
    window.open(url, '_blank');
  };

  const handleWhatsApp = () => {
    const cleanPhone = (client?.phone || '').replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageToSend)}`;
    window.open(url, '_blank');
  };

  const handleSMS = () => {
    const cleanPhone = (client?.phone || '').replace(/\D/g, '');
    const url = `sms:${cleanPhone}?body=${encodeURIComponent(messageToSend)}`;
    window.location.href = url;
  };

  const handlePaymeLink = () => {
    if (!currentCard) {
      toast('Avval Kartalar bo\'limida karta qo\'shing', 'warning');
      return;
    }
    const paymeUrl = generatePaymentLink('payme', currentCard.number, customAmount, `${client?.name} qarz to'lovi`);
    window.open(paymeUrl, '_blank');
  };

  const handleClickLink = () => {
    if (!currentCard) {
      toast('Avval Kartalar bo\'limida karta qo\'shing', 'warning');
      return;
    }
    const clickUrl = generatePaymentLink('click', currentCard.number, customAmount, `${client?.name} qarz to'lovi`);
    window.open(clickUrl, '_blank');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal share-modal" style={{ maxWidth: '600px', width: '95%' }}>
        <div className="modal-head">
          <h3>📲 Eslatma va To'lov Havolasi</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Amount and Card selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="field-label">Eslatiladigan summa ({db?.currency})</label>
              <input
                type="number"
                className="input"
                value={customAmount}
                onChange={e => setCustomAmount(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="field-label">To'lov qabul qiluvchi karta</label>
              <select
                className="input"
                value={selectedCard}
                onChange={e => setSelectedCard(e.target.value)}
              >
                {(db.cards || []).length === 0 ? (
                  <option value="">Karta mavjud emas</option>
                ) : (
                  db.cards.map(c => (
                    <option key={c.id} value={c.number}>
                      {c.bank} — **** {c.number?.slice(-4)} ({fmtMoney(c.balance, db?.currency)})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Quick Channels Grid */}
          <div>
            <label className="field-label">Yuborish kanali</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ background: '#229ED9', color: '#fff', border: 'none', padding: '12px', fontWeight: 600 }}
                onClick={handleTelegram}
              >
                ✈️ Telegram
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ background: '#25D366', color: '#fff', border: 'none', padding: '12px', fontWeight: 600 }}
                onClick={handleWhatsApp}
              >
                💬 WhatsApp
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ background: '#FF9800', color: '#fff', border: 'none', padding: '12px', fontWeight: 600 }}
                onClick={handleSMS}
              >
                ✉️ SMS
              </button>
            </div>
          </div>

          {/* Direct Payment Links (Click / Payme) */}
          <div>
            <label className="field-label">Mijoz uchun to'g'ridan-to'g'ri to'lov havolasi</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ background: '#00CCCC', color: '#000', border: 'none', padding: '10px', fontWeight: 700 }}
                onClick={handlePaymeLink}
              >
                💎 Payme orqali to'lash
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ background: '#00B5E2', color: '#fff', border: 'none', padding: '10px', fontWeight: 700 }}
                onClick={handleClickLink}
              >
                🔵 Click orqali to'lash
              </button>
            </div>
          </div>

          {/* Message Preview and Edit */}
          <div>
            <label className="field-label">Xabar matni (tahrirlash mumkin)</label>
            <textarea
              className="input"
              rows={6}
              value={messageToSend}
              onChange={e => setCustomMsg(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}
            />
          </div>

          <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-outline" onClick={handleCopy}>
              📋 Matndan nusxa olish
            </button>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
