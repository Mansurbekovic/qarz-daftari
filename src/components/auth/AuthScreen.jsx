import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function AuthScreen() {
  const { login, register, accounts } = useApp();
  const [isRegister, setIsRegister] = useState(accounts.length === 0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, '', password);
      } else {
        await login(username, password);
      }
    } catch (err) {
      setError(err.message || 'Xatolik');
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
      background: '#fafafa',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '360px',
        background: '#fff',
        border: '1.5px solid #e8e8e8',
        borderRadius: '18px',
        padding: '28px 24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '42px', marginBottom: '8px' }}>📒</div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 4px', color: '#222' }}>Qarz Daftari</h1>
          <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>
            {isRegister ? 'Yangi hisob yarating' : 'Hisobingizga kiring'}
          </p>
        </div>

        {/* Tab */}
        <div style={{ display: 'flex', background: '#f3f3f3', borderRadius: '10px', padding: '3px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            style={{
              flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
              background: !isRegister ? '#D4A017' : 'transparent',
              color: !isRegister ? '#fff' : '#888',
              cursor: 'pointer',
            }}
          >Kirish</button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            style={{
              flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
              background: isRegister ? '#D4A017' : 'transparent',
              color: isRegister ? '#fff' : '#888',
              cursor: 'pointer',
            }}
          >Ro'yxatdan o'tish</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            required
            placeholder="Foydalanuvchi nomi"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{
              padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #ddd',
              fontSize: '14px', background: '#fafafa', outline: 'none',
            }}
          />
          <input
            type="password"
            required
            placeholder="Parol"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #ddd',
              fontSize: '14px', background: '#fafafa', outline: 'none',
            }}
          />

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px',
              padding: '8px 12px', fontSize: '12.5px', color: '#DC2626',
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px', borderRadius: '10px', border: 'none',
              background: '#D4A017', color: '#fff', fontSize: '14px',
              fontWeight: 800, cursor: 'pointer', marginTop: '4px',
            }}
          >
            {loading ? '...' : isRegister ? "Ro'yxatdan o'tish" : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
