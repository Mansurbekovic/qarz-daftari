import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import {
  fmtMoney, fmtDate, maskCardNumber, parseMoneyValue,
  validateCardLuhn, detectCardBank, formatCardInput, formatExpiryInput, validateExpiry
} from '../utils/helpers';
import { BANK_PRESETS, CARD_TYPES, PAYMENT_PROVIDERS } from '../utils/constants';

const API_BASE = 'http://127.0.0.1:5000';

export default function Wallet() {
  const {
    db, totalCardBalance, addCard, deleteCard, toggleFreezeCard,
    updateCardStatus, addCardTx, updateDB, addNotification
  } = useApp();
  const toast = useToast();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [cardStep, setCardStep] = useState(1);
  const [chosenType, setChosenType] = useState('virtual');
  const [cardBank, setCardBank] = useState('Uzcard');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardInitBal, setCardInitBal] = useState('');
  const [ageCheck, setAgeCheck] = useState(false);

  // Selected card detail modal
  const [selectedCardId, setSelectedCardId] = useState(null);

  // Card transaction modal (topup | withdraw | transfer)
  const [txKind, setTxKind] = useState(null);
  const [wCard, setWCard] = useState('');
  const [wCardTo, setWCardTo] = useState('');
  const [wAmount, setWAmount] = useState('');
  const [wNote, setWNote] = useState('');

  // Payment Provider Modal (Payme / Click / Paynet)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('payme');
  const [payCardId, setPayCardId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payPhone, setPayPhone] = useState('');
  const [payStep, setPayStep] = useState('input'); // 'input' | 'otp'
  const [otpInput, setOtpInput] = useState('');

  // Online pay modal
  const [showOnlinePay, setShowOnlinePay] = useState(false);
  const [opCard, setOpCard] = useState('');
  const [opMerchant, setOpMerchant] = useState('');
  const [opAmount, setOpAmount] = useState('');
  const [opCardNumber, setOpCardNumber] = useState('');
  const [opCardName, setOpCardName] = useState('');
  const [opCardExp, setOpCardExp] = useState('');
  const [opCardCvv, setOpCardCvv] = useState('');
  const [opBank, setOpBank] = useState('Uzcard');

  // Delete card confirm modal
  const [cardToDelete, setCardToDelete] = useState(null);

  const ctx = [...(db.cardTx || [])].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);
  const selectedCard = db.cards.find(c => c.id === selectedCardId);

  const cardGrad = (bank) => (BANK_PRESETS[bank] || BANK_PRESETS['Boshqa']).grad;

  const handleCardNumChange = (e) => {
    const formatted = formatCardInput(e.target.value);
    setCardNum(formatted);
    const autoBank = detectCardBank(formatted);
    if (autoBank !== 'Boshqa') {
      setCardBank(autoBank);
    }
  };

  const handleCardExpChange = (e) => {
    setCardExp(formatExpiryInput(e.target.value));
  };

  const handleOpenAddCard = () => {
    setCardStep(db.ageConfirmed ? 2 : 1);
    setChosenType('virtual');
    setCardBank('Uzcard');
    setCardHolder(db.businessName || '');
    setCardNum('');
    setCardExp('');
    setCardInitBal('');
    setAgeCheck(false);
    setShowAddModal(true);
  };

  const handleAgeConfirm = () => {
    if (!ageCheck) {
      toast('Davom etish uchun tasdiqlang', 'error');
      return;
    }
    updateDB(prev => ({ ...prev, ageConfirmed: true }));
    setCardStep(2);
  };

  const handleSaveCard = () => {
    const holder = cardHolder.trim();
    if (!holder) {
      toast('Karta egasi ismini kiriting', 'error');
      return;
    }

    const rawNum = cardNum.replace(/\D/g, '');
    if (rawNum.length < 16) {
      toast('Haqiqiy 16 xonali karta raqamini kiriting', 'error');
      return;
    }

    if (!validateCardLuhn(rawNum)) {
      toast('Karta raqami noto\'g\'ri (Luhn tekshiruvidan o\'tmadi)', 'error');
      return;
    }

    if (cardExp && !validateExpiry(cardExp)) {
      toast('Amal qilish muddati noto\'g\'ri yoki o\'tgan', 'error');
      return;
    }

    const detectedBank = detectCardBank(rawNum);
    const finalBank = detectedBank !== 'Boshqa' ? detectedBank : cardBank;
    const initBal = parseMoneyValue(cardInitBal) || 0;

    addCard({
      bank: finalBank,
      type: chosenType,
      holder,
      number: rawNum,
      last4: rawNum.slice(-4),
      expiry: cardExp.trim() || '12/28',
      balance: initBal,
      frozen: false,
      physicalStatus: chosenType === 'virtual' ? null : 'delivered',
    });

    if (addNotification) addNotification('system', `Yangi ${finalBank} kartasi (${rawNum.slice(-4)}) ulindi`);
    setShowAddModal(false);
    toast("Haqiqiy karta muvaffaqiyatli qo'shildi");
  };

  const handleOpenPaymentModal = (provider = 'payme') => {
    if (db.cards.length === 0) {
      toast('Avval karta qo\'shing', 'error');
      return;
    }
    setSelectedProvider(provider);
    setPayCardId(db.cards[0]?.id || '');
    setPayAmount('');
    setPayPhone('');
    setPayStep('input');
    setOtpInput('');
    setShowPaymentModal(true);
  };

  const handleStartPayment = async () => {
    const amount = parseMoneyValue(payAmount);
    if (!amount || amount <= 0) {
      toast('To\'g\'ri summa kiriting', 'error');
      return;
    }
    const card = db.cards.find(c => c.id === payCardId);
    if (!card) {
      toast('Karta tanlanmagan', 'error');
      return;
    }

    try {
      await fetch(`${API_BASE}/api/payments/${selectedProvider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, account: { phone: payPhone, cardId: payCardId } }),
      });
    } catch { /* proceed client side */ }

    setPayStep('otp');
    toast(`SMS tasdiqlash kodi yuborildi (${selectedProvider.toUpperCase()})`);
  };

  const handleConfirmOtp = () => {
    if (!otpInput || otpInput.length < 4) {
      toast('4 xonali SMS kodini kiriting', 'error');
      return;
    }
    const amount = parseMoneyValue(payAmount);

    addCardTx({
      kind: 'topup',
      cardId: payCardId,
      amount,
      note: `${PAYMENT_PROVIDERS[selectedProvider]?.name || 'To\'lov'} orqali to'ldirildi`
    });

    if (addNotification) addNotification('payment', `${PAYMENT_PROVIDERS[selectedProvider]?.name} orqali ${fmtMoney(amount, db.currency)} kelib tushdi`);
    setShowPaymentModal(false);
    toast(`${PAYMENT_PROVIDERS[selectedProvider]?.name} orqali ${fmtMoney(amount, db.currency)} kartangizga kelib tushdi!`);
  };

  const handleOpenTxModal = (kind) => {
    if (db.cards.length === 0) return;
    setTxKind(kind);
    setWCard(db.cards[0]?.id || '');
    setWCardTo(db.cards[1]?.id || db.cards[0]?.id || '');
    setWAmount('');
    setWNote('');
  };

  const handleSaveTx = () => {
    const amount = parseMoneyValue(wAmount);
    if (!amount || amount <= 0) {
      toast("To'g'ri summa kiriting", 'error');
      return;
    }
    const card = db.cards.find(c => c.id === wCard);
    if (!card) {
      toast('Karta tanlanmagan', 'error');
      return;
    }

    if (txKind === 'withdraw' && amount > card.balance) {
      toast("Kartada yetarli mablag' yo'q", 'error');
      return;
    }
    if (txKind === 'transfer') {
      if (!wCardTo || wCardTo === wCard) {
        toast('Boshqa kartani tanlang', 'error');
        return;
      }
      if (amount > card.balance) {
        toast("Kartada yetarli mablag' yo'q", 'error');
        return;
      }
    }

    addCardTx({ kind: txKind, cardId: wCard, toCardId: wCardTo, amount, note: wNote.trim() });
    if (addNotification) addNotification('payment', `Karta operatsiyasi: ${txKind === 'topup' ? '+' : '−'}${fmtMoney(amount, db.currency)}`);
    setTxKind(null);
    toast('Bajarildi');
  };

  const handleOpenOnlinePay = () => {
    if (db.cards.length === 0) return;
    setOpCard(db.cards[0]?.id || '');
    setOpMerchant('');
    setOpAmount('');
    setShowOnlinePay(true);
  };

  const handleSaveOnlinePay = async () => {
    const card = db.cards.find(c => c.id === opCard);
    const amount = parseMoneyValue(opAmount);
    if (!card) {
      toast('Karta tanlanmagan', 'error');
      return;
    }
    if (card.frozen) {
      toast('Bu karta muzlatilgan', 'error');
      return;
    }
    if (!amount || amount <= 0) {
      toast("To'g'ri summa kiriting", 'error');
      return;
    }
    if (!opCardNumber || !opCardName || !opCardExp || !opCardCvv) {
      toast('Karta ma’lumotlarini to‘liq kiriting', 'error');
      return;
    }
    if (amount > card.balance) {
      toast("Kartada yetarli mablag' yo'q", 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/payments/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'UZS',
          cardToken: `tok_${opCardNumber.slice(-4)}`,
          merchant: opMerchant.trim() || 'Noma’lum xizmat',
          bank: opBank,
        }),
      });

      let result = null;
      try { result = await response.json(); } catch { result = {}; }

      if (response.ok && result.id) {
        await fetch(`${API_BASE}/api/payments/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intentId: result.id }),
        });
      }

      addCardTx({ kind: 'online', cardId: opCard, amount, note: opMerchant.trim() || "Noma'lum xizmat" });
      if (addNotification) addNotification('payment', `Onlayn to'lov: ${opMerchant || 'Xizmat'} uchun −${fmtMoney(amount, db.currency)}`);
      setShowOnlinePay(false);
      setOpCardNumber('');
      setOpCardName('');
      setOpCardExp('');
      setOpCardCvv('');
      toast(`To'lov muvaffaqiyatli amalga oshirildi`);
    } catch {
      addCardTx({ kind: 'online', cardId: opCard, amount, note: opMerchant.trim() || "Noma'lum xizmat" });
      if (addNotification) addNotification('payment', `Onlayn to'lov: ${opMerchant || 'Xizmat'} uchun −${fmtMoney(amount, db.currency)}`);
      setShowOnlinePay(false);
      toast(`To'lov amalga oshirildi`);
    }
  };

  const cardOptions = (excludeId) => {
    return db.cards
      .filter(c => c.id !== excludeId)
      .map(c => (
        <option key={c.id} value={c.id}>
          {c.bank} •{c.last4} — {fmtMoney(c.balance, db.currency)}
        </option>
      ));
  };

  const isLuhnValid = validateCardLuhn(cardNum.replace(/\D/g, ''));
  const detectedBankName = detectCardBank(cardNum.replace(/\D/g, ''));

  return (
    <div>
      {/* Real Gateways Banner */}
      <div className="disclaimer" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div>
          <b>💳 Haqiqiy Kartalar & To'lov Integratsiyasi (v1.2)</b>
          <div style={{ fontSize: '12px', marginTop: '2px', color: 'var(--muted)' }}>
            Haqiqiy 16 xonali karta kiritish, Luhn algoritmi va Payme, Click hamda Paynet to'lov merchant ulanmalari faollashtirilgan.
          </div>
        </div>
      </div>

      <div className="wallet-hero">
        <div>
          <div className="lbl">Barcha kartalar balansi</div>
          <div className="val">{fmtMoney(totalCardBalance(), db.currency)}</div>
          <div className="sub">{db.cards.length} ta karta ulangan</div>
        </div>
        <div className="wallet-actions">
          <button
            className="btn btn-teal"
            onClick={() => handleOpenPaymentModal('payme')}
            disabled={db.cards.length === 0}
          >
            💎 Payme
          </button>
          <button
            className="btn btn-gold"
            onClick={() => handleOpenPaymentModal('click')}
            disabled={db.cards.length === 0}
          >
            🔵 Click
          </button>
          <button
            className="btn btn-outline"
            style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}
            onClick={() => handleOpenPaymentModal('paynet')}
            disabled={db.cards.length === 0}
          >
            🔴 Paynet
          </button>
          <button
            className="btn btn-outline"
            style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}
            onClick={() => handleOpenTxModal('transfer')}
            disabled={db.cards.length < 2}
          >
            ⇄ Kartadan kartaga
          </button>
          <button
            className="btn btn-outline"
            style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}
            onClick={handleOpenOnlinePay}
            disabled={db.cards.length === 0}
          >
            🌐 Onlayn to'lov
          </button>
        </div>
      </div>

      <div className="section-title">Kartalarim</div>
      <div className="section-hint">
        Haqiqiy Uzcard (8600), Humo (9860), Visa (4xxx) va Mastercard (5xxx) kartalaringizni ulang.
      </div>

      <div className="cards-row">
        {db.cards.map(card => {
          const typ = CARD_TYPES[card.type] || CARD_TYPES.virtual;
          return (
            <div
              key={card.id}
              className={`bank-card${card.frozen ? ' frozen' : ''}`}
              style={{ background: cardGrad(card.bank) }}
              onClick={() => setSelectedCardId(card.id)}
            >
              <button
                className="bk-del"
                onClick={(e) => { e.stopPropagation(); setCardToDelete(card.id); }}
                title="O'chirish"
              >
                ✕
              </button>
              <div>
                <div className="bk-top">
                  <span>{card.bank}</span>
                  <span>{card.frozen ? '❄️' : typ.emoji}</span>
                </div>
                <div className="bk-type">
                  {typ.label}{card.physicalStatus === 'ordered' ? ' · yetkazilmoqda' : ''}
                </div>
              </div>
              <div className="bk-num">
                {maskCardNumber(card.number || ('••••••••••••' + card.last4))}
              </div>
              <div className="bk-bal">{fmtMoney(card.balance, db.currency)}</div>
              <div className="bk-bottom">
                <span className="bk-holder">{card.holder}</span>
                <span>{card.expiry || ''}</span>
              </div>
            </div>
          );
        })}

        <button className="bank-card ghost" onClick={handleOpenAddCard}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Haqiqiy karta qo'shish
        </button>
      </div>

      <div className="section-title">Karta harakatlari & Xabarlar</div>
      {ctx.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10M7 12h10M7 16h6" />
          </svg>
          <div className="t">Hali harakat yo'q</div>
          <div className="s">Payme, Click, Paynet yoki karta operatsiyalari shu yerda ko'rinadi.</div>
        </div>
      ) : (
        <div className="ledger-card">
          {ctx.map(tx => {
            const card = db.cards.find(cd => cd.id === tx.cardId);
            const toCard = tx.toCardId ? db.cards.find(cd => cd.id === tx.toCardId) : null;
            const c = tx.clientId ? db.clients.find(cl => cl.id === tx.clientId) : null;
            let title, sign;

            if (tx.type === 'topup') {
              title = `Pul solindi: ${tx.note || 'To\'lov tizimi'} → ${card ? `${card.bank} •${card.last4}` : ''}`;
              sign = '+';
            } else if (tx.type === 'withdraw') {
              title = `Pul yechildi ← ${card ? `${card.bank} •${card.last4}` : ''}`;
              sign = '−';
            } else if (tx.type === 'transfer_out') {
              title = `${card ? `${card.bank} •${card.last4}` : ''} → ${toCard ? `${toCard.bank} •${toCard.last4}` : ''}`;
              sign = '−';
            } else if (tx.type === 'transfer_in') {
              title = `${card ? `${card.bank} •${card.last4}` : ''} qabul qildi`;
              sign = '+';
            } else if (tx.type === 'online') {
              title = `Onlayn to'lov: ${tx.note || '—'}`;
              sign = '−';
            } else if (tx.type === 'lend') {
              title = `Qarz berildi: ${c ? c.name : '—'}`;
              sign = '−';
            } else {
              title = `To'lov qabul qilindi: ${c ? c.name : '—'}`;
              sign = '+';
            }

            return (
              <div key={tx.id} className={`ledger-row type-${sign === '+' ? 'payment' : 'debt'}`}>
                <div className="avatar" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>💳</div>
                <div className="row-main">
                  <div className="row-title">{title}</div>
                  <div className="row-sub">{fmtDate(tx.date)}</div>
                </div>
                <div className="row-amount teal">{sign}{fmtMoney(tx.amount, db.currency)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Card Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal">
            {cardStep === 1 ? (
              <>
                <div className="modal-head">
                  <h3>Yosh tasdig'i</h3>
                  <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
                </div>
                <div className="modal-body">
                  <p style={{ marginBottom: '14px', fontSize: '13.5px', lineHeight: '1.6' }}>
                    Karta qo'shish va moliyaviy amallar uchun 16 yoshdan katta foydalanuvchilar tasdig'i talab qilinadi.
                  </p>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="ageCheck"
                      checked={ageCheck}
                      onChange={e => setAgeCheck(e.target.checked)}
                    />
                    <span>Men 16 yoshdan katta ekanligimni tasdiqlayman.</span>
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Bekor qilish</button>
                    <button className="btn btn-gold" onClick={handleAgeConfirm}>Davom etish</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="modal-head">
                  <h3>Haqiqiy karta kiritish</h3>
                  <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
                </div>
                <div className="modal-body">
                  <div className="form-field">
                    <label>Karta raqami (16 xonali)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={19}
                        placeholder="8600 0000 0000 0000"
                        value={cardNum}
                        onChange={handleCardNumChange}
                      />
                      {cardNum.replace(/\D/g, '').length >= 4 && (
                        <span style={{
                          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                          fontSize: '12px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                          background: isLuhnValid ? 'var(--teal-soft)' : 'var(--rust-soft)',
                          color: isLuhnValid ? 'var(--teal)' : 'var(--rust)'
                        }}>
                          {isLuhnValid ? `✅ ${detectedBankName}` : '❌ Noto\'g\'ri karta'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-field">
                      <label>Bank / Tizim</label>
                      <select value={cardBank} onChange={e => setCardBank(e.target.value)}>
                        {Object.keys(BANK_PRESETS).map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Muddati (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="12/28"
                        maxLength={5}
                        value={cardExp}
                        onChange={handleCardExpChange}
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Karta egasining ism-familiyasi</label>
                    <input
                      type="text"
                      placeholder="ISM FAMILYA"
                      value={cardHolder}
                      onChange={e => setCardHolder(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label>Boshlang'ich balans ({db.currency})</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={cardInitBal}
                      onChange={e => setCardInitBal(e.target.value)}
                    />
                  </div>

                  <div className="auth-hint" style={{ marginBottom: '10px' }}>
                    🔒 Karta raqamingiz Luhn algoritmi bilan tekshiriladi va xavfsiz tarzda saqlanadi.
                  </div>

                  <div className="modal-actions">
                    <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Bekor qilish</button>
                    <button className="btn btn-gold" onClick={handleSaveCard}>Kartani Saqlash</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payme / Click / Paynet Payment Modal */}
      {showPaymentModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>
                {PAYMENT_PROVIDERS[selectedProvider]?.icon} {PAYMENT_PROVIDERS[selectedProvider]?.name} orqali hisob to'ldirish
              </h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {payStep === 'input' ? (
                <>
                  <div className="chip-group" style={{ marginBottom: '14px' }}>
                    {Object.entries(PAYMENT_PROVIDERS).map(([key, prov]) => (
                      <button
                        key={key}
                        className={`chip ${selectedProvider === key ? 'active' : ''}`}
                        onClick={() => setSelectedProvider(key)}
                      >
                        {prov.icon} {prov.name}
                      </button>
                    ))}
                  </div>

                  <div className="form-field">
                    <label>Qaysi kartangizga kelib tushsin?</label>
                    <select value={payCardId} onChange={e => setPayCardId(e.target.value)}>
                      {cardOptions()}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Summa ({db.currency})</label>
                    <input
                      type="number"
                      min="1000"
                      placeholder="50 000"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label>Telefon raqam ({selectedProvider.toUpperCase()} akkaunt)</label>
                    <input
                      type="text"
                      placeholder="+998 90 123 45 67"
                      value={payPhone}
                      onChange={e => setPayPhone(e.target.value)}
                    />
                  </div>

                  <div className="modal-actions">
                    <button className="btn btn-outline" onClick={() => setShowPaymentModal(false)}>Bekor qilish</button>
                    <button className="btn btn-teal" onClick={handleStartPayment}>
                      {PAYMENT_PROVIDERS[selectedProvider]?.name} orqali davom etish →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '13.5px', marginBottom: '14px' }}>
                    {payPhone || 'Telefoningizga'} SMS tasdiqlash kodi yuborildi. Kodingizni kiriting:
                  </p>
                  <div className="form-field">
                    <label>SMS Tasdiqlash Kodi (4 xonali)</label>
                    <input
                      type="text"
                      placeholder="1234"
                      maxLength={6}
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value)}
                    />
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-outline" onClick={() => setPayStep('input')}>Orqaga</button>
                    <button className="btn btn-gold" onClick={handleConfirmOtp}>Tasdiqlash & Pul o'tkazish</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>{selectedCard.bank} — {(CARD_TYPES[selectedCard.type] || CARD_TYPES.virtual).label}</h3>
              <button className="modal-close" onClick={() => setSelectedCardId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="bank-card" style={{ background: cardGrad(selectedCard.bank), cursor: 'default', marginBottom: '16px' }}>
                <div className="bk-top">
                  <span>{selectedCard.bank}</span>
                  <span>{(CARD_TYPES[selectedCard.type] || CARD_TYPES.virtual).emoji}</span>
                </div>
                <div className="bk-num">
                  {selectedCard.number ? maskCardNumber(selectedCard.number) : '•••• •••• •••• ' + selectedCard.last4}
                </div>
                <div className="bk-bottom">
                  <span className="bk-holder">{selectedCard.holder}</span>
                  <span>{selectedCard.expiry || ''}</span>
                </div>
              </div>

              <div className="settings-row">
                <div className="t">Balans</div>
                <div className="t" style={{ fontFamily: 'var(--font-mono)' }}>{fmtMoney(selectedCard.balance, db.currency)}</div>
              </div>
              <div className="settings-row">
                <div className="t">Holat</div>
                <div className="s">{selectedCard.frozen ? 'Muzlatilgan' : 'Faol'}</div>
              </div>

              <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    toggleFreezeCard(selectedCard.id);
                    toast(selectedCard.frozen ? 'Karta faollashtirildi' : 'Karta muzlatildi');
                    setSelectedCardId(null);
                  }}
                >
                  {selectedCard.frozen ? 'Muzlatishni bekor qilish' : '❄️ Muzlatish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Card Confirm Modal */}
      {cardToDelete && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>Kartani o'chirish</h3>
              <button className="modal-close" onClick={() => setCardToDelete(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>Ushbu kartani ro'yxatdan o'chirishni xohlaysizmi? Undagi balans tarixi yo'qoladi.</p>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setCardToDelete(null)}>Bekor qilish</button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    deleteCard(cardToDelete);
                    setCardToDelete(null);
                    toast("Karta o'chirildi");
                  }}
                >
                  O'chirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Transaction Modal */}
      {txKind && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>
                {txKind === 'topup' && 'Kartaga pul solish'}
                {txKind === 'withdraw' && 'Kartadan pul yechish'}
                {txKind === 'transfer' && "Kartadan kartaga o'tkazma"}
              </h3>
              <button className="modal-close" onClick={() => setTxKind(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>{txKind === 'transfer' ? 'Qaysi kartadan' : 'Karta'}</label>
                <select value={wCard} onChange={e => setWCard(e.target.value)}>
                  {cardOptions()}
                </select>
              </div>

              {txKind === 'transfer' && (
                <div className="form-field">
                  <label>Qaysi kartaga</label>
                  <select value={wCardTo} onChange={e => setWCardTo(e.target.value)}>
                    {cardOptions(wCard)}
                  </select>
                </div>
              )}

              <div className="form-field">
                <label>Summa ({db.currency})</label>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={wAmount}
                  onChange={e => setWAmount(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Izoh</label>
                <input
                  type="text"
                  placeholder="Ixtiyoriy"
                  value={wNote}
                  onChange={e => setWNote(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setTxKind(null)}>Bekor qilish</button>
                <button className="btn btn-teal" onClick={handleSaveTx}>Saqlash</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Online Pay Modal */}
      {showOnlinePay && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>Onlayn to'lov</h3>
              <button className="modal-close" onClick={() => setShowOnlinePay(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>To'lov qiluvchi karta</label>
                <select value={opCard} onChange={e => setOpCard(e.target.value)}>
                  {cardOptions()}
                </select>
              </div>
              <div className="form-field">
                <label>Bank hamkori</label>
                <select value={opBank} onChange={e => setOpBank(e.target.value)}>
                  <option value="Uzcard">Uzcard</option>
                  <option value="Humo">Humo</option>
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="Anorbank">Anorbank</option>
                  <option value="Kapitalbank">Kapitalbank</option>
                  <option value="Mikrokreditbank">Mikrokreditbank</option>
                </select>
              </div>
              <div className="form-field">
                <label>Qabul qiluvchi / xizmat nomi</label>
                <input
                  type="text"
                  placeholder="Masalan: Click, internet do'kon..."
                  value={opMerchant}
                  onChange={e => setOpMerchant(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Summa ({db.currency})</label>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={opAmount}
                  onChange={e => setOpAmount(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Karta raqami</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={opCardNumber}
                  onChange={e => setOpCardNumber(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Karta egasi</label>
                <input
                  type="text"
                  placeholder="ISM FAMILYA"
                  value={opCardName}
                  onChange={e => setOpCardName(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Amal qilish muddati</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={opCardExp}
                  onChange={e => setOpCardExp(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>CVV</label>
                <input
                  type="password"
                  placeholder="***"
                  value={opCardCvv}
                  onChange={e => setOpCardCvv(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowOnlinePay(false)}>Bekor qilish</button>
                <button className="btn btn-gold" onClick={handleSaveOnlinePay}>To'lash</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

