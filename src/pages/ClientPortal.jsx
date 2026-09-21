import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, fmtDate, initials } from '../utils/helpers';

export default function ClientPortal() {
  const { db, clientBalance, clientTransactions, navigate, updateDB } = useApp();
  const toast = useToast();

  const clients = db?.clients || [];
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [payAmount, setPayAmount] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);

  // Client Debt Request State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqAmount, setReqAmount] = useState('');
  const [reqPurpose, setReqPurpose] = useState('');
  const [reqDueDate, setReqDueDate] = useState('');

  const client = clients.find(c => c.id === selectedClientId) || clients[0];
  const bal = client ? clientBalance(client.id) : 0;
  const txs = client ? clientTransactions(client.id) : [];
  const currency = db?.currency || "so'm";
  const bizName = db?.businessName || 'Do\'kon / Savdo markazi';

  const handleSubmitDebtRequest = (e) => {
    e.preventDefault();
    const num = parseFloat(reqAmount);
    if (!num || num <= 0) {
      toast('To\'g\'ri summa kiriting', 'error');
      return;
    }
    const newReq = {
      id: 'req_' + Date.now(),
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone || '',
      amount: num,
      purpose: reqPurpose.trim() || 'Portal orqali nasiya so\'rovi',
      dueDate: reqDueDate || null,
      notes: 'Mijoz o\'z portali orqali ariza qoldirdi',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    updateDB(prev => ({
      ...prev,
      debtRequests: [newReq, ...(prev.debtRequests || [])]
    }));
    toast('Nasiya / Qarz so\'rovingiz do\'konga yuborildi! Tez orada ko\'rib chiqiladi.');
    setShowRequestModal(false);
    setReqAmount('');
    setReqPurpose('');
    setReqDueDate('');
  };

  const handleCopyPortalLink = () => {
    const url = `${window.location.origin}/#portal-${client?.id || ''}`;
    navigator.clipboard.writeText(url);
    toast('Mijoz uchun shaxsiy havola nusxalandi! Ushbu havolani mijozga SMS/Telegram orqali yuboring.');
  };

  const handlePayClick = (provider) => {
    toast(`"${provider.toUpperCase()}" to'lov tizimiga yo'naltirilmoqda...`);
    setShowPayModal(false);
  };

  return (
    <div>
      {/* Simulation Bar */}
      <div style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>👁️</span>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            Mijoz ko'rinishi simulyatsiyasi (Mijoz o'z telefonida aynan shuni ko'radi):
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12.5px' }}
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({fmtMoney(clientBalance(c.id), currency)})
              </option>
            ))}
          </select>
          <button className="btn btn-sm btn-gold" onClick={handleCopyPortalLink}>
            🔗 Mijoz havolasini nusxalash
          </button>
        </div>
      </div>

      {/* Mobile-Friendly Client Portal Interface */}
      <div style={{
        maxWidth: '480px',
        margin: '0 auto',
        background: 'var(--surface)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.12)'
      }}>
        {/* Brand Header */}
        <div style={{
          background: 'linear-gradient(135deg, #173A28, #0E2419)',
          color: '#fff',
          padding: '24px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'var(--gold)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 900,
            marginBottom: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
          }}>
            QD
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>{bizName}</h2>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
            Mijoz Shaxsiy Qarz & To'lov Portali
          </div>
        </div>

        {/* Client Greeting & Balance */}
        <div style={{ padding: '24px 20px' }}>
          {client ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '16px' }}>
                  {initials(client.name)}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>{client.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{client.phone || 'Telefon biriktirilgan'}</div>
                </div>
              </div>

              <div style={{
                background: bal > 0 ? 'rgba(139, 58, 43, 0.08)' : 'rgba(31, 110, 92, 0.08)',
                border: bal > 0 ? '1px solid rgba(139, 58, 43, 0.25)' : '1px solid rgba(31, 110, 92, 0.25)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {bal > 0 ? 'Sizdagi joriy qarzdorlik' : 'Qarzdorlik mavjud emas'}
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: bal > 0 ? 'var(--rust)' : 'var(--teal)', margin: '8px 0' }}>
                  {fmtMoney(bal, currency)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {bal > 0 ? 'Iltimos, to\'lovni o\'z vaqtida amalga oshiring' : 'Hisobingizda qarz yo\'q, xaridingiz uchun rahmat!'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {bal > 0 && (
                  <button
                    className="btn btn-gold"
                    style={{ flex: 1, minWidth: '150px', padding: '12px', fontSize: '14px', borderRadius: '12px' }}
                    onClick={() => setShowPayModal(true)}
                  >
                    💳 Hozir to'lash (Click / Payme)
                  </button>
                )}
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, minWidth: '150px', padding: '12px', fontSize: '14px', borderRadius: '12px', borderColor: 'var(--gold)', color: 'var(--gold)' }}
                  onClick={() => setShowRequestModal(true)}
                >
                  📝 Qarz / Nasiya so'rash
                </button>
              </div>

              {/* Transactions History */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '12px' }}>
                  📋 To'lovlar va Nasiyalar Tarixi
                </div>

                {txs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)', fontSize: '12px' }}>
                    Hali operatsiyalar mavjud emas
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {txs.slice(0, 10).map(t => (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: 'var(--surface-2)',
                          borderRadius: '10px',
                          fontSize: '12.5px'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {t.type === 'debt' ? '📦 Nasiyaga tovar olindi' : '✅ To\'lov qilindi'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{fmtDate(t.date)}</div>
                        </div>
                        <div style={{ fontWeight: 800 }} className={t.type === 'debt' ? 'rust' : 'teal'}>
                          {t.type === 'debt' ? '+' : '-'}{fmtMoney(t.amount, currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--muted)' }}>
              Mijoz tanlanmagan
            </div>
          )}
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPayModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-head">
              <h3>Onlayn To'lov Tizimi</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>To'lov summasi:</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--gold)' }}>
                  {fmtMoney(bal, currency)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className="btn"
                  style={{ background: '#00CCCC', color: '#fff', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }}
                  onClick={() => handlePayClick('Payme')}
                >
                  💎 Payme orqali to'lash
                </button>
                <button
                  className="btn"
                  style={{ background: '#00B5E2', color: '#fff', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }}
                  onClick={() => handlePayClick('Click')}
                >
                  🔵 Click orqali to'lash
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--muted)' }}>
                Xavfsiz to'lov shlyuzi. Mablag' to'g'ridan-to'g'ri do'kon hisobiga o'tkaziladi.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Debt Request Modal */}
      {showRequestModal && (
        <div className="modal-backdrop" onClick={() => setShowRequestModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-head">
              <h3>📝 Nasiya / Qarz So'rash</h3>
              <button className="modal-close" onClick={() => setShowRequestModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitDebtRequest} className="modal-body">
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '14px' }}>
                Hurmatli <b>{client?.name}</b>, so'rovingiz to'g'ridan-to'g'ri <b>{bizName}</b> ma'muriyatiga yetkaziladi.
              </p>

              <div className="form-field">
                <label>Kerakli summa ({currency})</label>
                <input
                  type="number"
                  placeholder="Masalan: 1500000"
                  value={reqAmount}
                  onChange={e => setReqAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>Qarz maqsadi / Kerakli tovarlar</label>
                <input
                  type="text"
                  placeholder="Masalan: Uy ta'miri, oziq-ovqat"
                  value={reqPurpose}
                  onChange={e => setReqPurpose(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Qachon qaytarishni rejalashtiryapsiz?</label>
                <input
                  type="date"
                  value={reqDueDate}
                  onChange={e => setReqDueDate(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowRequestModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-gold">
                  So'rovni Yuborish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
