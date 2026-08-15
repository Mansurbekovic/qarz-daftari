import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', textAlign: 'center', padding: '24px', fontFamily: 'sans-serif',
        }}>
          <h2 style={{ marginBottom: '12px' }}>Nimadir xato ketdi</h2>
          <p style={{ marginBottom: '20px', opacity: 0.7 }}>
            Sahifani qayta yuklab ko'ring. Muammo davom etsa, ma'lumotlaringiz saqlanib qoladi.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              background: '#d4a24c', color: '#1a1a1a', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Qayta yuklash
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
