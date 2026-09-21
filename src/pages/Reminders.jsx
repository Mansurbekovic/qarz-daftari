import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import {
  fmtMoney, fmtDate, todayISO, initials,
  telegramReminderLink, whatsappReminderLink, smsReminderText
} from '../utils/helpers';

export default function Reminders() {
  const {
    db, addReminder, toggleReminderDone, deleteReminder,
    clientBalance, clientIsOverdue, sendSmsReminder
  } = useApp();
  const { toast } = useToast();

  const [filter, setFilter] = useState('all'); // 'all' | 'overdue' | 'pending' | 'completed'
  const [showAddModal, setShowAddModal] = useState(false);

  // New reminder form state
  const [remTitle, setRemTitle] = useState('');
  const [remClientId, setRemClientId] = useState('');
  const [remDueDate, setRemDueDate] = useState(todayISO());
  const [remAmount, setRemAmount] = useState('');
  const [remPriority, setRemPriority] = useState('medium');
  const [remNotes, setRemNotes] = useState('');

  const clients = db?.clients || [];
  const manualReminders = db?.reminders || [];
  const today = todayISO();

  // Auto-generate reminders from overdue client transactions
  const autoOverdueReminders = clients
    .filter(c => clientIsOverdue(c.id))
    .map(c => {
      const bal = clientBalance(c.id);
      return {
        id: `auto_${c.id}`,
        isAuto: true,
        clientId: c.id,
        clientName: c.name,
        clientPhone: c.phone || '',
        title: `Muddati o'tgan qarz: ${c.name}`,
        dueDate: today,
        amount: bal,
        priority: 'high',
        status: 'pending',
        notes: 'Avtomatik aniqlangan muddati o\'tgan nasiya',
        createdAt: new Date().toISOString()
      };
    });

  // Combined reminders
  const allReminders = [...autoOverdueReminders, ...manualReminders];

  const filteredReminders = allReminders.filter(r => {
    if (filter === 'overdue') return r.dueDate < today && r.status !== 'completed';
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'completed') return r.status === 'completed';
    return true;
  });

  const handleCreateReminder = (e) => {
    e.preventDefault();
    if (!remTitle.trim()) {
      toast('Eslatma sarlavhasini kiriting', 'warning');
      return;
    }

    const selClient = clients.find(c => c.id === remClientId);

    addReminder({
      title: remTitle,
      clientId: remClientId || null,
      clientName: selClient ? selClient.name : 'Mijoz',
      clientPhone: selClient ? selClient.phone : '',
      dueDate: remDueDate,
      amount: Number(remAmount) || (selClient ? clientBalance(selClient.id) : 0),
      priority: remPriority,
      notes: remNotes,
    });

    setShowAddModal(false);
    setRemTitle('');
    setRemClientId('');
    setRemAmount('');
    setRemNotes('');
  };

  const handleSendTelegram = (r) => {
    const card = db.cards && db.cards[0] ? `${db.cards[0].bank} •${db.cards[0].last4}` : '';
    const text = `Assalomu alaykum, ${r.clientName}!\n` +
      `${db.businessName || 'Qarz Daftari'}dan eslatma: Sizda ${fmtMoney(r.amount, db.currency)} miqdorida to'lov majburiyati mavjud.\n` +
      `Muddat: ${fmtDate(r.dueDate)}.\n` +
      (card ? `To'lov uchun karta: ${card}\n` : '') +
      `Iltimos, o'z vaqtida to'lovni amalga oshirishingizni so'raymiz. Rahmat!`;
    const link = `https://t.me/share/url?url=${encodeURIComponent(db.businessName || 'Qarz Daftari')}&text=${encodeURIComponent(text)}`;
    window.open(link, '_blank');
  };

  const handleSendWhatsApp = (r) => {
    if (!r.clientPhone) {
      toast('Mijoz telefon raqami mavjud emas', 'warning');
      return;
    }
    const link = whatsappReminderLink(r.clientPhone, r.clientName, r.amount, db.currency, db.businessName);
    window.open(link, '_blank');
  };

  const handleSendSMS = (r) => {
    if (!r.clientPhone) {
      toast('Mijoz telefon raqami kiritilmagan', 'warning');
      return;
    }
    const msg = smsReminderText(r.clientName, r.amount, db.currency);
    sendSmsReminder(r.clientPhone, msg);
  };

  return (
    <div>
      {/* Stat Grid */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">Kechikkan qarz eslatmalari</div>
          <div className="stat-value rust">{autoOverdueReminders.length} ta</div>
          <div className="stat-note">Tezkor ogohlantirish talab etiladi</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Jami rejalashtirilgan</div>
          <div className="stat-value ink">{allReminders.length} ta</div>
          <div className="stat-note">Bugun va kelgusi sanalardagi to'lovlar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">SMS Xabarnomalar balansi</div>
          <div className="stat-value teal">{db?.smsBalance || 0} ta SMS</div>
          <div className="stat-note">Bir bosishda to'g'ridan-to'g'ri SMS jo'natish</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">To'langan / Bajarilgan</div>
          <div className="stat-value gold">
            {allReminders.filter(r => r.status === 'completed').length} ta
          </div>
          <div className="stat-note">Muvaffaqiyatli yopilgan eslatmalar</div>
        </div>
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div className="subnav-tabs" style={{ marginBottom: 0 }}>
          <button
            className={`subnav-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            📋 Barchasi ({allReminders.length})
          </button>
          <button
            className={`subnav-tab ${filter === 'overdue' ? 'active' : ''}`}
            onClick={() => setFilter('overdue')}
          >
            ⚠️ Muddati o'tganlar ({allReminders.filter(r => r.dueDate < today && r.status !== 'completed').length})
          </button>
          <button
            className={`subnav-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            ⏳ Kutilayotganlar ({allReminders.filter(r => r.status === 'pending').length})
          </button>
          <button
            className={`subnav-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            ✅ Bajarilganlar ({allReminders.filter(r => r.status === 'completed').length})
          </button>
        </div>

        <button className="btn btn-gold btn-sm" onClick={() => setShowAddModal(true)}>
          + Yangi eslatma qo'shish
        </button>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            <circle cx="12" cy="2" r="1"/>
          </svg>
          <div className="t">Hozircha eslatmalar yo'q</div>
          <div className="s">Muddati o'tgan qarzlar avtomatik tarzda bu yerda aks etadi yoki yangi eslatma rejalashtiring.</div>
          <button className="btn btn-gold btn-sm" style={{ marginTop: '12px' }} onClick={() => setShowAddModal(true)}>
            + Eslatma rejalashtirish
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredReminders.map(r => {
            const isCompleted = r.status === 'completed';
            const isOverdue = r.dueDate < today && !isCompleted;

            return (
              <div
                key={r.id}
                className="ledger-row"
                style={{
                  background: 'var(--surface)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  border: isOverdue ? '1px solid rgba(231,148,124,0.4)' : '1px solid var(--border)',
                  opacity: isCompleted ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  flexWrap: 'wrap'
                }}
              >
                {!r.isAuto && (
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => toggleReminderDone(r.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    title="Bajarildi deb belgilash"
                  />
                )}

                <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                  {initials(r.clientName)}
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14.5px', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                      {r.title}
                    </span>
                    {r.isAuto && (
                      <span className="badge-status rust" style={{ fontSize: '10px' }}>
                        Avto-Eslatma
                      </span>
                    )}
                    {r.priority === 'high' && (
                      <span className="badge-status rust" style={{ fontSize: '10px' }}>
                        Yuqori
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>
                    Mijoz: <b>{r.clientName}</b> {r.clientPhone && `(${r.clientPhone})`} • Muddat: <b>{fmtDate(r.dueDate)}</b>
                    {isOverdue && <span style={{ color: 'var(--rust)', fontWeight: 700 }}> (Kechikkan!)</span>}
                  </div>
                  {r.notes && (
                    <div style={{ fontSize: '11px', color: 'var(--text-sec)', marginTop: '2px', fontStyle: 'italic' }}>
                      "{r.notes}"
                    </div>
                  )}
                </div>

                {r.amount > 0 && (
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: isOverdue ? 'var(--rust)' : 'var(--gold)' }}>
                      {fmtMoney(r.amount, db?.currency)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Qarz summasi</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-sm btn-outline"
                    title="Telegram orqali yuborish"
                    onClick={() => handleSendTelegram(r)}
                  >
                    ✈️ Telegram
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    title="WhatsApp orqali yuborish"
                    onClick={() => handleSendWhatsApp(r)}
                  >
                    💬 WhatsApp
                  </button>
                  <button
                    className="btn btn-sm btn-gold"
                    title="SMS jo'natish (1 ta SMS yechiladi)"
                    onClick={() => handleSendSMS(r)}
                  >
                    📱 SMS
                  </button>
                  {!r.isAuto && (
                    <button
                      className="icon-btn"
                      title="O'chirish"
                      onClick={() => deleteReminder(r.id)}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-head">
              <h3>Yangi Eslatma Rejalashtirish</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateReminder}>
              <div className="modal-body">
                <div className="form-field">
                  <label>Eslatma mavzusi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Qarzning 1-qismini so'rash"
                    value={remTitle}
                    onChange={e => setRemTitle(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Tegishli mijozni tanlang (ixtiyoriy)</label>
                  <select
                    value={remClientId}
                    onChange={e => {
                      setRemClientId(e.target.value);
                      if (e.target.value) {
                        const bal = clientBalance(e.target.value);
                        if (bal > 0) setRemAmount(String(bal));
                      }
                    }}
                  >
                    <option value="">-- Mijoz biriktirilmagan --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({fmtMoney(clientBalance(c.id), db?.currency)})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-field">
                    <label>Eslatma sanasi *</label>
                    <input
                      type="date"
                      required
                      value={remDueDate}
                      onChange={e => setRemDueDate(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>Summa</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={remAmount}
                      onChange={e => setRemAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Muhimlik darajasi</label>
                  <select value={remPriority} onChange={e => setRemPriority(e.target.value)}>
                    <option value="high">🔴 Yuqori (Kechikib bo'lmaydi)</option>
                    <option value="medium">🟡 O'rta (Oddiy)</option>
                    <option value="low">🟢 Past (Ixtiyoriy)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Qo'shimcha izoh</label>
                  <textarea
                    rows={2}
                    placeholder="Masalan: Telefon qilib, to'lovni eslatish..."
                    value={remNotes}
                    onChange={e => setRemNotes(e.target.value)}
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn btn-gold">
                    Saqlash
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
