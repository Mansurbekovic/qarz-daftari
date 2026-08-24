import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { fmtMoney, fmtDate, generateContractNumber, formatPassport } from '../../utils/helpers';

export default function ContractModal({ client, defaultAmount = 0, defaultNote = '', onClose }) {
  const { db, saveContract } = useApp();
  const { toast } = useToast();

  const [contractNo] = useState(generateContractNumber());
  const [contractDate, setContractDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });

  // Lender Details (Qarz beruvchi)
  const [lenderName, setLenderName] = useState(db?.businessName || 'Do\'kon / Kreditor');
  const [lenderPhone, setLenderPhone] = useState(db?.phone || '');
  const [lenderAddress, setLenderAddress] = useState(db?.address || '');
  const [lenderPassport, setLenderPassport] = useState(db?.passport || '');

  // Borrower Details (Qarzdor / Qarz oluvchi)
  const [borrowerName, setBorrowerName] = useState(client?.name || '');
  const [borrowerPhone, setBorrowerPhone] = useState(client?.phone || '');
  const [borrowerAddress, setBorrowerAddress] = useState(client?.address || '');
  const [borrowerPassport, setBorrowerPassport] = useState(client?.passport || '');

  // Loan terms
  const [amount, setAmount] = useState(defaultAmount || '');
  const [currency] = useState(db?.currency || 'so\'m');
  const [purpose, setPurpose] = useState(defaultNote || 'Tovar va mahsulotlar uchun nasiya / qarz');
  const [penaltyPercent, setPenaltyPercent] = useState('0.1');

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    if (!amount || Number(amount) <= 0) {
      toast('Qarz summasini kiriting', 'error');
      return;
    }
    const contract = {
      contractNo,
      date: contractDate,
      dueDate,
      clientId: client?.id || null,
      lender: { name: lenderName, phone: lenderPhone, address: lenderAddress, passport: lenderPassport },
      borrower: { name: borrowerName, phone: borrowerPhone, address: borrowerAddress, passport: borrowerPassport },
      amount: Number(amount),
      currency,
      purpose,
      penaltyPercent: Number(penaltyPercent) || 0,
      status: 'active'
    };
    saveContract(contract);
    toast('Shartnoma saqlandi');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal contract-modal" style={{ maxWidth: '840px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head no-print">
          <h3>📑 Qarz Tilxati & Shartnomasi</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" className="btn btn-gold btn-sm" onClick={handlePrint}>
              🖨️ Chop etish / PDF
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
              💾 Saqlash
            </button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', padding: '20px' }}>
          {/* Printable Document Container */}
          <div id="printable-contract" className="contract-paper">
            {/* Header */}
            <div className="contract-header">
              <div className="contract-title">QARZ SHARTNOMASI VA TILXAT</div>
              <div className="contract-number">№ {contractNo}</div>
              <div className="contract-subdate">
                <span>Tuzilgan joyi: {lenderAddress || 'Toshkent shahri'}</span>
                <span>Sana: {fmtDate(contractDate)} yil</span>
              </div>
            </div>

            <hr className="contract-divider" />

            {/* Preamble */}
            <p className="contract-text">
              Biz, quyida imzo chekuvchilar:
            </p>

            <p className="contract-text">
              <strong>1. Qarz beruvchi:</strong>{' '}
              <input
                type="text"
                className="contract-inline-input"
                value={lenderName}
                onChange={e => setLenderName(e.target.value)}
                placeholder="F.I.SH / Tashkilot nomi"
              />
              , Pasport / ID: {' '}
              <input
                type="text"
                className="contract-inline-input"
                style={{ width: '130px' }}
                value={lenderPassport}
                onChange={e => setLenderPassport(formatPassport(e.target.value))}
                placeholder="AA 1234567"
              />
              , Yashash manzili:{' '}
              <input
                type="text"
                className="contract-inline-input"
                value={lenderAddress}
                onChange={e => setLenderAddress(e.target.value)}
                placeholder="Manzil"
              />
              , Telefon:{' '}
              <input
                type="text"
                className="contract-inline-input"
                style={{ width: '130px' }}
                value={lenderPhone}
                onChange={e => setLenderPhone(e.target.value)}
                placeholder="+998..."
              />
              , bir tomondan, va
            </p>

            <p className="contract-text">
              <strong>2. Qarz oluvchi (Qarzdor):</strong>{' '}
              <input
                type="text"
                className="contract-inline-input"
                value={borrowerName}
                onChange={e => setBorrowerName(e.target.value)}
                placeholder="Mijoz F.I.SH"
              />
              , Pasport / ID:{' '}
              <input
                type="text"
                className="contract-inline-input"
                style={{ width: '130px' }}
                value={borrowerPassport}
                onChange={e => setBorrowerPassport(formatPassport(e.target.value))}
                placeholder="AA 1234567"
              />
              , Yashash manzili:{' '}
              <input
                type="text"
                className="contract-inline-input"
                value={borrowerAddress}
                onChange={e => setBorrowerAddress(e.target.value)}
                placeholder="Yashash manzili"
              />
              , Telefon:{' '}
              <input
                type="text"
                className="contract-inline-input"
                style={{ width: '130px' }}
                value={borrowerPhone}
                onChange={e => setBorrowerPhone(e.target.value)}
                placeholder="+998..."
              />
              , ikkinchi tomondan, ushbu shartnomani quyidagilar haqida tuzdik:
            </p>

            {/* Terms Articles */}
            <div className="contract-clause">
              <h4>1. Shartnoma predmeti va qarz summasi</h4>
              <p>
                1.1. Qarz beruvchi Qarz oluvchiga{' '}
                <strong>
                  <input
                    type="number"
                    className="contract-inline-input"
                    style={{ width: '150px', fontWeight: 'bold' }}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                  />{' '}
                  {currency}
                </strong>{' '}
                ({fmtMoney(Number(amount) || 0, currency)}) miqdorida qarz/nasiya summasini berdi, Qarz oluvchi esa ushbu summani to'liq qabul qilib olganligini tasdiqlaydi.
              </p>
              <p>
                1.2. Qarz maqsadi:{' '}
                <input
                  type="text"
                  className="contract-inline-input"
                  style={{ width: '320px' }}
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                />
              </p>
            </div>

            <div className="contract-clause">
              <h4>2. Qarzni qaytarish muddati va tartibi</h4>
              <p>
                2.1. Qarz oluvchi qarz summasini to'liq hajmda{' '}
                <strong>
                  <input
                    type="date"
                    className="contract-inline-input"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                  />
                </strong>{' '}
                yilgacha Qarz beruvchiga qaytarish majburiyatini oladi.
              </p>
              <p>
                2.2. Qarz summasi belgilangan muddatdan kechiktirilgan har bir kun uchun Qarz oluvchi qarz qoldig'ining{' '}
                <input
                  type="number"
                  step="0.01"
                  className="contract-inline-input"
                  style={{ width: '60px' }}
                  value={penaltyPercent}
                  onChange={e => setPenaltyPercent(e.target.value)}
                />{' '}
                foizi miqdorida penya to'laydi (O'zbekiston Respublikasi FK 736-moddasi).
              </p>
            </div>

            <div className="contract-clause">
              <h4>3. Nizolarni hal etish va boshqa shartlar</h4>
              <p>
                3.1. Ushbu shartnoma bo'yicha kelib chiqadigan nizolar tomonlarning o'zaro kelishuvi bilan, kelishuvga erishilmagan taqdirda esa O'zbekiston Respublikasi qonunchiligiga muvofiq tegishli fuqarolik ishlari bo'yicha sudida ko'rib chiqiladi.
              </p>
              <p>
                3.2. Ushbu tilxat va shartnoma tomonlarning xohish-irodasi bilan, hech qanday majburlashsiz tuzildi va imzolandi.
              </p>
            </div>

            {/* Signatures */}
            <div className="contract-signatures">
              <div className="signature-box">
                <div className="sig-title">Qarz beruvchi:</div>
                <div className="sig-name">{lenderName}</div>
                <div className="sig-line">Imzo: _____________________</div>
              </div>

              <div className="signature-box">
                <div className="sig-title">Qarz oluvchi:</div>
                <div className="sig-name">{borrowerName}</div>
                <div className="sig-line">Imzo: _____________________</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
