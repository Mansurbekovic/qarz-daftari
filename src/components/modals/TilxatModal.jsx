import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { fmtMoney, fmtDate, todayISO, numberToUzbekWords } from '../../utils/helpers';

export default function TilxatModal({ client, amount, dueDate, collateral, onClose }) {
  const { db } = useApp();

  if (!client) return null;

  const debtSum = Number(amount) || 0;
  const wordsSum = numberToUzbekWords(debtSum);
  const currency = db?.currency || "so'm";
  const docNo = `TLX-${Date.now().toString().slice(-6)}`;
  const bizName = db?.businessName || 'Do\'kon / Tashkilot';
  const bizPhone = db?.phone || '';
  const returnDate = dueDate || todayISO();

  const handlePrint = () => {
    window.print();
  };

  const handleShareTelegram = () => {
    const text = `Assalomu alaykum, ${client.name}!\n` +
      `Sizga rasmiy № ${docNo} sonli TILXAT (Qarz majburiyatnomasi) taqdim etildi.\n` +
      `Summa: ${fmtMoney(debtSum, currency)} (${wordsSum})\n` +
      `Qaytarish muddati: ${fmtDate(returnDate)}\n` +
      `Qarz beruvchi: ${bizName}`;
    const link = `https://t.me/share/url?url=${encodeURIComponent(bizName)}&text=${encodeURIComponent(text)}`;
    window.open(link, '_blank');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '640px' }}>
        <div className="modal-head">
          <h3>Rasmiy Tilxat & Qarz Majburiyatnomasi</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
          {/* Printable Document Paper */}
          <div
            id="tilxatDoc"
            style={{
              background: '#fff',
              color: '#111',
              padding: '28px',
              borderRadius: '12px',
              border: '1px solid #ddd',
              fontFamily: 'serif',
              lineHeight: '1.7',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666' }}>
                O'ZBEKISTON RESPUBLIKASI FUQAROLIK KODEKSI (732-736 MODDALAR)
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, marginTop: '4px', textTransform: 'uppercase' }}>
                T I L X A T
              </h2>
              <div style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>
                Hujjat raqami: <b>№ {docNo}</b> • Sana: <b>{fmtDate(todayISO())}</b>
              </div>
            </div>

            <div style={{ fontSize: '14px', textAlign: 'justify', marginBottom: '16px' }}>
              Men, <b>{client.name}</b> {client.passport ? `(Pasport: ${client.passport})` : ''},
              yashash manzili: <u>{client.address || '___________________________'}</u>,
              telefon raqami: <b>{client.phone || '_________________'}</b>,
              ushbu tilxat orqali tasdiqlaymanki, <b>"{bizName}"</b> nomidan
              naqd pul / tovar shaklida quyidagi summadagi qarzni to'liq qabul qilib oldim:
            </div>

            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              padding: '12px 18px',
              borderRadius: '8px',
              margin: '14px 0',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#0E2419' }}>
                {fmtMoney(debtSum, currency)}
              </div>
              <div style={{ fontSize: '12.5px', fontStyle: 'italic', color: '#444' }}>
                ({wordsSum} {currency})
              </div>
            </div>

            <div style={{ fontSize: '14px', textAlign: 'justify', marginBottom: '16px' }}>
              Mazkur qarz summasini hech qanday bahona va kechiktirishlarsiz, to'liq hajmda
              <b> {fmtDate(returnDate)}</b> kuniga qadar qaytarish majburiyatini o'z zimmamga olaman.
              Agar belgilangan muddatda to'lov amalga oshirilmasa, O'zbekiston Respublikasining
              amaldagi qonunchiligi doirasida javobgarlikka tortilishim haqida ogohlantirildim.
            </div>

            {collateral && (
              <div style={{ fontSize: '13px', background: '#fff8e6', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ffd591', marginBottom: '16px' }}>
                <b>Garov ta'minoti:</b> Ushbu qarz majburiyati ta'minoti sifatida <u>{collateral.title}</u> (baholangan qiymati: {fmtMoney(collateral.estimatedValue, currency)}) garovga topshirildi.
                {collateral.guarantorName && ` Kafil: ${collateral.guarantorName} (${collateral.guarantorPhone}).`}
              </div>
            )}

            {/* Signature Block */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Qarz oluvchi (Mijoz):</div>
                <div style={{ fontWeight: 800, fontSize: '13.5px', marginTop: '4px' }}>{client.name}</div>
                <div style={{ marginTop: '28px', borderBottom: '1px solid #333', width: '80%' }} />
                <div style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>(Imzo)</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Qarz beruvchi (Biznes):</div>
                <div style={{ fontWeight: 800, fontSize: '13.5px', marginTop: '4px' }}>{bizName}</div>
                <div style={{ marginTop: '28px', borderBottom: '1px solid #333', width: '80%' }} />
                <div style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>(Imzo / Muhr)</div>
              </div>
            </div>

            {/* QR Verification Note */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '12px', borderTop: '1px dashed #ddd', fontSize: '11px', color: '#777' }}>
              <span>Elektron identifikator: {docNo}</span>
              <span>Qarz Daftari Enterprise tomonidan tasdiqlangan ✓</span>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Yopish
            </button>
            <button type="button" className="btn btn-outline" onClick={handleShareTelegram}>
              ✈️ Telegramga yuborish
            </button>
            <button type="button" className="btn btn-gold" onClick={handlePrint}>
              🖨️ A4 Chop etish (Print)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
