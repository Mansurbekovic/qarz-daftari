import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, fmtDate, maskCardNumber, genCardNumber, futureExpiry, parseMoneyValue } from '../utils/helpers';
import { BANK_PRESETS, CARD_TYPES } from '../utils/constants';

const API_BASE = 'http://127.0.0.1:5000';

export default function Wallet() {
  const { db, totalCardBalance, addCard, deleteCard, toggleFreezeCard, updateCardStatus, addCardTx, updateDB } = useApp();
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
    if (chosenType === 'plastic') {
      const num = cardNum.replace(/\D/g, '');
      if (num.length < 4) {
        toast('Karta raqamini to\'liqroq kiriting', 'error');
        return;
      }
      addCard({
        bank: cardBank,
        type: 'plastic',
        holder,
        number: null,
        last4: num.slice(-4),
        expiry: cardExp.trim(),
        balance: 0,
        frozen: false,
        physicalStatus: 'delivered',
      });
    } else {
      const initBal = parseMoneyValue(cardInitBal) || 0;
      const number = genCardNumber(cardBank);
      addCard({
        bank: cardBank,
        type: chosenType,
        holder,
        number,
        last4: number.slice(-4),
        expiry: futureExpiry(),
        balance: initBal,
        frozen: false,
        physicalStatus: chosenType === 'virtual' ? null : 'delivered',
      });
    }
    setShowAddModal(false);
    toast("Karta qo'shildi");
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
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'To‘lovda xatolik');

      await fetch(`${API_BASE}/api/payments/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentId: result.id }),
      });

      addCardTx({ kind: 'online', cardId: opCard, amount, note: opMerchant.trim() || "Noma'lum xizmat" });
      setShowOnlinePay(false);
      setOpCardNumber('');
      setOpCardName('');
      setOpCardExp('');
      setOpCardCvv('');
      toast(`To'lov muvaffaqiyatli amalga oshirildi (${result.id})`);
    } catch (err) {
      toast(err.message || 'To‘lovda xatolik', 'error');
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

  return (
    <div>
      <div className="disclaimer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
        <div>
          Kartalar — shaxsiy hisob-kitobingiz uchun ichki vosita. Ular real bank tizimiga ulanmagan va haqiqiy pul ko'chirmasini amalga oshirmaydi; faqat qarz-to'lov yozuvlarini karta bo'yicha qulayroq yuritish uchun mo'ljallangan. Karta raqamlari faqat ilova ichida ko'rinadi.
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
            onClick={() => handleOpenTxModal('topup')}
            disabled={db.cards.length === 0}
          >
            + Pul solish
          </button>
          <button
            className="btn btn-outline"
            style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}
            onClick={() => handleOpenTxModal('withdraw')}
            disabled={db.cards.length === 0}
          >
            − Pul yechish
          </button>
          <button
            className="btn btn-gold"
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
        Virtual karta shu zahoti yaratiladi. Plastik yoki onlayn kartani esa mavjud (haqiqiy) kartangiz asosida qo'shasiz.
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
          Karta qo'shish
        </button>
      </div>

      <div className="section-title">Karta harakatlari</div>
      {ctx.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10M7 12h10M7 16h6" />
          </svg>
          <div className="t">Hali harakat yo'q</div>
          <div className="s">Pul solish, kartalar orasida o'tkazma yoki mijozga to'lov/qarz orqali tarix shu yerda ko'rinadi.</div>
        </div>
      ) : (
        <div className="ledger-card">
          {ctx.map(tx => {
            const card = db.cards.find(cd => cd.id === tx.cardId);
            const toCard = tx.toCardId ? db.cards.find(cd => cd.id === tx.toCardId) : null;
            const c = tx.clientId ? db.clients.find(cl => cl.id === tx.clientId) : null;
            let title, sign;

            if (tx.type === 'topup') {
              title = `Pul solindi → ${card ? `${card.bank} •${card.last4}` : ''}`;
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
                    Karta yaratish moliyaviy javobgarlikni anglatadi, shu sababli faqat 16 yoshdan katta foydalanuvchilar karta qo'sha oladi.
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
                  <h3>Karta qo'shish</h3>
                  <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
                </div>
                <div className="modal-body">
                  <div className="type-pick">
                    <button
                      type="button"
                      className={chosenType === 'virtual' ? 'active' : ''}
                      onClick={() => setChosenType('virtual')}
                    >
                      <span>✨</span>Virtual
                      <div className="small" style={{ fontSize: '10px', fontWeight: 500 }}>Shu zahoti yaratiladi</div>
                    </button>
                    <button
                      type="button"
                      className={chosenType === 'plastic' ? 'active' : ''}
                      onClick={() => setChosenType('plastic')}
                    >
                      <span>💳</span>Plastik
                      <div className="small" style={{ fontSize: '10px', fontWeight: 500 }}>Mavjud kartangiz</div>
                    </button>
                    <button
                      type="button"
                      className={chosenType === 'online' ? 'active' : ''}
                      onClick={() => setChosenType('online')}
                    >
                      <span>🌐</span>Onlayn
                      <div className="small" style={{ fontSize: '10px', fontWeight: 500 }}>Faqat internet uchun</div>
                    </button>
                  </div>

                  {chosenType === 'plastic' ? (
                    <>
                      <div className="form-field">
                        <label>Bank / tizim</label>
                        <select value={cardBank} onChange={e => setCardBank(e.target.value)}>
                          {Object.keys(BANK_PRESETS).map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <label>Karta egasi</label>
                        <input
                          type="text"
                          placeholder="F.I.SH."
                          value={cardHolder}
                          onChange={e => setCardHolder(e.target.value)}
                        />
                      </div>
                      <div className="form-field">
                        <label>Karta raqami</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={19}
                          placeholder="8600 0000 0000 0000"
                          value={cardNum}
                          onChange={e => setCardNum(e.target.value)}
                        />
                      </div>
                      <div className="form-field">
                        <label>Amal qilish muddati (ixtiyoriy)</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExp}
                          onChange={e => setCardExp(e.target.value)}
                        />
                      </div>
                      <div className="auth-hint" style={{ marginBottom: '10px' }}>
                        Xavfsizlik uchun faqat kartaning oxirgi 4 raqami saqlanadi, to'liq raqam hech qayerda saqlanmaydi.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-field">
                        <label>Bank / tizim</label>
                        <select value={cardBank} onChange={e => setCardBank(e.target.value)}>
                          {Object.keys(BANK_PRESETS).map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <label>Karta egasi</label>
                        <input
                          type="text"
                          placeholder="F.I.SH."
                          value={cardHolder}
                          onChange={e => setCardHolder(e.target.value)}
                        />
                      </div>
                      <div className="form-field">
                        <label>Boshlang'ich balans (ixtiyoriy)</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={cardInitBal}
                          onChange={e => setCardInitBal(e.target.value)}
                        />
                      </div>
                      <div className="auth-hint" style={{ marginBottom: '10px' }}>
                        {chosenType === 'virtual'
                          ? "Karta raqami avtomatik yaratiladi va istalgan vaqt jismoniy kartaga aylantirilishi mumkin."
                          : "Onlayn karta faqat ilova ichida onlayn to'lovlar uchun ishlatiladi."}
                      </div>
                    </>
                  )}

                  <div className="modal-actions">
                    <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Bekor qilish</button>
                    <button className="btn btn-gold" onClick={handleSaveCard}>Qo'shish</button>
                  </div>
                </div>
              </>
            )}
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
              {selectedCard.type === 'virtual' && (
                <div className="settings-row">
                  <div className="t">Jismoniy karta</div>
                  <div className="s">
                    {selectedCard.physicalStatus === 'ordered'
                      ? 'Buyurtma berilgan, yetkazilmoqda'
                      : selectedCard.physicalStatus === 'delivered'
                      ? 'Yetkazib berildi'
                      : 'Buyurtma berilmagan'}
                  </div>
                </div>
              )}

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

                {selectedCard.type === 'virtual' && selectedCard.physicalStatus !== 'ordered' && selectedCard.physicalStatus !== 'delivered' && (
                  <button
                    className="btn btn-teal btn-sm"
                    onClick={() => {
                      updateCardStatus(selectedCard.id, { physicalStatus: 'ordered' });
                      toast('Jismoniy kartaga buyurtma qabul qilindi');
                      setSelectedCardId(null);
                    }}
                  >
                    Jismoniy kartaga buyurtma berish
                  </button>
                )}

                {selectedCard.physicalStatus === 'ordered' && (
                  <button
                    className="btn btn-teal btn-sm"
                    onClick={() => {
                      updateCardStatus(selectedCard.id, { physicalStatus: 'delivered', type: 'plastic' });
                      toast('Karta endi plastik sifatida belgilandi');
                      setSelectedCardId(null);
                    }}
                  >
                    Yetib keldi deb belgilash
                  </button>
                )}
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
