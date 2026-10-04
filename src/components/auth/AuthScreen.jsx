import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function AuthScreen() {
  const { login, register, accounts } = useApp();
  const [isRegister, setIsRegister] = useState(accounts.length === 0);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!username.trim()) throw new Error('Foydalanuvchi nomini kiriting.');
        if (!email.trim() || !email.includes('@')) throw new Error('To\'g\'ri email kiriting.');
        if (!password || password.length < 4) throw new Error('Parol kamida 4 ta belgidan iborat bo\'lsin.');
        await register(username, email, password);
      } else {
        if (!username.trim()) throw new Error('Username yoki emailingizni kiriting.');
        if (!password) throw new Error('Parolingizni kiriting.');
        await login(username, password);
      }
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #091c13 0%, #05100a 100%)',
      padding: '20px',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        padding: '28px 24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Logo and title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #D4A017 0%, #8A6109 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 800,
            color: '#fff',
            marginBottom: '12px',
            boxShadow: '0 8px 20px rgba(212, 160, 23, 0.35)'
          }}>
            QD
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Qarz Daftari
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', margin: 0 }}>
            {isRegister ? 'Yangi hisob yaratish' : 'Hisobingizga kiring'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            style={{
              flex: 1,
              padding: '9px 0',
              border: 'none',
              borderRadius: '9px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              background: !isRegister ? '#D4A017' : 'transparent',
              color: !isRegister ? '#fff' : 'rgba(255, 255, 255, 0.6)',
              transition: 'all 0.15s ease'
            }}
          >
            Kirish
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            style={{
              flex: 1,
              padding: '9px 0',
              border: 'none',
              borderRadius: '9px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              background: isRegister ? '#D4A017' : 'transparent',
              color: isRegister ? '#fff' : 'rgba(255, 255, 255, 0.6)',
              transition: 'all 0.15s ease'
            }}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
              {isRegister ? 'Foydalanuvchi nomi (Login)' : 'Foydalanuvchi nomi yoki Email'}
            </label>
            <input
              type="text"
              required
              placeholder={isRegister ? 'masalan: ali' : 'login yoki email'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                Elektron pochta (Email)
              </label>
              <input
                type="email"
                required
                placeholder="masalan: ali@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
              Parol
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: '4px',
                  fontSize: '15px'
                }}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(224, 72, 54, 0.15)',
              border: '1px solid #E04836',
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '12.5px',
              color: '#ff8578',
              lineHeight: '1.4'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #D4A017 0%, #B8820B 100%)',
              color: '#fff',
              fontSize: '14.5px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(212, 160, 23, 0.4)',
              marginTop: '6px',
              transition: 'transform 0.15s ease'
            }}
          >
            {loading ? 'Tekshirilmoqda...' : isRegister ? 'Ro\'yxatdan o\'tish' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
