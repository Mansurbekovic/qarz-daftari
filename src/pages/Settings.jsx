import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { ACCENTS } from '../utils/constants';

export default function Settings({ onLogoutClick }) {
  const {
    db, currentUser, updateSettings, toggleTheme, setAccent,
    changePin, changePassword, deleteAccount, wipeData,
    exportData, importData, exportCards, importCards, navigate, resetAutoLock
  } = useApp();
  const toast = useToast();

  const [bizNameInput, setBizNameInput] = useState(db.businessName);
  const [currencySelect, setCurrencySelect] = useState(db.currency || "so'm");

  // Change PIN modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [curPin, setCurPin] = useState('');
  const [newPin1, setNewPin1] = useState('');
  const [newPin2, setNewPin2] = useState('');

  // Change Password modal state
  const [showPassModal, setShowPassModal] = useState(false);
  const [curPass, setCurPass] = useState('');
  const [newPass1, setNewPass1] = useState('');
  const [newPass2, setNewPass2] = useState('');

  // Delete account modal state
  const [showDelAccModal, setShowDelAccModal] = useState(false);
  const [delAccPass, setDelAccPass] = useState('');

  // Wipe data modal state
  const [showWipeModal, setShowWipeModal] = useState(false);

  const handleSaveBizName = () => {
    const name = bizNameInput.trim() || 'Mening biznesim';
    updateSettings({ businessName: name, currency: currencySelect });
    toast('Saqlandi');
  };

  const handleAutoLockChange = (e) => {
    const mins = Number(e.target.value);
    updateSettings({ autoLockMinutes: mins });
    toast('Sozlama yangilandi');
  };

  const handleChangePin = async () => {
    if (!/^\d{4}$/.test(curPin) || !/^\d{4}$/.test(newPin1) || !/^\d{4}$/.test(newPin2)) {
      toast('4 xonali raqam kiriting', 'error');
      return;
    }
    if (newPin1 !== newPin2) {
      toast('Yangi PIN-kodlar mos emas', 'error');
      return;
    }
    try {
      await changePin(curPin, newPin1);
      setShowPinModal(false);
      setCurPin(''); setNewPin1(''); setNewPin2('');
      toast("PIN-kod muvaffaqiyatli yangilandi");
    } catch (ex) {
      toast(ex.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleChangePassword = async () => {
    if (newPass1.length < 4) {
      toast('Yangi parol kamida 4 belgidan iborat bo\'lsin', 'error');
      return;
    }
    if (newPass1 !== newPass2) {
      toast('Yangi parollar mos emas', 'error');
      return;
    }
    try {
      await changePassword(curPass, newPass1);
      setShowPassModal(false);
      setCurPass(''); setNewPass1(''); setNewPass2('');
      toast("Parol muvaffaqiyatli yangilandi");
    } catch (ex) {
      toast(ex.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(delAccPass);
    } catch (ex) {
      toast(ex.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.clients || !data.transactions) throw new Error('format');
        importData(data);
        toast("Ma'lumotlar muvaffaqiyatli tiklandi");
        navigate('dashboard');
      } catch (err) {
        toast('Fayl formati noto\'g\'ri', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleImportCardsFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.cards)) throw new Error('format');
        importCards(data.cards);
        toast(`${data.cards.length} ta karta import qilindi`);
        navigate('wallet');
      } catch (err) {
        toast('Kartalar fayli formati noto\'g\'ri', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="settings-card">
        <div className="section-title" style={{ marginTop: 0 }}>Biznes ma'lumotlari</div>
        <div className="form-field">
          <label>Biznes nomi</label>
          <input
            type="text"
            value={bizNameInput}
            onChange={e => setBizNameInput(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Valyuta belgisi</label>
          <select value={currencySelect} onChange={e => setCurrencySelect(e.target.value)}>
            <option value="so'm">so'm</option>
            <option value="$">$ (dollar)</option>
            <option value="€">€ (yevro)</option>
            <option value="₽">₽ (rubl)</option>
          </select>
        </div>
        <button className="btn btn-gold btn-sm" onClick={handleSaveBizName}>Saqlash</button>
      </div>

      <div className="settings-card">
        <div className="section-title" style={{ marginTop: 0 }}>Hisob</div>
        <div className="settings-row">
          <div>
            <div className="t">Joriy hisob</div>
            <div className="s">{currentUser}</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onLogoutClick}>Chiqish</button>
        </div>
        <div className="settings-row">
          <div>
            <div className="t">Parolni o'zgartirish</div>
            <div className="s">Kirish parolingizni yangilang</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowPassModal(true)}>O'zgartirish</button>
        </div>
        <div className="settings-row">
          <div>
            <div className="t" style={{ color: 'var(--rust)' }}>Hisobni butunlay o'chirish</div>
            <div className="s">Hisob va barcha ma'lumotlar qaytarib bo'lmas tarzda o'chadi</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDelAccModal(true)}>O'chirish</button>
        </div>
      </div>

      <div className="settings-card">
        <div className="section-title" style={{ marginTop: 0 }}>Xavfsizlik</div>
        <div className="settings-row">
          <div>
            <div className="t">PIN-kodni o'zgartirish</div>
            <div className="s">Ilova kirish kodini yangilang</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowPinModal(true)}>O'zgartirish</button>
        </div>
        <div className="settings-row">
          <div>
            <div className="t">Avtomatik qulflash</div>
            <div className="s">Harakatsizlikdan keyin qulflanish vaqti</div>
          </div>
          <select value={db.autoLockMinutes || 5} onChange={handleAutoLockChange}>
            <option value="1">1 daqiqa</option>
            <option value="5">5 daqiqa</option>
            <option value="15">15 daqiqa</option>
            <option value="30">30 daqiqa</option>
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="t">16+ yosh tasdig'i</div>
            <div className="s">Karta qo'shish uchun berilgan tasdiq</div>
          </div>
          <div className="s">{db.ageConfirmed ? '✓ Tasdiqlangan' : 'Hali tasdiqlanmagan'}</div>
        </div>
      </div>

      <div className="settings-card">
        <div className="section-title" style={{ marginTop: 0 }}>Ko'rinish va bildirishnomalar</div>
        <div className="settings-row">
          <div>
            <div className="t">Tungi rejim</div>
            <div className="s">Ko'zga yoqimli qorong'i tema</div>
          </div>
          <button
            className={`switch ${db.theme === 'dark' ? 'on' : ''}`}
            onClick={toggleTheme}
          />
        </div>
        <div className="settings-row">
          <div>
            <div className="t">Rang jilosi (accent)</div>
            <div className="s">Tugmalar va urg'u rangi</div>
          </div>
          <div className="accent-row">
            {Object.entries(ACCENTS).map(([k, hex]) => (
              <button
                key={k}
                className={`accent-dot ${db.accent === k ? 'on' : ''}`}
                style={{ background: hex }}
                onClick={() => setAccent(k)}
              />
            ))}
          </div>
        </div>
        <div className="settings-row">
          <div>
            <div className="t">Muddati o'tgan qarzlar haqida eslatma</div>
            <div className="s">Bosh sahifada ogohlantirish blokini ko'rsatish</div>
          </div>
          <button
            className={`switch ${db.notifications ? 'on' : ''}`}
            onClick={() => updateSettings({ notifications: !db.notifications })}
          />
        </div>
      </div>

      <div className="settings-card">
        <div className="section-title" style={{ marginTop: 0 }}>Ma'lumotlar</div>
        <div className="settings-row">
          <div>
            <div className="t">Zaxira nusxa yuklab olish</div>
            <div className="s">Mijozlar, tranzaksiyalar va kartalarni JSON fayl sifatida saqlang</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={exportData}>Yuklab olish</button>
        </div>
        <div className="settings-row">
          <div>
            <div className="t">Faqat kartalarni eksport qilish</div>
            <div className="s">Karta ro'yxatini alohida JSON fayl sifatida saqlang</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={exportCards}>Yuklab olish</button>
        </div>
        <div className="settings-row">
          <div>
            <div className="t">Zaxiradan tiklash</div>
            <div className="s">Avval saqlangan to'liq zaxira JSON faylini yuklang</div>
          </div>
          <label className="btn btn-outline btn-sm" style={{ margin: 0 }}>
            Faylni tanlash
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
          </label>
        </div>
        <div className="settings-row">
          <div>
            <div className="t">Kartalarni import qilish</div>
            <div className="s">Oldin eksport qilingan kartalar faylini qo'shing</div>
          </div>
          <label className="btn btn-outline btn-sm" style={{ margin: 0 }}>
            Faylni tanlash
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportCardsFile} />
          </label>
        </div>
        <div className="settings-row">
          <div>
            <div className="t" style={{ color: 'var(--rust)' }}>Barcha ma'lumotlarni o'chirish</div>
            <div className="s">Mijozlar/tranzaksiyalar/kartalar o'chadi, hisob va PIN saqlanib qoladi</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setShowWipeModal(true)}>O'chirish</button>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '12px', marginTop: '20px' }}>
        Qarz Daftari · Ma'lumotlaringiz faqat shu qurilmadagi shaxsiy hisobingizda saqlanadi.
      </div>

      {/* Change PIN Modal */}
      {showPinModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>PIN-kodni o'zgartirish</h3>
              <button className="modal-close" onClick={() => setShowPinModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Joriy PIN-kod</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={curPin}
                  onChange={e => setCurPin(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Yangi PIN-kod</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={newPin1}
                  onChange={e => setNewPin1(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Yangi PIN-kodni tasdiqlang</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={newPin2}
                  onChange={e => setNewPin2(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-gold btn-block" onClick={handleChangePin}>Yangilash</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPassModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>Parolni o'zgartirish</h3>
              <button className="modal-close" onClick={() => setShowPassModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Joriy parol</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={curPass}
                  onChange={e => setCurPass(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Yangi parol</label>
                <input
                  type="password"
                  placeholder="kamida 4 belgi"
                  value={newPass1}
                  onChange={e => setNewPass1(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Yangi parolni tasdiqlang</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPass2}
                  onChange={e => setNewPass2(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-gold btn-block" onClick={handleChangePassword}>Yangilash</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDelAccModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>Hisobni o'chirish</h3>
              <button className="modal-close" onClick={() => setShowDelAccModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>
                Ushbu hisob va unga tegishli <b>barcha</b> mijozlar, tranzaksiyalar hamda kartalar butunlay o'chiriladi. Bu amalni bekor qilib bo'lmaydi.
              </p>
              <div className="form-field">
                <label>Tasdiqlash uchun parolingizni kiriting</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={delAccPass}
                  onChange={e => setDelAccPass(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowDelAccModal(false)}>Bekor qilish</button>
                <button className="btn btn-danger" onClick={handleDeleteAccount}>Hisobni o'chirish</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wipe Data Modal */}
      {showWipeModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>Ishonchingiz komilmi?</h3>
              <button className="modal-close" onClick={() => setShowWipeModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>
                Barcha mijozlar, tranzaksiyalar va kartalar butunlay o'chiriladi. Hisob va PIN-kod saqlanib qoladi.
              </p>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowWipeModal(false)}>Bekor qilish</button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    wipeData();
                    setShowWipeModal(false);
                    toast("Barcha ma'lumotlar o'chirildi");
                    navigate('dashboard');
                  }}
                >
                  Ha, o'chirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
