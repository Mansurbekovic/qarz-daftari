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
    <div id="authScreen">
      <div className="lock-card">
        <div className="lock-emblem">QD</div>
        <div className="lock-title">Qarz Daftari</div>
        <div className="lock-sub">
          {activeTab === 'login' ? 'Hisobingizga kiring.' : 'Yangi biznes hisobi yarating.'}
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
            <div className="lock-error">{loginErr}</div>
            <button type="submit" className="btn btn-gold btn-block">Kirish</button>
          </form>
        )}

        {activeTab === 'register' && (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <div className="form-field">
              <label>Biznes / do'kon nomi</label>
              <input
                type="text"
                placeholder="masalan: Aziz Mobile"
                value={regBiz}
                onChange={e => setRegBiz(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Foydalanuvchi nomi</label>
              <input
                type="text"
                autoComplete="username"
                placeholder="lotin harflari, bo'shliqsiz"
                value={regUser}
                onChange={e => setRegUser(e.target.value)}
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
              />
            </div>
            <div className="lock-error">{regErr}</div>
            <button type="submit" className="btn btn-gold btn-block">Hisob yaratish</button>
            <div className="auth-hint">
              Ma'lumotlaringiz faqat shu qurilmadagi shaxsiy xotirangizda, parolingiz esa xesh (shifrlangan) ko'rinishda saqlanadi.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
