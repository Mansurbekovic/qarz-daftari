import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { sha256 } from '../../utils/crypto';

export default function LockScreen() {
  const { pinMode, setPinMode, enterApp, db, updateDB, wipeAndResetPin } = useApp();
  const toast = useToast();
  const [pinBuffer, setPinBuffer] = useState('');
  const [pendingPin, setPendingPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showWipeModal, setShowWipeModal] = useState(false);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const handleKeyClick = async (key) => {
    if (key === '⌫') {
      setPinBuffer(prev => prev.slice(0, -1));
      return;
    }

    if (pinBuffer.length >= 4) return;
    const nextBuffer = pinBuffer + key;
    setPinBuffer(nextBuffer);

    if (nextBuffer.length === 4) {
      if (pinMode === 'setup1') {
        setPendingPin(nextBuffer);
        setPinBuffer('');
        setPinMode('setup2');
      } else if (pinMode === 'setup2') {
        if (nextBuffer === pendingPin) {
          const hash = await sha256(nextBuffer);
          updateDB(prev => ({ ...prev, pinHash: hash }));
          toast("PIN-kod muvaffaqiyatli o'rnatildi");
          enterApp();
        } else {
          setErrorMsg("PIN-kodlar mos kelmadi. Qaytadan urinib ko'ring.");
          triggerShake();
          setPinBuffer('');
          setPendingPin('');
          setPinMode('setup1');
        }
      } else if (pinMode === 'enter') {
        const hash = await sha256(nextBuffer);
        if (hash === db.pinHash) {
          setErrorMsg('');
          enterApp();
        } else {
          setErrorMsg("Noto'g'ri PIN-kod. Qaytadan urinib ko'ring.");
          triggerShake();
          setTimeout(() => setPinBuffer(''), 350);
        }
      }
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <div id="lockScreen">
      <div className="lock-card">
        <div className="lock-emblem">QD</div>
        <div className="lock-title">
          {pinMode === 'setup1' && 'Xush kelibsiz'}
          {pinMode === 'setup2' && 'PIN-kodni tasdiqlang'}
          {pinMode === 'enter' && 'Qulflangan'}
        </div>
        <div className="lock-sub">
          {pinMode === 'setup1' && "Ma'lumotlaringizni himoya qilish uchun 4 xonali PIN-kod o'rnating."}
          {pinMode === 'setup2' && "Xavfsizlik uchun PIN-kodni yana bir marta kiriting."}
          {pinMode === 'enter' && "Davom etish uchun PIN-kodingizni kiriting."}
        </div>

        <div className="pin-dots">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`pin-dot${idx < pinBuffer.length ? ' filled' : ''}${isShaking ? ' shake' : ''}`}
            />
          ))}
        </div>

        <div className="lock-error">{errorMsg}</div>

        <div className="pin-pad">
          {keys.map((k, i) => (
            k === '' ? (
              <button key={i} className="pin-key" style={{ visibility: 'hidden' }} />
            ) : (
              <button
                key={i}
                type="button"
                className={`pin-key${k === '⌫' ? ' wide' : ''}`}
                onClick={() => handleKeyClick(k)}
              >
                {k}
              </button>
            )
          ))}
        </div>

        {pinMode === 'enter' && (
          <div className="lock-footer">
            <a onClick={() => setShowWipeModal(true)}>PIN-kodni unutdingizmi? Ma'lumotlarni tozalash</a>
          </div>
        )}
      </div>

      {showWipeModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>Diqqat!</h3>
              <button className="modal-close" onClick={() => setShowWipeModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', lineHeight: '1.6', marginBottom: '16px' }}>
                PIN-kodni tiklash imkoni yo'q. Davom etsangiz, <b>ushbu hisobdagi barcha mijozlar, tranzaksiyalar va kartalar</b> butunlay o'chiriladi. Bu amalni bekor qilib bo'lmaydi.
              </p>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowWipeModal(false)}>Bekor qilish</button>
                <button
                  className="btn btn-danger"
                  onClick={async () => {
                    setShowWipeModal(false);
                    await wipeAndResetPin();
                  }}
                >
                  Ha, hammasini o'chirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
