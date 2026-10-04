import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { fmtMoney, getApiBase } from '../../utils/helpers';
import { storage } from '../../utils/storage';

export default function AdminAnalytics() {
  const { accounts, db } = useApp();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month'); // 'day' | 'week' | 'month'

  const [stats, setStats] = useState({
    totalDebt: 0,
    totalPayment: 0,
    dailyDebt: 0,
    dailyPayment: 0,
    weeklyDebt: 0,
    weeklyPayment: 0,
    monthlyDebt: 0,
    monthlyPayment: 0,
    dayOfWeekBreakdown: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    topStores: []
  });

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        let totDebt = 0;
        let totPay = 0;
        let dDebt = 0;
        let dPay = 0;
        let wDebt = 0;
        let wPay = 0;
        let mDebt = 0;
        let mPay = 0;
        const daysMap = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        const storesMap = [];

        for (const acc of accounts) {
          let uData = null;
          try {
            const res = await storage.get('qd-db::' + acc.username, false);
            if (res && res.value) uData = JSON.parse(res.value);

            try {
              const bRes = await fetch(`${getApiBase()}/api/users/${acc.username}/db`);
              if (bRes.ok) {
                const s = await bRes.json();
                if (s && Object.keys(s).length > 0) uData = { ...(uData || {}), ...s };
              }
            } catch (e) { /* ignore */ }

            if (uData) {
              const txs = uData.transactions || [];
              let storeVol = 0;

              for (const t of txs) {
                const amt = Number(t.amount) || 0;
                const tDate = new Date(t.date || 0);
                const dDay = tDate.getDay();
                daysMap[dDay] = (daysMap[dDay] || 0) + amt;
                storeVol += amt;

                if (t.type === 'debt') {
                  totDebt += amt;
                  if (t.date === todayStr) dDebt += amt;
                  if (tDate >= weekAgo) wDebt += amt;
                  if (tDate >= monthAgo) mDebt += amt;
                } else if (t.type === 'payment') {
                  totPay += amt;
                  if (t.date === todayStr) dPay += amt;
                  if (tDate >= weekAgo) wPay += amt;
                  if (tDate >= monthAgo) mPay += amt;
                }
              }

              storesMap.push({
                username: acc.username,
                bizName: acc.businessName || acc.username,
                volume: storeVol,
                txCount: txs.length
              });
            }
          } catch (e) {
            console.error(e);
          }
        }

        storesMap.sort((a, b) => b.volume - a.volume);

        setStats({
          totalDebt: totDebt,
          totalPayment: totPay,
          dailyDebt: dDebt,
          dailyPayment: dPay,
          weeklyDebt: wDebt,
          weeklyPayment: wPay,
          monthlyDebt: mDebt,
          monthlyPayment: mPay,
          dayOfWeekBreakdown: daysMap,
          topStores: storesMap.slice(0, 5)
        });
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (accounts.length > 0) {
      loadAnalytics();
    }
  }, [accounts]);

  const activeDebt = timeframe === 'day' ? stats.dailyDebt : timeframe === 'week' ? stats.weeklyDebt : stats.monthlyDebt;
  const activePay = timeframe === 'day' ? stats.dailyPayment : timeframe === 'week' ? stats.weeklyPayment : stats.monthlyPayment;
  const activeNet = activeDebt - activePay;

  const totalVol = activeDebt + activePay || 1;
  const debtPct = Math.round((activeDebt / totalVol) * 100);
  const payPct = Math.round((activePay / totalVol) * 100);

  const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const maxDayVal = Math.max(...Object.values(stats.dayOfWeekBreakdown), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Timeframe Switcher */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
            📈 Qarzlar va Tushumlar Analitikasi
          </h3>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
            Kunlik, haftalik va oylik pul oqimi va qarzlar dinamikasini vizual tahlil qilish
          </div>
        </div>

        <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: '10px', padding: '3px' }}>
          <button
            type="button"
            className={`btn btn-sm ${timeframe === 'day' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setTimeframe('day')}
            style={{ borderRadius: '8px', border: 'none' }}
          >
            Kunlik (Bugun)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${timeframe === 'week' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setTimeframe('week')}
            style={{ borderRadius: '8px', border: 'none' }}
          >
            Haftalik (7 kun)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${timeframe === 'month' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setTimeframe('month')}
            style={{ borderRadius: '8px', border: 'none' }}
          >
            Oylik (30 kun)
          </button>
        </div>
      </div>

      {/* 2. Overview Metric Cards for selected timeframe */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        <div style={{ background: 'var(--surface)', padding: '16px 20px', borderRadius: '14px', border: '1.5px solid rgba(224, 72, 54, 0.3)' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            🔴 Berilgan Qarzlar ({timeframe === 'day' ? 'Bugun' : timeframe === 'week' ? 'Shu hafta' : 'Shu oy'})
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#E04836', marginTop: '4px' }}>
            {fmtMoney(activeDebt)} {db?.currency || "so'm"}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
            Chiqim nasiyalar
          </div>
        </div>

        <div style={{ background: 'var(--surface)', padding: '16px 20px', borderRadius: '14px', border: '1.5px solid rgba(31, 110, 92, 0.3)' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            🟢 Qaytgan Tushumlar ({timeframe === 'day' ? 'Bugun' : timeframe === 'week' ? 'Shu hafta' : 'Shu oy'})
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#1F6E5C', marginTop: '4px' }}>
            {fmtMoney(activePay)} {db?.currency || "so'm"}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
            Qaytarilgan to'lovlar
          </div>
        </div>

        <div style={{ background: 'var(--surface)', padding: '16px 20px', borderRadius: '14px', border: '1.5px solid rgba(212, 160, 23, 0.3)' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            ⚖️ Sof Qarz Farqi (Net)
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--gold)', marginTop: '4px' }}>
            {fmtMoney(activeNet)} {db?.currency || "so'm"}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
            {activeNet > 0 ? "Qarzlar tushumdan ko'proq" : "Tushumlar ko'proq"}
          </div>
        </div>
      </div>

      {/* 3. Visual Ratio Bar: Qarzlar vs Tushumlar */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>
            📊 Qarzlar va Qaytarilgan To'lovlar Taqsimoti
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Umumiy aylanma: <b>{fmtMoney(activeDebt + activePay)} {db?.currency || "so'm"}</b>
          </span>
        </div>

        <div style={{
          height: '24px',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          background: 'var(--surface-2)',
          marginBottom: '10px'
        }}>
          <div
            style={{
              width: `${debtPct}%`,
              background: '#E04836',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 800
            }}
            title={`Berilgan qarz: ${debtPct}%`}
          >
            {debtPct > 10 ? `${debtPct}% Qarz` : ''}
          </div>
          <div
            style={{
              width: `${payPct}%`,
              background: '#1F6E5C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 800
            }}
            title={`Qaytgan to'lov: ${payPct}%`}
          >
            {payPct > 10 ? `${payPct}% To'lov` : ''}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E04836' }} />
            <span>Berilgan qarzlar: <b>{debtPct}%</b></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1F6E5C' }} />
            <span>Qaytarilgan to'lovlar: <b>{payPct}%</b></span>
          </div>
        </div>
      </div>

      {/* 4. Day of Week Breakdown Table */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800 }}>
          📅 Hafta Kunlari Bo'yicha Tranzaksiya Zichligi
        </h4>
        <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: 'var(--muted)' }}>
          Qaysi kunlarda qarz va to'lov amallari eng ko'p amalga oshiriladi
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dayNames.map((dName, idx) => {
            const val = stats.dayOfWeekBreakdown[idx] || 0;
            const pct = Math.round((val / maxDayVal) * 100);

            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '90px', fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)' }}>
                  {dName}
                </span>

                <div style={{ flex: 1, height: '12px', background: 'var(--surface-2)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--gold) 0%, #1F6E5C 100%)',
                    borderRadius: '6px'
                  }} />
                </div>

                <span style={{ minWidth: '100px', textAlign: 'right', fontSize: '12.5px', fontWeight: 800, color: 'var(--muted)' }}>
                  {fmtMoney(val)} so'm
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Top 5 Most Active Stores / Users */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 800 }}>
          🏪 Eng Faol Do'konlar & Foydalanuvchilar (Top 5)
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {stats.topStores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)', fontSize: '13px' }}>
              Ma'lumot mavjud emas
            </div>
          ) : (
            stats.topStores.map((s, idx) => (
              <div
                key={s.username}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--surface-2)',
                  borderRadius: '10px'
                }}
              >
                <div>
                  <b style={{ color: 'var(--ink)' }}>{idx + 1}. {s.bizName}</b>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '6px' }}>(@{s.username})</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '14px' }}>
                    {fmtMoney(s.volume)} {db?.currency || "so'm"}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {s.txCount} ta tranzaksiya
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
