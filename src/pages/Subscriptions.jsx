import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, fmtDate } from '../utils/helpers';
import { PRICING_PLANS, SMS_PACKAGES, PAYMENT_PROVIDERS } from '../utils/constants';

export default function Subscriptions() {
  const { db, buySubscription, buySmsPackage } = useApp();
  const { toast } = useToast();

  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedPlanForPay, setSelectedPlanForPay] = useState(null);
  const [selectedSmsForPay, setSelectedSmsForPay] = useState(null);
  const [payProvider, setPayProvider] = useState('payme'); // 'payme' | 'click'
  const [phoneForBilling, setPhoneForBilling] = useState('+998 ');

  const currentSub = db?.subscription || { plan: 'enterprise', validUntil: '2030-12-31', status: 'active' };
  const smsBalance = db?.smsBalance || 0;
  const currency = "so'm";

  const handleCheckoutPlan = (e) => {
    e.preventDefault();
    if (!selectedPlanForPay) return;

    buySubscription(selectedPlanForPay.id, billingPeriod === 'yearly' ? 12 : 1);
    setSelectedPlanForPay(null);
  };

  const handleCheckoutSms = (e) => {
    e.preventDefault();
    if (!selectedSmsForPay) return;

    buySmsPackage(selectedSmsForPay.count);
    setSelectedSmsForPay(null);
  };

  return (
    <div>
      {/* Current Active Plan Status Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #173A28, #0E2419)',
        border: '1px solid var(--gold)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '28px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>👑</span>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                SIZNING JORIY TARIFINGIZ
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '2px 0' }}>
                {currentSub.plan.toUpperCase()} TIZIMI
              </h2>
            </div>
          </div>
          <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '8px' }}>
            Faol muddat: <b>{fmtDate(currentSub.validUntil)}</b> gacha • SMS balansingiz: <b>{smsBalance} ta xabar</b>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-gold"
            onClick={() => {
              const el = document.getElementById('plansSection');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Tarifni yangilash
          </button>
        </div>
      </div>

      {/* Subscription Pricing Plans */}
      <div id="plansSection" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>
          Biznesingiz uchun Mukammal Tariflar
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--muted)', maxWidth: '600px', margin: '0 auto 20px' }}>
          Kichik do'kondan tortib yirik tarmoqlargacha moslashtirilgan qulay obunalar. Click va Payme orqali bir lahzada to'lang.
        </p>

        {/* Period Switcher */}
        <div style={{ display: 'inline-flex', background: 'var(--surface-2)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <button
            className={`btn btn-sm ${billingPeriod === 'monthly' ? 'btn-gold' : 'btn-outline'}`}
            style={{ border: 'none' }}
            onClick={() => setBillingPeriod('monthly')}
          >
            Oylik to'lov
          </button>
          <button
            className={`btn btn-sm ${billingPeriod === 'yearly' ? 'btn-gold' : 'btn-outline'}`}
            style={{ border: 'none' }}
            onClick={() => setBillingPeriod('yearly')}
          >
            Yillik (2 oy BEPUL! 🎁)
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {PRICING_PLANS.map(plan => {
          const isCurrent = currentSub.plan === plan.id;
          const price = billingPeriod === 'yearly' && plan.price > 0 ? Math.round(plan.price * 10) : plan.price;
          const periodLabel = billingPeriod === 'yearly' && plan.price > 0 ? 'yiliga' : plan.period;

          return (
            <div
              key={plan.id}
              className="settings-card"
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: plan.popular ? '2px solid var(--gold)' : '1px solid var(--border)',
                background: plan.popular ? 'var(--surface-2)' : 'var(--surface)',
                boxShadow: plan.popular ? '0 8px 30px rgba(169, 130, 31, 0.18)' : 'none',
                borderRadius: '18px',
                padding: '24px'
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--gold)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 12px',
                  borderRadius: '12px',
                  letterSpacing: '0.04em'
                }}>
                  ENG MASHHUR VA FOYDALI
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{plan.name}</h3>
                  <span className="badge-status info" style={{ fontSize: '11px' }}>{plan.badge}</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '4px', minHeight: '36px' }}>
                  {plan.description}
                </p>

                <div style={{ margin: '20px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--gold)' }}>
                    {price === 0 ? '0' : fmtMoney(price, '')}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--muted)', marginLeft: '6px' }}>
                    {currency} / {periodLabel}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <span style={{ color: 'var(--teal)', fontWeight: 800 }}>✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {isCurrent ? (
                  <button className="btn btn-outline" style={{ width: '100%' }} disabled>
                    ✓ Joriy faol tarif
                  </button>
                ) : (
                  <button
                    className={`btn ${plan.popular ? 'btn-gold' : 'btn-outline'}`}
                    style={{ width: '100%' }}
                    onClick={() => setSelectedPlanForPay(plan)}
                  >
                    Ushbu tarifga o'tish
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SMS Packages Section */}
      <div style={{ marginTop: '50px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>
            📱 SMS Xabarnoma Paketlari
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Mijozlarga qarzdorlik haqida to'g'ridan-to'g'ri telefoniga rasmiy SMS jo'natish xizmati
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {SMS_PACKAGES.map(pkg => (
            <div
              key={pkg.id}
              className="settings-card"
              style={{
                textAlign: 'center',
                border: pkg.popular ? '2px solid var(--teal)' : '1px solid var(--border)',
                background: 'var(--surface)',
                borderRadius: '16px',
                padding: '20px'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{pkg.count} ta SMS</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{pkg.perSms}</div>

              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--teal)', margin: '14px 0' }}>
                {fmtMoney(pkg.price, currency)}
              </div>

              <button
                className={`btn btn-sm ${pkg.popular ? 'btn-teal' : 'btn-outline'}`}
                style={{ width: '100%' }}
                onClick={() => setSelectedSmsForPay(pkg)}
              >
                Paketni sotib olish
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout Modal for Plan */}
      {selectedPlanForPay && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-head">
              <h3>Tarifga obuna bo'lish</h3>
              <button className="modal-close" onClick={() => setSelectedPlanForPay(null)}>✕</button>
            </div>
            <form onSubmit={handleCheckoutPlan}>
              <div className="modal-body">
                <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '12px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>{selectedPlanForPay.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Muddati: {billingPeriod === 'yearly' ? '1 yil (12 oy)' : '1 oy'}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--gold)', marginTop: '6px' }}>
                    {fmtMoney(billingPeriod === 'yearly' ? selectedPlanForPay.price * 10 : selectedPlanForPay.price, currency)}
                  </div>
                </div>

                <div className="form-field">
                  <label>To'lov tizimini tanlang</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: payProvider === 'payme' ? '2px solid #00CCCC' : '1px solid var(--border)',
                        background: payProvider === 'payme' ? 'rgba(0,204,204,0.1)' : 'var(--surface-2)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                      onClick={() => setPayProvider('payme')}
                    >
                      💎 Payme
                    </div>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: payProvider === 'click' ? '2px solid #00B5E2' : '1px solid var(--border)',
                        background: payProvider === 'click' ? 'rgba(0,181,226,0.1)' : 'var(--surface-2)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                      onClick={() => setPayProvider('click')}
                    >
                      🔵 Click Up
                    </div>
                  </div>
                </div>

                <div className="form-field">
                  <label>Telefon raqamingiz</label>
                  <input
                    type="text"
                    required
                    value={phoneForBilling}
                    onChange={e => setPhoneForBilling(e.target.value)}
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setSelectedPlanForPay(null)}>
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn btn-gold">
                    To'lovni amalga oshirish
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal for SMS */}
      {selectedSmsForPay && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-head">
              <h3>SMS Paket xarid qilish</h3>
              <button className="modal-close" onClick={() => setSelectedSmsForPay(null)}>✕</button>
            </div>
            <form onSubmit={handleCheckoutSms}>
              <div className="modal-body">
                <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '12px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>{selectedSmsForPay.count} ta SMS xabarnoma</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--teal)', marginTop: '6px' }}>
                    {fmtMoney(selectedSmsForPay.price, currency)}
                  </div>
                </div>

                <div className="form-field">
                  <label>To'lov usuli</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: payProvider === 'payme' ? '2px solid #00CCCC' : '1px solid var(--border)',
                        background: payProvider === 'payme' ? 'rgba(0,204,204,0.1)' : 'var(--surface-2)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                      onClick={() => setPayProvider('payme')}
                    >
                      💎 Payme
                    </div>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: payProvider === 'click' ? '2px solid #00B5E2' : '1px solid var(--border)',
                        background: payProvider === 'click' ? 'rgba(0,181,226,0.1)' : 'var(--surface-2)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                      onClick={() => setPayProvider('click')}
                    >
                      🔵 Click Up
                    </div>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setSelectedSmsForPay(null)}>
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn btn-teal">
                    To'lash va faollashtirish
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
