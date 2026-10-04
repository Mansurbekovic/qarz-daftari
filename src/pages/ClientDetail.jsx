import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, fmtDate, initials } from '../utils/helpers';

export default function ClientDetail({ onOpenTxModal, onOpenEditClient }) {
  const { db, currentClientId, navigate, clientBalance, clientTransactions, deleteTransaction, deleteClient } = useApp();
  const { toast } = useToast();

  const [txToDelete, setTxToDelete] = useState(null);
  const [showDelClientModal, setShowDelClientModal] = useState(false);

  const c = db.clients.find(item => item.id === currentClientId);

  if (!c) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
        <button className="btn btn-outline" style={{ marginBottom: '16px' }} onClick={() => navigate('dashboard')}>
          ← Qarz daftariga qaytish
        </button>
        <div style={{ fontSize: '16px', color: 'var(--muted)' }}>Qarzdor topilmadi yoki o'chirilgan.</div>
      </div>
    );
  }

  const bal = clientBalance(c.id);
  const txs = clientTransactions(c.id);
  const iowe = c.relation === 'i_owe';

  const handleDeleteClient = () => {
    deleteClient(c.id);
    setShowDelClientModal(false);
    toast("Mijoz o'chirildi");
    navigate('dashboard');
  };

  const handleDeleteTx = () => {
    if (txToDelete) {
      deleteTransaction(txToDelete);
      setTxToDelete(null);
      toast("Yozuv o'chirildi");
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Orqaga qaytish va boshqaruv */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigate('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
        >
          ← Qarz daftariga qaytish
        </button>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onOpenEditClient(c.id)}
            style={{ fontWeight: 700 }}
          >
            ✏️ Tahrirlash
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowDelClientModal(true)}
            style={{ color: '#E04836', borderColor: 'rgba(224,72,54,0.3)', fontWeight: 700 }}
          >
            🗑️ O'chirish
          </button>
        </div>
      </div>

      {/* Profil kartasi va Joriy qarz */}
      <div style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: iowe ? 'rgba(224, 72, 54, 0.15)' : (bal > 0 ? 'rgba(31, 110, 92, 0.15)' : 'var(--surface-2)'),
            color: iowe ? '#E04836' : (bal > 0 ? '#1F6E5C' : 'var(--muted)'),
            fontWeight: 800,
            fontSize: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {initials(c.name)}
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>
              {c.name}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {c.address && <span>📍 Manzil: <b>{c.address}</b></span>}
              {c.phone && (
                <span>
                  📞 Telefon: <a href={`tel:${c.phone}`} style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 700 }}>{c.phone}</a>
                </span>
              )}
              {c.note && <span>📝 Izoh: {c.note}</span>}
            </div>
          </div>
        </div>

        {/* Qarz summasi bloki */}
        <div style={{
          background: 'var(--surface-2)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid var(--border)'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
              {iowe ? 'Men unga berishim kerak bo\'lgan qarz' : 'Uning menga bo\'lgan qarzi'}
            </div>
            <div style={{
              fontSize: '26px',
              fontWeight: 900,
              color: bal === 0 ? 'var(--muted)' : (iowe ? '#E04836' : '#1F6E5C'),
              marginTop: '2px'
            }}>
              {bal === 0 ? "Qarz to'liq yopilgan" : fmtMoney(Math.abs(bal), db?.currency || "so'm")}
            </div>
          </div>

          <div style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 800,
            background: bal === 0 ? 'var(--surface)' : (iowe ? 'rgba(224,72,54,0.15)' : 'rgba(31,110,92,0.15)'),
            color: bal === 0 ? 'var(--muted)' : (iowe ? '#E04836' : '#1F6E5C')
          }}>
            {bal === 0 ? '✓ Toza hisob' : (iowe ? '🔴 Men qarzdor' : '🟢 Menga qarzdor')}
          </div>
        </div>

        {/* 2 ta katta harakat tugmasi */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onOpenTxModal(c.id, 'debt')}
            style={{ padding: '12px', fontSize: '14.5px', fontWeight: 800, borderRadius: '12px' }}
          >
            + Qarz qo'shish
          </button>
          <button
            type="button"
            className="btn btn-gold"
            onClick={() => onOpenTxModal(c.id, 'payment')}
            style={{ padding: '12px', fontSize: '14.5px', fontWeight: 800, borderRadius: '12px' }}
          >
            - To'lov oldim
          </button>
        </div>
      </div>

      {/* Qarzlar va to'lovlar tarixi */}
      <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '20px 0 10px', color: 'var(--ink)' }}>
        📋 Qarzlar va to'lovlar tarixi ({txs.length} ta amal)
      </h3>

      {txs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '30px',
          background: 'var(--surface)',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          color: 'var(--muted)',
          fontSize: '13.5px'
        }}>
          Hali hech qanday qarz yoki to'lov yozilmagan. Yuqoridagi tugmalar orqali qarz yoki to'lov kiriting.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {txs.map(t => {
            const isDebt = t.type === 'debt';
            return (
              <div
                key={t.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: isDebt ? 'rgba(224, 72, 54, 0.12)' : 'rgba(31, 110, 92, 0.12)',
                    color: isDebt ? '#E04836' : '#1F6E5C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 900
                  }}>
                    {isDebt ? '+' : '−'}
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                      {isDebt ? 'Qarz yozildi' : 'To\'lov qilindi'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {fmtDate(t.date)} {t.note ? ` · ${t.note}` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: isDebt ? '#E04836' : '#1F6E5C'
                  }}>
                    {isDebt ? '+' : '−'}{fmtMoney(t.amount, db?.currency || "so'm")}
                  </div>

                  <button
                    type="button"
                    onClick={() => setTxToDelete(t.id)}
                    title="O'chirish"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tranzaksiyani o'chirish tasdig'i */}
      {txToDelete && (
        <div className="modal-backdrop" onClick={() => setTxToDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px' }}>Yozuvni o'chirish</h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px' }}>
              Ushbu yozuvni ro'yxatdan o'chirmoqchimisiz?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setTxToDelete(null)}>
                Bekor qilish
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteTx}>
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mijozni o'chirish tasdig'i */}
      {showDelClientModal && (
        <div className="modal-backdrop" onClick={() => setShowDelClientModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '17px', color: '#E04836' }}>Qarzdorni o'chirish</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--ink)', margin: '0 0 16px', lineHeight: '1.5' }}>
              <b>{c.name}</b> va unga tegishli barcha qarzlar tarixi butunlay o'chiriladi. Rozimisiz?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowDelClientModal(false)}>
                Bekor qilish
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteClient}>
                Ha, o'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
