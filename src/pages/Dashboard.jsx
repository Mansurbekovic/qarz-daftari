import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { fmtMoney, initials } from '../utils/helpers';

export default function Dashboard({ onOpenAddClient, onOpenTxModal }) {
  const { db, totals, navigate, clientBalance, searchQuery, setSearchQuery } = useApp();
  const [filter, setFilter] = useState('all'); // 'all' | 'owed' | 'iowe' | 'clean'

  if (!db) return null;

  const t = totals();
  const clients = db.clients || [];

  // Filtrlash va qidiruv
  let list = clients.slice();

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  }

  if (filter === 'owed') {
    list = list.filter(c => c.relation !== 'i_owe' && clientBalance(c.id) > 0);
  } else if (filter === 'iowe') {
    list = list.filter(c => c.relation === 'i_owe' && clientBalance(c.id) > 0);
  } else if (filter === 'clean') {
    list = list.filter(c => clientBalance(c.id) === 0);
  }

  // Qarz summasiga ko'ra saralash (eng kattasi tepada)
  list.sort((a, b) => Math.abs(clientBalance(b.id)) - Math.abs(clientBalance(a.id)));

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* 1. Asosiy 3 ta ko'rsatkich */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Menga qarzdorlar */}
        <div style={{
          background: 'var(--surface)',
          border: '1.5px solid rgba(31, 110, 92, 0.3)',
          borderRadius: '16px',
          padding: '16px 18px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            🟢 Menga qarzdorlar
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#1F6E5C', margin: '4px 0 2px' }}>
            {fmtMoney(t.owedToMe, db.currency || "so'm")}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
            Mijozlar sizga berishi kerak
          </div>
        </div>

        {/* Men qarzdorman */}
        <div style={{
          background: 'var(--surface)',
          border: '1.5px solid rgba(224, 72, 54, 0.3)',
          borderRadius: '16px',
          padding: '16px 18px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            🔴 Men qarzdorman
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#E04836', margin: '4px 0 2px' }}>
            {fmtMoney(t.iOwe, db.currency || "so'm")}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
            Siz boshqalarga berishingiz kerak
          </div>
        </div>

        {/* Jami odamlar */}
        <div style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: '16px',
          padding: '16px 18px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            👥 Jami daftardagilar
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)', margin: '4px 0 2px' }}>
            {clients.length} kishi
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
            Ro'yxatga olinganlar soni
          </div>
        </div>
      </div>

      {/* 2. Boshqaruv: Filtrlar va Qarz yozish tugmasi */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '16px'
      }}>
        {/* Filtr chiplari */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%' }}>
          <button
            type="button"
            className={`chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            style={{ fontWeight: 700 }}
          >
            Barchasi ({clients.length})
          </button>
          <button
            type="button"
            className={`chip ${filter === 'owed' ? 'active' : ''}`}
            onClick={() => setFilter('owed')}
            style={{ fontWeight: 700 }}
          >
            🟢 Menga qarzdor
          </button>
          <button
            type="button"
            className={`chip ${filter === 'iowe' ? 'active' : ''}`}
            onClick={() => setFilter('iowe')}
            style={{ fontWeight: 700 }}
          >
            🔴 Men qarzdorman
          </button>
          <button
            type="button"
            className={`chip ${filter === 'clean' ? 'active' : ''}`}
            onClick={() => setFilter('clean')}
            style={{ fontWeight: 700 }}
          >
            ✓ Qarz yo'qlar
          </button>
        </div>

        {/* Yangi qarz yozish tugmasi */}
        <button
          type="button"
          className="btn btn-gold"
          onClick={onOpenAddClient}
          style={{ padding: '10px 18px', fontWeight: 800, fontSize: '14px', borderRadius: '12px' }}
        >
          ➕ Yangi Qarz Yozish
        </button>
      </div>

      {/* 3. Qarzdorlar ro'yxati */}
      {list.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 20px',
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1.5px dashed var(--border)'
        }}>
          <div style={{ fontSize: '42px', marginBottom: '10px' }}>📒</div>
          <h3 style={{ margin: '0 0 6px', fontSize: '17px' }}>
            {searchQuery ? 'Qidiruv bo\'yicha hech kim topilmadi' : 'Hozircha hech qanday qarz yo\'q'}
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 16px' }}>
            {searchQuery ? 'Boshqa ism yoki manzilni qidirib ko\'ring' : 'Birinchi qarzni yozish uchun quyidagi tugmani bosing'}
          </p>
          <button
            type="button"
            className="btn btn-gold"
            onClick={onOpenAddClient}
            style={{ fontWeight: 800 }}
          >
            ➕ Yangi qarz yozish
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {list.map(c => {
            const bal = clientBalance(c.id);
            const iowe = c.relation === 'i_owe';

            return (
              <div
                key={c.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease'
                }}
              >
                {/* Chap taraf: Avatar, Ism, Manzil, Telefon */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, cursor: 'pointer' }}
                  onClick={() => navigate('clientDetail', c.id)}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: iowe ? 'rgba(224, 72, 54, 0.12)' : (bal > 0 ? 'rgba(31, 110, 92, 0.12)' : 'var(--surface-2)'),
                    color: iowe ? '#E04836' : (bal > 0 ? '#1F6E5C' : 'var(--muted)'),
                    fontWeight: 800,
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {initials(c.name)}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {c.address && (
                        <span>📍 {c.address}</span>
                      )}
                      {c.phone && (
                        <span>📞 {c.phone}</span>
                      )}
                      {c.note && !c.address && !c.phone && (
                        <span>📝 {c.note}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* O'ng taraf: Qarz summasi va Tezkor tugmalar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{ textAlign: 'right', cursor: 'pointer' }}
                    onClick={() => navigate('clientDetail', c.id)}
                  >
                    <div style={{
                      fontSize: '17px',
                      fontWeight: 800,
                      color: bal === 0 ? 'var(--muted)' : (iowe ? '#E04836' : '#1F6E5C')
                    }}>
                      {bal === 0 ? "Qarzi yo'q" : fmtMoney(Math.abs(bal), db.currency || "so'm")}
                    </div>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      {bal === 0 ? '✓ Tozalangan' : (iowe ? '🔴 Men qarzdor' : '🟢 Menga qarzdor')}
                    </div>
                  </div>

                  {/* Tezkor qarz/to'lov tugmalari */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      title="Qarz yozish"
                      style={{ padding: '6px 8px', fontSize: '11px', color: '#E04836', borderColor: 'rgba(224,72,54,0.3)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTxModal(c.id, 'debt');
                      }}
                    >
                      + Qarz
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      title="To'lov olish"
                      style={{ padding: '6px 8px', fontSize: '11px', color: '#1F6E5C', borderColor: 'rgba(31,110,92,0.3)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTxModal(c.id, 'payment');
                      }}
                    >
                      - To'lov
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
