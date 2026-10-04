import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { getApiBase, fmtDate, exportToCSV, todayISO } from '../../utils/helpers';
import { storage } from '../../utils/storage';
import { SYSTEM_LOGS_KEY } from '../../utils/constants';

export default function AdminAuditLogs() {
  const { systemLogs } = useApp();
  const toast = useToast();

  const [backendLogs, setBackendLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'tx' | 'delete' | 'auth' | 'danger'

  const fetchBackendLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/admin/audit-logs?limit=200`);
      if (res.ok) {
        const data = await res.json();
        setBackendLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Backend audit logs offline, using local logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendLogs();
  }, []);

  // Merge local systemLogs with backendLogs
  const allLogs = [];
  const seenIds = new Set();

  (systemLogs || []).forEach(l => {
    const id = l.id || `${l.timestamp}-${l.type}`;
    if (!seenIds.has(id)) {
      seenIds.add(id);
      allLogs.push({
        id,
        createdAt: l.timestamp,
        username: l.username || 'system',
        action: l.type,
        details: l.details,
        severity: l.severity || 'info',
        source: 'local'
      });
    }
  });

  backendLogs.forEach(l => {
    const id = `b_${l.id}`;
    if (!seenIds.has(id)) {
      seenIds.add(id);
      allLogs.push({
        id,
        createdAt: l.createdAt,
        username: l.username || 'system',
        action: l.action,
        details: l.details,
        severity: l.action?.includes('DANGER') || l.action?.includes('RESET') ? 'danger' : 'info',
        source: 'server',
        ipAddress: l.ipAddress
      });
    }
  });

  // Sort by date newest first
  allLogs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // Filter by category
  let filtered = allLogs;

  if (filterType === 'tx') {
    filtered = filtered.filter(l =>
      l.action === 'ADD_DEBT' || l.action === 'ADD_PAYMENT' || l.action?.includes('TX')
    );
  } else if (filterType === 'delete') {
    filtered = filtered.filter(l =>
      l.action?.includes('DELETE') || l.action?.includes('WIPE')
    );
  } else if (filterType === 'auth') {
    filtered = filtered.filter(l =>
      l.action?.includes('LOGIN') || l.action?.includes('REGISTER') || l.action?.includes('LOGOUT')
    );
  } else if (filterType === 'danger') {
    filtered = filtered.filter(l =>
      l.severity === 'danger' || l.severity === 'warning' || l.action?.includes('BLOCK') || l.action?.includes('EXCESSIVE')
    );
  }

  // Filter by search
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(l =>
      (l.username || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q)
    );
  }

  const handleExportCSV = () => {
    const headers = ['Vaqti', 'Foydalanuvchi', 'Amal (Action)', 'Darajasi', 'Tafsilotlar'];
    const rows = filtered.map(l => [
      l.createdAt ? fmtDate(l.createdAt) : '',
      l.username,
      l.action,
      l.severity,
      l.details
    ]);
    exportToCSV(headers, rows, `audit-jurnali-${todayISO()}.csv`);
    toast('Audit jurnali CSV formatida yuklab olindi');
  };

  const handleClearLocalLogs = () => {
    if (window.confirm("Barcha lokal audit loglarini tozalamoqchimisiz?")) {
      storage.set(SYSTEM_LOGS_KEY, JSON.stringify([]), false);
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Info Banner */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
            🛡️ Xavfsizlik va Harakatlar Audit Jurnali (Activity & Security Trail)
          </h3>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
            Kim qachon qarz kiritgani, to'lov olgani, o'chirgani yoki tizimga kirganini to'liq monitoring qilish
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn btn-outline btn-sm" onClick={fetchBackendLogs} disabled={loading}>
            {loading ? 'Yangilanmoqda...' : '🔄 Yangilash'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
            📥 CSV Eksport
          </button>
          <button className="btn btn-outline btn-sm" style={{ color: '#E04836' }} onClick={handleClearLocalLogs}>
            🗑️ Tozalash
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <input
          type="text"
          placeholder="🔍 Foydalanuvchi, amal yoki tafsilot bo'yicha qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '260px',
            padding: '9px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            fontSize: '13px'
          }}
        />

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`chip ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            Barchasi ({allLogs.length})
          </button>
          <button
            type="button"
            className={`chip ${filterType === 'tx' ? 'active' : ''}`}
            onClick={() => setFilterType('tx')}
          >
            ➕ Qarz & To'lovlar
          </button>
          <button
            type="button"
            className={`chip ${filterType === 'delete' ? 'active' : ''}`}
            onClick={() => setFilterType('delete')}
          >
            🗑️ O'chirishlar
          </button>
          <button
            type="button"
            className={`chip ${filterType === 'auth' ? 'active' : ''}`}
            onClick={() => setFilterType('auth')}
          >
            🔐 Kirishlar
          </button>
          <button
            type="button"
            className={`chip ${filterType === 'danger' ? 'active' : ''}`}
            onClick={() => setFilterType('danger')}
          >
            🚨 Xavfli hodisalar
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Vaqti</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Foydalanuvchi</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Amal Turi</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Batafsil Tafsilot</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Darajasi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                    Mos audit yozuvlari topilmadi
                  </td>
                </tr>
              ) : (
                filtered.map(l => {
                  const isDanger = l.severity === 'danger' || l.action?.includes('BLOCK') || l.action?.includes('EXCESSIVE');
                  const isWarning = l.severity === 'warning' || l.action?.includes('DELETE');
                  const isSuccess = l.action === 'ADD_PAYMENT' || l.action === 'LOGIN_SUCCESS';

                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {l.createdAt ? fmtDate(l.createdAt) : '—'}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <b style={{ color: l.username === 'admin' ? 'var(--gold)' : 'var(--ink)' }}>
                          {l.username || 'system'}
                        </b>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isDanger ? 'rgba(224, 72, 54, 0.15)' : isWarning ? 'rgba(212, 160, 23, 0.15)' : isSuccess ? 'rgba(31, 110, 92, 0.15)' : 'var(--surface-2)',
                          color: isDanger ? '#E04836' : isWarning ? 'var(--gold)' : isSuccess ? '#1F6E5C' : 'var(--muted)'
                        }}>
                          {l.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--ink)', fontSize: '12.5px' }}>
                        {l.details || '—'}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: isDanger ? '#E04836' : isWarning ? 'var(--gold)' : '#1F6E5C'
                        }}>
                          {isDanger ? '🔴 XAVF' : isWarning ? '🟡 OGOHLIK' : '🟢 ODDIY'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
