import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { fmtDate, fmtMoney } from '../../utils/helpers';

export default function AdminSecurityMonitor() {
  const { systemConfig, updateSystemConfigValues, systemLogs, db } = useApp();
  const [logFilter, setLogFilter] = useState('all'); // 'all' | 'danger' | 'warning' | 'info'
  const [maxTxInput, setMaxTxInput] = useState(systemConfig.maxTxAmount || 500000000);

  let filteredLogs = systemLogs.slice();
  if (logFilter !== 'all') {
    filteredLogs = filteredLogs.filter(l => l.severity === logFilter);
  }

  const handleSaveLimits = () => {
    updateSystemConfigValues({ maxTxAmount: Number(maxTxInput) || 500000000 });
  };

  const getSeverityBadge = (severity) => {
    if (severity === 'danger') return <span className="risk-badge high">XAVF</span>;
    if (severity === 'warning') return <span className="risk-badge medium">OGOHLIK</span>;
    return <span className="risk-badge low">INFO</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Anti-Bug & Security Limits Config */}
      <div className="settings-card">
        <div className="section-title" style={{ marginTop: 0 }}>
          🛡️ Anti-Bug & Anti-Abuse (Xavfsizlik qoidalari)
        </div>

        <div className="form-field">
          <label>Maksimal bitta tranzaksiya limiti ({db?.currency || "so'm"})</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number"
              value={maxTxInput}
              onChange={e => setMaxTxInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-gold btn-sm" onClick={handleSaveLimits}>Saqlash</button>
          </div>
          <div className="auth-hint" style={{ marginTop: '4px' }}>
            Hozirgi limit: <b>{fmtMoney(systemConfig.maxTxAmount, db?.currency)}</b>. Undan yuqori summali g'ayritabiiy tranzaksiyalar avtomatik rad etiladi va xavfsizlik jurnaliga yoziladi.
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="t">G'ayritabiiy faollik va tezkor tranzatsiyalarni cheklash (Rate-Limit)</div>
            <div className="s">1 daqiqada 15 tadan ortiq shubhali so'rovlar aniqlanganda profilaktika blokirovkasi</div>
          </div>
          <button
            className={`switch ${systemConfig.blockSuspiciousIps ? 'on' : ''}`}
            onClick={() => updateSystemConfigValues({ blockSuspiciousIps: !systemConfig.blockSuspiciousIps })}
          />
        </div>

        <div className="settings-row">
          <div>
            <div className="t">VPN / Proxy Tarmoq Avto-Nazorat Monitor</div>
            <div className="s">Anonim proksi orqali noqonuniy kirish urinishlarini avtomatik jurnalga qayd etish</div>
          </div>
          <button
            className={`switch ${systemConfig.detectVpnProxy ? 'on' : ''}`}
            onClick={() => updateSystemConfigValues({ detectVpnProxy: !systemConfig.detectVpnProxy })}
          />
        </div>
      </div>

      {/* Security Audit Logs */}
      <div className="settings-card">
        <div className="section-title" style={{ marginTop: 0, justifyContent: 'space-between' }}>
          <span>📜 Real-Vaqt Xavfsizlik Jurnali (Audit Log)</span>
          <div className="chip-group">
            <button
              className={`chip ${logFilter === 'all' ? 'active' : ''}`}
              onClick={() => setLogFilter('all')}
            >
              Barchasi ({systemLogs.length})
            </button>
            <button
              className={`chip ${logFilter === 'danger' ? 'active' : ''}`}
              onClick={() => setLogFilter('danger')}
            >
              Xavfli ({systemLogs.filter(l => l.severity === 'danger').length})
            </button>
            <button
              className={`chip ${logFilter === 'warning' ? 'active' : ''}`}
              onClick={() => setLogFilter('warning')}
            >
              Ogohlik ({systemLogs.filter(l => l.severity === 'warning').length})
            </button>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="empty-state">
            <div className="t">Xavfsizlik yozuvlari yo'q</div>
            <div className="s">Tizim barqaror va xavfsiz holatda ishlamoqda.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
            {filteredLogs.map(log => (
              <div key={log.id} className="log-item">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getSeverityBadge(log.severity)}
                    <span className="log-tag">{log.type}</span>
                    <b style={{ color: 'var(--ink)' }}>{log.username}</b>
                  </div>
                  <div style={{ marginTop: '4px', color: 'var(--ink-2)' }}>
                    {log.details}
                  </div>
                  <div className="log-meta">
                    {fmtDate(log.timestamp)} · {new Date(log.timestamp).toLocaleTimeString('uz-UZ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
