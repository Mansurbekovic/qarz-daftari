import React from 'react';

export default function NotificationCenterModal({ notifications, onClose, onClearAll }) {
  
  const getIcon = (type) => {
    switch (type) {
      case 'payment': return '💰';
      case 'debt': return '📋';
      case 'overdue': return '⚠️';
      case 'admin': return '🛡️';
      case 'system': return '🔔';
      default: return '🔔';
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} kun oldin`;
    if (hours > 0) return `${hours} soat oldin`;
    if (minutes > 0) return `${minutes} daqiqa oldin`;
    return 'hoziroq';
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: '60px',
        right: '20px',
        width: '320px',
        maxHeight: '400px',
        background: 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#fff'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Bildirishnomalar</h3>
        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', opacity: 0.7 }}
        >
          &times;
        </button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '10px 0' }}>
        {notifications && notifications.length > 0 ? (
          notifications.map(notif => (
            <div 
              key={notif.id}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px 15px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: notif.read ? 'transparent' : 'rgba(74, 222, 128, 0.05)',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ fontSize: '20px', display: 'flex', alignItems: 'center' }}>
                {getIcon(notif.type)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontSize: '14px', lineHeight: '1.4' }}>
                  {notif.message}
                </p>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  {getTimeAgo(notif.timestamp)}
                </span>
              </div>
              {!notif.read && (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', alignSelf: 'center' }} />
              )}
            </div>
          ))
        ) : (
          <div style={{ padding: '30px 15px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            Hech qanday bildirishnoma yo'q
          </div>
        )}
      </div>

      {notifications && notifications.length > 0 && (
        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={onClearAll}
            style={{
              width: '100%',
              padding: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            Barchasini o'qilgan deb belgilash
          </button>
        </div>
      )}
    </div>
  );
}
