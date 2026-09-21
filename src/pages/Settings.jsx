import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { ACCENTS } from '../utils/constants';
import { getBackendUrl } from '../utils/helpers';

export default function Settings({ onLogoutClick }) {
  const {
    db, currentUser, updateSettings, toggleTheme, setAccent,
    changePin, changePassword, deleteAccount, wipeData,
    exportData, importData, exportCards, importCards, navigate, resetAutoLock
  } = useApp();
  const toast = useToast();

  if (!db) return null;

  const [bizNameInput, setBizNameInput] = useState(db.businessName || '');
  const [bizPhoneInput, setBizPhoneInput] = useState(db.phone || '');
  const [bizAddressInput, setBizAddressInput] = useState(db.address || '');
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

  // Integrations state
  const integrations = db.integrations || {};
  const [eskizEmail, setEskizEmail] = useState(integrations.eskizEmail || '');
  const [eskizPassword, setEskizPassword] = useState(integrations.eskizPassword || '');
  const [eskizFrom, setEskizFrom] = useState(integrations.eskizFrom || '4546');
  const [eskizTestMode, setEskizTestMode] = useState(integrations.eskizTestMode !== undefined ? integrations.eskizTestMode : true);
  const [smsBalance, setSmsBalance] = useState(null);
  const [checkingSms, setCheckingSms] = useState(false);

  const [tgBotToken, setTgBotToken] = useState(integrations.tgBotToken || '');
  const [tgBotUsername, setTgBotUsername] = useState(integrations.tgBotUsername || '');
  const [tgStatus, setTgStatus] = useState(null);
  const [testingTg, setTestingTg] = useState(false);

  const [clickMerchantId, setClickMerchantId] = useState(integrations.clickMerchantId || '');
  const [clickServiceId, setClickServiceId] = useState(integrations.clickServiceId || '');
  const [clickSecretKey, setClickSecretKey] = useState(integrations.clickSecretKey || '');

  const [paymeMerchantId, setPaymeMerchantId] = useState(integrations.paymeMerchantId || '');
  const [paymeSecretKey, setPaymeSecretKey] = useState(integrations.paymeSecretKey || '');

  const handleSaveIntegrations = async () => {
    const newIntegrations = {
      eskizEmail,
      eskizPassword,
      eskizFrom,
      eskizTestMode,
      tgBotToken,
      tgBotUsername,
      clickMerchantId,
      clickServiceId,
      clickSecretKey,
      paymeMerchantId,
      paymeSecretKey
    };
    updateSettings({ integrations: newIntegrations });
    try {
      const backendUrl = getBackendUrl();
      await fetch(`${backendUrl}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eskiz_email: eskizEmail,
          eskiz_password: eskizPassword,
          eskiz_from: eskizFrom,
          eskiz_test_mode: eskizTestMode,
          telegram_bot_token: tgBotToken,
          telegram_bot_username: tgBotUsername,
          click_merchant_id: clickMerchantId,
          click_service_id: clickServiceId,
          click_secret: clickSecretKey,
          payme_merchant_id: paymeMerchantId,
          payme_key: paymeSecretKey
        })
      });
    } catch (e) {
      console.warn('Backend sync failed:', e);
    }
    toast("Integratsiyalar va API sozlamalari saqlandi!");
  };

  const handleCheckSmsBalance = async () => {
    try {
      setCheckingSms(true);
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/sms/balance`);
      const data = await res.json();
      if (data.success) {
        setSmsBalance(data.balance);
        toast(`SMS Balans: ${data.balance} ta SMS mavjud (${data.mode === 'test' ? 'Test rejim' : 'Jonli Eskiz'})`);
      } else {
        toast(data.error || 'Balansni tekshirishda xatolik', 'error');
      }
    } catch (err) {
      toast('Server bilan aloqa yo\'q (offline)', 'info');
      setSmsBalance(1500);
    } finally {
      setCheckingSms(false);
    }
  };

  const handleTestTgBot = async () => {
    if (!tgBotToken) {
      toast('Telegram bot tokenini kiriting', 'error');
      return;
    }
    try {
      setTestingTg(true);
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/telegram/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tgBotToken })
      });
      const data = await res.json();
      if (data.success && data.bot) {
        setTgStatus(`Ulangan: @${data.bot.username} (${data.bot.name})`);
        toast(`Telegram Bot faol: @${data.bot.username}`);
      } else {
        setTgStatus(`Xatolik: ${data.error || 'Token yaroqsiz'}`);
        toast(data.error || 'Token yaroqsiz', 'error');
      }
    } catch (err) {
      toast('Server bilan aloqa yo\'q', 'error');
    } finally {
      setTestingTg(false);
    }
  };

  const handleSaveBizName = () => {
    const name = bizNameInput.trim() || 'Mening biznesim';
    updateSettings({
      businessName: name,
      phone: bizPhoneInput.trim(),
      address: bizAddressInput.trim(),
      currency: currencySelect
    });
    toast('Biznes ma\'lumotlari saqlandi');
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
          <label>Biznes / Do'kon nomi</label>
          <input
            type="text"
            value={bizNameInput}
            onChange={e => setBizNameInput(e.target.value)}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-field">
            <label>Biznes telefon raqami (Chekda ko'rinadi)</label>
            <input
              type="text"
              placeholder="+998 90 123 45 67"
              value={bizPhoneInput}
              onChange={e => setBizPhoneInput(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Manzil (Chekda ko'rinadi)</label>
            <input
              type="text"
              placeholder="Masalan: Toshkent, Chilonzor"
              value={bizAddressInput}
              onChange={e => setBizAddressInput(e.target.value)}
            />
          </div>
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
        <div className="section-title" style={{ marginTop: 0 }}>Integratsiyalar va API sozlamalari</div>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
          Avtomatlashtirilgan SMS eslatmalar, Telegram xabarlar va Click/Payme to'lov shlyuzlari kalitlarini sozlang.
        </p>

        {/* Eskiz SMS Gateway */}
        <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>📱 Eskiz.uz SMS Shlyuzi</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Test rejimi:</span>
              <button
                className={`switch ${eskizTestMode ? 'on' : ''}`}
                onClick={() => setEskizTestMode(!eskizTestMode)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-field">
              <label>Eskiz Email</label>
              <input
                type="text"
                placeholder="misol@eskiz.uz"
                value={eskizEmail}
                onChange={e => setEskizEmail(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Eskiz Parol / API Kalit</label>
              <input
                type="password"
                placeholder="••••••••"
                value={eskizPassword}
                onChange={e => setEskizPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-field">
              <label>Yuboruvchi nomi (From ID)</label>
              <input
                type="text"
                placeholder="4546 yoki Firma nomi"
                value={eskizFrom}
                onChange={e => setEskizFrom(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '12px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleCheckSmsBalance}
                disabled={checkingSms}
                style={{ width: '100%' }}
              >
                {checkingSms ? 'Tekshirilmoqda...' : '📊 Balansni tekshirish'}
              </button>
            </div>
          </div>

          {smsBalance !== null && (
            <div style={{ fontSize: '12.5px', color: 'var(--teal)', fontWeight: 600, marginTop: '4px' }}>
              ✓ Joriy SMS balans: {smsBalance.toLocaleString()} ta SMS
            </div>
          )}
        </div>

        {/* Telegram Bot */}
        <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)', marginBottom: '10px' }}>
            🤖 Telegram Bot Eslatma Tizimi
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div className="form-field">
              <label>Bot Token (BotFather dan olingan)</label>
              <input
                type="password"
                placeholder="123456789:ABCdefGhIJKlmNoPQRstuv..."
                value={tgBotToken}
                onChange={e => setTgBotToken(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '12px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleTestTgBot}
                disabled={testingTg}
                style={{ width: '100%' }}
              >
                {testingTg ? 'Ulanmoqda...' : '⚡ Botni tekshirish'}
              </button>
            </div>
          </div>
          {tgStatus && (
            <div style={{ fontSize: '12.5px', color: tgStatus.startsWith('Ulangan') ? 'var(--teal)' : 'var(--rust)', fontWeight: 600 }}>
              {tgStatus}
            </div>
          )}
        </div>

        {/* Click & Payme Gateways */}
        <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)', marginBottom: '10px' }}>
            💳 To'lov Tizimlari (Click & Payme Merchant)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-field">
              <label>Click Merchant ID</label>
              <input
                type="text"
                placeholder="Masalan: 12345"
                value={clickMerchantId}
                onChange={e => setClickMerchantId(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Click Service ID</label>
              <input
                type="text"
                placeholder="Masalan: 67890"
                value={clickServiceId}
                onChange={e => setClickServiceId(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-field">
              <label>Payme Merchant ID</label>
              <input
                type="text"
                placeholder="Masalan: 64a8b..."
                value={paymeMerchantId}
                onChange={e => setPaymeMerchantId(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Payme Maxfiy Kalit (Secret Key)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={paymeSecretKey}
                onChange={e => setPaymeSecretKey(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button className="btn btn-gold btn-sm" onClick={handleSaveIntegrations}>
          Integratsiya sozlamalarini saqlash
        </button>
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
