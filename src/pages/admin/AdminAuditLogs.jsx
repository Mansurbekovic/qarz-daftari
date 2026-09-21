import React, { useState, useEffect } from 'react';
import { getApiBase, fmtDate } from '../../utils/helpers';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/admin/audit-logs?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Could not fetch audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(term) ||
      (log.username || '').toLowerCase().includes(term) ||
      (log.details || '').toLowerCase().includes(term) ||
      (log.ipAddress || '').toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <input
          type="text"
          placeholder="Jurnalda qidirish (amal, foydalanuvchi, IP)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            minWidth: '280px',
            padding: '10px 16px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff'
          }}
        />
        <button
          className="btn btn-outline btn-sm"
          onClick={fetchLogs}
          disabled={loading}
        >
          {loading ? 'Yangilanmoqda...' : '🔄 Yangilash'}
        </button>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="section-title" style={{ margin: 0, fontSize: '16px' }}>
            🛡️ Xavfsizlik va Ma'muriy Audit Jurnali (Audit Trail)
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
            Tizimdagi barcha muhim operatsiyalar (baza tozalash, backup, parollar tiklanishi, e'lonlar) qat'iy qayd etiladi.
          </div>
        </div>

        <div className="admin-table-wrap" style={{ maxHeight: '550px', overflowY: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vaqti</th>
                <th>Foydalanuvchi</th>
                <th>Amal (Action)</th>
                <th>Tafsilotlar</th>
                <th>IP Manzil</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.5)' }}>
                    {loading ? 'Yuklanmoqda...' : 'Audit yozuvlari topilmadi'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.7)' }}>
                      {log.createdAt ? fmtDate(log.createdAt) : '—'}
                    </td>
                    <td>
                      <b style={{ color: 'var(--gold, #E5A93C)' }}>{log.username || 'system'}</b>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: log.action?.includes('DATABASE') ? 'rgba(59, 130, 246, 0.2)' : log.action?.includes('RESET') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: log.action?.includes('DATABASE') ? '#60a5fa' : log.action?.includes('RESET') ? '#f87171' : '#fff'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                      {log.details || '—'}
                    </td>
                    <td style={{ fontSize: '12px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
