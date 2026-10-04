import React, { useState } from 'react';
import { useApp } from './contexts/AppContext';
import AuthScreen from './components/auth/AuthScreen';
import AdminPanel from './pages/admin/AdminPanel';
import { fmtMoney, todayISO } from './utils/helpers';

function formatDate(d) {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  return d;
}

export default function App() {
  const {
    authState, initialized, db, logout,
    addClient, deleteClient, addTransaction, deleteTransaction,
    clientBalance, clientTransactions, updateDB, isAdmin
  } = useApp();

  const [view, setView] = useState('notebook'); // 'notebook' | 'admin'

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');

  // Tranzaksiya qo'shish uchun
  const [selectedClient, setSelectedClient] = useState(null);
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(todayISO());
  const [txType, setTxType] = useState('debt');
  const [txNote, setTxNote] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');

  // Loading
  if (!initialized || authState === 'loading') {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingLogo}>📒</div>
        <div style={{ fontSize: '18px', fontWeight: 800 }}>Qarz Daftari</div>
        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '6px' }}>Yuklanmoqda...</div>
      </div>
    );
  }

  // Auth
  if (authState === 'auth') {
    return <AuthScreen />;
  }

  const clients = db?.clients || [];
  const currency = db?.currency || "so'm";

  // Yangi qarz yozish
  const handleAddDebt = (e) => {
    e.preventDefault();
    const n = name.trim();
    const a = Number(amount);
    if (!n) return;
    if (!a || a <= 0) return;

    const clientId = 'c_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    addClient({
      id: clientId,
      name: n,
      address: address.trim(),
      relation: 'owed_to_me',
    });
    addTransaction({
      clientId,
      type: 'debt',
      amount: a,
      date: date || todayISO(),
      note: note.trim() || '',
    });

    setName('');
    setAddress('');
    setAmount('');
    setDate(todayISO());
    setNote('');
  };

  // Tanlangan mijozga yangi tranzaksiya yozish
  const handleAddTx = (e) => {
    e.preventDefault();
    const a = Number(txAmount);
    if (!a || a <= 0 || !selectedClient) return;

    addTransaction({
      clientId: selectedClient,
      type: txType,
      amount: a,
      date: txDate || todayISO(),
      note: txNote.trim() || '',
    });

    setTxAmount('');
    setTxDate(todayISO());
    setTxNote('');
    setTxType('debt');
  };

  // O'chirish
  const handleDelete = (clientId) => {
    deleteClient(clientId);
    setConfirmDelete(null);
    if (selectedClient === clientId) setSelectedClient(null);
  };

  // Filtrlash
  let filteredClients = clients;
  if (search.trim()) {
    const q = search.toLowerCase();
    filteredClients = clients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  }

  // Saralash — eng katta qarz tepada
  filteredClients = [...filteredClients].sort((a, b) => {
    return Math.abs(clientBalance(b.id)) - Math.abs(clientBalance(a.id));
  });

  // Tanlangan mijozning tarixi
  const selectedTxs = selectedClient
    ? clientTransactions(selectedClient).sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];
  const selectedClientObj = selectedClient ? clients.find(c => c.id === selectedClient) : null;
  const selectedBal = selectedClient ? clientBalance(selectedClient) : 0;

  if (view === 'admin' && isAdmin) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>⚡</span>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>Admin Panel</div>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>Tizim nazorati va audit</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setView('notebook')}
              style={{
                background: 'var(--surface, #fff)',
                color: 'var(--ink, #333)',
                border: '1.5px solid var(--border, #ddd)',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              📒 Qarz Daftariga qaytish
            </button>
            <button onClick={logout} style={styles.logoutBtn}>Chiqish</button>
          </div>
        </div>
        <AdminPanel onBackToNotebook={() => setView('notebook')} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>📒</span>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900 }}>Qarz Daftari</div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>{db?.businessName || ''}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isAdmin && (
            <button
              onClick={() => setView('admin')}
              style={{
                background: 'linear-gradient(135deg, #D4A017 0%, #8A6109 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(212,160,23,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>⚡</span> Admin Panel
            </button>
          )}
          <button onClick={logout} style={styles.logoutBtn}>Chiqish</button>
        </div>
      </div>

      {/* YANGI QARZ YOZISH FORMASI */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>✏️ Yangi qarz yozish</h3>
        <form onSubmit={handleAddDebt} style={styles.form}>
          <div style={styles.formRow}>
            <input
              type="text"
              placeholder="Ismi *"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={{ ...styles.input, flex: 2 }}
            />
            <input
              type="text"
              placeholder="Manzili"
              value={address}
              onChange={e => setAddress(e.target.value)}
              style={{ ...styles.input, flex: 2 }}
            />
          </div>
          <div style={styles.formRow}>
            <input
              type="number"
              placeholder="Qarz summasi *"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              min="1"
              style={{ ...styles.input, flex: 2 }}
            />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ ...styles.input, flex: 1.5 }}
            />
          </div>
          <div style={styles.formRow}>
            <input
              type="text"
              placeholder="Izoh (ixtiyoriy)"
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ ...styles.input, flex: 1 }}
            />
            <button type="submit" style={styles.addBtn}>
              + Yozish
            </button>
          </div>
        </form>
      </div>

      {/* QIDIRUV */}
      {clients.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="🔍 Ism yoki manzil bo'yicha qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      )}

      {/* QARZDORLAR RO'YXATI */}
      {filteredClients.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>📒</div>
          <div style={{ fontWeight: 700 }}>
            {search ? "Topilmadi" : "Hali qarz yozilmagan"}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '4px' }}>
            {search ? "Boshqa so'z bilan qidiring" : "Yuqoridagi formadan yozing"}
          </div>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredClients.map(c => {
            const bal = clientBalance(c.id);
            const isSelected = selectedClient === c.id;

            return (
              <div key={c.id}>
                <div
                  style={{
                    ...styles.listItem,
                    borderColor: isSelected ? '#D4A017' : 'var(--border, #e0e0e0)',
                    background: isSelected ? 'rgba(212,160,23,0.06)' : '#fff',
                  }}
                  onClick={() => setSelectedClient(isSelected ? null : c.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.clientName}>{c.name}</div>
                    {c.address && (
                      <div style={styles.clientAddress}>📍 {c.address}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: '17px',
                      fontWeight: 900,
                      color: bal > 0 ? '#1F6E5C' : (bal < 0 ? '#E04836' : '#999'),
                    }}>
                      {bal === 0 ? "0" : fmtMoney(Math.abs(bal), currency)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#999', fontWeight: 700 }}>
                      {bal > 0 ? 'qarzdor' : bal < 0 ? "to'langan" : 'toza'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(c.id); }}
                    style={styles.deleteBtn}
                    title="O'chirish"
                  >
                    ✕
                  </button>
                </div>

                {/* Tanlangan mijoz: tarix va yangi qarz/to'lov formasi */}
                {isSelected && (
                  <div style={styles.detailBox}>
                    {/* Yangi qarz yoki to'lov qo'shish */}
                    <form onSubmit={handleAddTx} style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <select
                        value={txType}
                        onChange={e => setTxType(e.target.value)}
                        style={{ ...styles.input, flex: '0 0 auto', width: 'auto', minWidth: '120px' }}
                      >
                        <option value="debt">+ Qarz</option>
                        <option value="payment">− To'lov</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Summa"
                        value={txAmount}
                        onChange={e => setTxAmount(e.target.value)}
                        required
                        min="1"
                        style={{ ...styles.input, flex: 1, minWidth: '90px' }}
                      />
                      <input
                        type="date"
                        value={txDate}
                        onChange={e => setTxDate(e.target.value)}
                        style={{ ...styles.input, flex: '0 0 auto', width: 'auto' }}
                      />
                      <input
                        type="text"
                        placeholder="Izoh"
                        value={txNote}
                        onChange={e => setTxNote(e.target.value)}
                        style={{ ...styles.input, flex: 1, minWidth: '80px' }}
                      />
                      <button type="submit" style={{ ...styles.addBtn, padding: '8px 14px' }}>
                        Saqlash
                      </button>
                    </form>

                    {/* Tranzaksiyalar tarixi */}
                    {selectedTxs.length === 0 ? (
                      <div style={{ fontSize: '13px', color: '#999', textAlign: 'center', padding: '10px' }}>
                        Tarix yo'q
                      </div>
                    ) : (
                      <div>
                        {selectedTxs.map(t => (
                          <div key={t.id} style={styles.txRow}>
                            <span style={{
                              color: t.type === 'debt' ? '#E04836' : '#1F6E5C',
                              fontWeight: 800,
                              fontSize: '14px',
                              minWidth: '100px',
                            }}>
                              {t.type === 'debt' ? '+' : '−'}{fmtMoney(t.amount, currency)}
                            </span>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                              {formatDate(t.date)}
                            </span>
                            {t.note && (
                              <span style={{ fontSize: '12px', color: '#aaa', flex: 1 }}>
                                {t.note}
                              </span>
                            )}
                            <button
                              onClick={() => deleteTransaction(t.id)}
                              style={{ ...styles.deleteBtn, fontSize: '12px', padding: '2px 6px' }}
                              title="O'chirish"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* O'chirishni tasdiqlash */}
      {confirmDelete && (
        <div style={styles.overlay} onClick={() => setConfirmDelete(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '10px' }}>O'chirasizmi?</div>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              Bu odam va uning barcha qarzlari o'chiriladi.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setConfirmDelete(null)} style={styles.cancelBtn}>Yo'q</button>
              <button onClick={() => handleDelete(confirmDelete)} style={styles.confirmDeleteBtn}>Ha, o'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fafafa',
    color: '#333',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  loadingLogo: { fontSize: '48px', marginBottom: '12px' },
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '14px',
    borderBottom: '2px solid #eee',
  },
  logoutBtn: {
    background: 'none',
    border: '1.5px solid #ddd',
    borderRadius: '8px',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    color: '#888',
  },
  card: {
    background: '#fff',
    border: '1.5px solid #e8e8e8',
    borderRadius: '14px',
    padding: '18px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  cardTitle: {
    margin: '0 0 12px',
    fontSize: '16px',
    fontWeight: 800,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  input: {
    padding: '10px 12px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    background: '#fafafa',
    color: '#333',
    minWidth: '0',
  },
  addBtn: {
    background: '#D4A017',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  empty: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#888',
    fontSize: '15px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    background: '#fff',
    border: '1.5px solid #e8e8e8',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  clientName: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#222',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  clientAddress: {
    fontSize: '12px',
    color: '#999',
    marginTop: '2px',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
    borderRadius: '6px',
    flexShrink: 0,
  },
  detailBox: {
    background: '#f9f9f6',
    border: '1px solid #e8e8e8',
    borderTop: 'none',
    borderRadius: '0 0 12px 12px',
    padding: '12px',
    marginTop: '-8px',
    marginBottom: '4px',
  },
  txRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '13px',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '340px',
    width: '100%',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  cancelBtn: {
    flex: 1,
    padding: '10px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    background: '#fff',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  confirmDeleteBtn: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '10px',
    background: '#E04836',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 800,
    cursor: 'pointer',
  },
};
