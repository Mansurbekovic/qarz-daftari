import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function AuthScreen() {
  const { login, register, accounts } = useApp();
  const [activeTab, setActiveTab] = useState(accounts.length === 0 ? 'register' : 'login');
  
  // Login form state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginErr, setLoginErr] = useState('');

  // Register form state
  const [regBiz, setRegBiz] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPass2, setRegPass2] = useState('');
  const [regShowPw, setRegShowPw] = useState(false);
  const [regErr, setRegErr] = useState('');
  const [pwStrength, setPwStrength] = useState(0);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginErr('');
    const u = loginUser.trim().toLowerCase();
    if (!u || !loginPass) {
      setLoginErr('Foydalanuvchi nomi va parolni kiriting.');
      return;
    }
    try {
      await login(u, loginPass);
    } catch (ex) {
      setLoginErr(ex.message || 'Xatolik yuz berdi');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegErr('');
    const biz = regBiz.trim() || 'Mening biznesim';
    const u = regUser.trim().toLowerCase().replace(/\s+/g, '');
    if (!u || !/^[a-z0-9_.]{3,}$/.test(u)) {
      setRegErr('Foydalanuvchi nomi kamida 3 belgi, faqat lotin harf/raqam.');
      return;
    }
    if (regPass.length < 4) {
      setRegErr('Parol kamida 4 belgidan iborat bo\'lsin.');
      return;
    }
    if (regPass !== regPass2) {
      setRegErr('Parollar mos kelmadi.');
      return;
    }
    try {
      await register(biz, u, regPass);
    } catch (ex) {
      setRegErr(ex.message || 'Xatolik yuz berdi');
    }
  };

  const handlePwInput = (e) => {
    const v = e.target.value;
    setRegPass(v);
    let score = 0;
    if (v.length >= 4) score += 25;
    if (v.length >= 8) score += 25;
    if (/[0-9]/.test(v)) score += 25;
    if (/[A-Z]/.test(v) || /[^a-zA-Z0-9]/.test(v)) score += 25;
    setPwStrength(score);
  };

  return (
    <div id="authScreen" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="auth-container-grid">
        
        {/* Left Side: Product Value Pitch & Features */}
        <div className="auth-pitch-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="lock-emblem" style={{ margin: 0 }}>QD</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--ink)' }}>
                Qarz Daftari
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Moliyaviy intizom va nazorat platformasi
              </div>
            </div>
          </div>

          <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: '1.6', marginBottom: '20px' }}>
            Qogʻoz daftarlar yoʻqoladi, chalkash yozuvlar esa tushunmovchilik va moliyaviy yoʻqotishlarga olib keladi. <b>"Qarz Daftari"</b> — bu shaxsiy va biznes hisob-kitoblaringizni toʻliq raqamlashtiradigan zamonaviy tizim.
          </p>

          <div className="pitch-features-grid">
            <div className="pitch-feat-item">
              <div className="feat-icon">📋</div>
              <div>
                <b>Interaktiv mijozlar kartasi</b>
                <p>Har bir qarzdor uchun alohida visual kartochka va to'liq to'lov tarixi.</p>
              </div>
            </div>

            <div className="pitch-feat-item">
              <div className="feat-icon">🛍️</div>
              <div>
                <b>Nasiya savdo & Mahsulotlar</b>
                <p>Mahsulotlar nomi, miqdori va narxi bilan batafsil qarz hisobi.</p>
              </div>
            </div>

            <div className="pitch-feat-item">
              <div className="feat-icon">🧾</div>
              <div>
                <b>Chek & Kvitansiya generatsiyasi</b>
                <p>1-klikda termal (80mm) va standart chek chop etish, Telegramga yuborish.</p>
              </div>
            </div>

            <div className="pitch-feat-item">
              <div className="feat-icon">🔒</div>
              <div>
                <b>Toʻliq moliyaviy xavfsizlik</b>
                <p>Qog'ozdek yirtilmaydi, ma'lumotlar xavfsiz va doimo qo'lingizda.</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '22px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              💡 Kimlar uchun moʻljallangan?
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}>🏪 Doʻkon va savdo</span>
              <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}>💼 Frilanserlar va ustalar</span>
              <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}>👥 Shaxsiy moliya</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="lock-card" style={{ margin: 0 }}>
          <div className="lock-title" style={{ fontSize: '20px' }}>
            {activeTab === 'login' ? 'Tizimga kirish' : 'Ro\'yxatdan o\'tish'}
          </div>
          <div className="lock-sub">
            {activeTab === 'login' ? 'Hisob ma\'lumotlaringizni kiriting.' : 'Yangi biznes hisobingizni bir necha sekundda yarating.'}
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => { setActiveTab('login'); setLoginErr(''); setRegErr(''); }}
            >
              Kirish
            </button>
            <button
              type="button"
              className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => { setActiveTab('register'); setLoginErr(''); setRegErr(''); }}
            >
              Ro'yxatdan o'tish
            </button>
          </div>

          {activeTab === 'login' && (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <div className="form-field">
                <label>Foydalanuvchi nomi</label>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="masalan: aziz_biznes"
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Parol</label>
                <div className="pw-wrap">
                  <input
                    type={loginShowPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="pw-eye"
                    onClick={() => setLoginShowPw(!loginShowPw)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>
              {loginErr && <div className="lock-error">{loginErr}</div>}
              <button type="submit" className="btn btn-gold btn-block" style={{ marginTop: '10px' }}>
                🚀 Kirish
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <div className="form-field">
                <label>Biznes / do'kon / shaxs nomi</label>
                <input
                  type="text"
                  placeholder="masalan: Aziz Savdo yoki Umar"
                  value={regBiz}
                  onChange={e => setRegBiz(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Foydalanuvchi nomi (login)</label>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="lotin harflari, bo'shliqsiz"
                  value={regUser}
                  onChange={e => setRegUser(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Parol</label>
                <div className="pw-wrap">
                  <input
                    type={regShowPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="kamida 4 belgi"
                    value={regPass}
                    onChange={handlePwInput}
                    required
                  />
                  <button
                    type="button"
                    className="pw-eye"
                    onClick={() => setRegShowPw(!regShowPw)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
                <div className="strength-bar">
                  <i style={{
                    width: `${pwStrength}%`,
                    background: pwStrength < 50 ? 'var(--rust)' : pwStrength < 100 ? 'var(--gold)' : 'var(--teal)'
                  }} />
                </div>
              </div>
              <div className="form-field">
                <label>Parolni tasdiqlang</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={regPass2}
                  onChange={e => setRegPass2(e.target.value)}
                  required
                />
              </div>
              {regErr && <div className="lock-error">{regErr}</div>}
              <button type="submit" className="btn btn-gold btn-block" style={{ marginTop: '10px' }}>
                ✨ Hisob yaratish
              </button>
              <div className="auth-hint">
                🔒 Barcha ma'lumotlar xavfsiz shifrlanadi.
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
