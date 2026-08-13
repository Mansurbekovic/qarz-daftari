import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { storage } from '../utils/storage';
import { sha256 } from '../utils/crypto';
import { uid, genCardNumber, futureExpiry } from '../utils/helpers';
import {
  ACCOUNTS_KEY, SESSION_KEY, SYSTEM_CONFIG_KEY, SYSTEM_LOGS_KEY,
  dbKeyFor, defaultDB, defaultSystemConfig, ACCENTS
} from '../utils/constants';
import { useToast } from './ToastContext';

const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [db, setDb] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentClientId, setCurrentClientId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'auth' | 'pin' | 'app'
  const [pinMode, setPinMode] = useState('enter'); // 'setup1' | 'setup2' | 'enter'
  
  // Admin & System Security States
  const [systemConfig, setSystemConfig] = useState(defaultSystemConfig());
  const [systemLogs, setSystemLogs] = useState([]);

  // Notification Center
  const [notifications, setNotifications] = useState([]);

  const saveTimerRef = useRef(null);
  const autoLockRef = useRef(null);
  const [initialized, setInitialized] = useState(false);


  // --- Security Logger ---
  const addSecurityLog = useCallback(async (type, username, details, severity = 'info') => {
    const newLog = {
      id: uid(),
      timestamp: new Date().toISOString(),
      type,
      username: username || 'system',
      details,
      severity, // 'info' | 'warning' | 'danger'
    };
    setSystemLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100);
      storage.set(SYSTEM_LOGS_KEY, JSON.stringify(updated), false);
      return updated;
    });
  }, []);

  // --- Storage helpers ---
  const loadAccountsFromStorage = useCallback(async () => {
    try {
      const res = await storage.get(ACCOUNTS_KEY, false);
      let accs = [];

      if (res && res.value) {
        const parsed = JSON.parse(res.value);
        accs = Array.isArray(parsed) ? parsed : [];
      }

      // Ensure super admin exists
      if (!accs.some(a => a.username === 'admin')) {
        const adminHash = await sha256('admin123');
        const adminAcc = {
          username: 'admin',
          businessName: 'Tizim Administratori',
          passHash: adminHash,
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        accs = [adminAcc, ...accs];
        await storage.set(ACCOUNTS_KEY, JSON.stringify(accs), false);
      }

      // Normalize user records so admin table always shows all known accounts
      accs = accs.map((account) => ({
        ...account,
        username: account.username || account.id || 'unknown',
        businessName: account.businessName || account.name || '—',
        role: account.role || 'user',
        status: account.status || 'active',
        createdAt: account.createdAt || new Date().toISOString(),
      }));

      setAccounts(accs);
      return accs;
    } catch (e) {
      const fallbackAdmin = [{
        username: 'admin',
        businessName: 'Tizim Administratori',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
      }];
      setAccounts(fallbackAdmin);
      return fallbackAdmin;
    }
  }, []);

  const saveAccountsToStorage = useCallback(async (accs) => {
    try {
      await storage.set(ACCOUNTS_KEY, JSON.stringify(accs), false);
    } catch (e) {
      toast('Hisoblar ro\'yxatini saqlashda xatolik', 'error');
    }
  }, [toast]);

  const loadSystemConfig = useCallback(async () => {
    try {
      const res = await storage.get(SYSTEM_CONFIG_KEY, false);
      if (res && res.value) {
        setSystemConfig({ ...defaultSystemConfig(), ...JSON.parse(res.value) });
      }
    } catch (e) { /* ignore */ }
  }, []);

  const saveSystemConfig = useCallback(async (newConfig) => {
    try {
      setSystemConfig(newConfig);
      await storage.set(SYSTEM_CONFIG_KEY, JSON.stringify(newConfig), false);
    } catch (e) { /* ignore */ }
  }, []);

  const loadSystemLogs = useCallback(async () => {
    try {
      const res = await storage.get(SYSTEM_LOGS_KEY, false);
      if (res && res.value) {
        setSystemLogs(JSON.parse(res.value));
      }
    } catch (e) { /* ignore */ }
  }, []);

  const loadSessionFromStorage = useCallback(async () => {
    try {
      const res = await storage.get(SESSION_KEY, false);
      return res && res.value ? JSON.parse(res.value).username : null;
    } catch (e) {
      return null;
    }
  }, []);

  const saveSessionToStorage = useCallback(async (username) => {
    try {
      await storage.set(SESSION_KEY, JSON.stringify({ username }), false);
    } catch (e) { /* ignore */ }
  }, []);

  const clearSessionFromStorage = useCallback(async () => {
    try {
      await storage.delete(SESSION_KEY, false);
    } catch (e) { /* ignore */ }
  }, []);

  const loadDBFromStorage = useCallback(async (username) => {
    try {
      const res = await storage.get(dbKeyFor(username), false);
      let data;
      if (res && res.value) {
        data = { ...defaultDB(), ...JSON.parse(res.value) };
      } else {
        data = defaultDB();
      }
      if (!data.clients) data.clients = [];
      if (!data.transactions) data.transactions = [];
      if (!data.cards) data.cards = [];
      if (!data.cardTx) data.cardTx = [];
      if (data.wallet && typeof data.wallet.balance === 'number' && data.wallet.balance !== 0 && data.cards.length === 0) {
        data.cards.push({ id: uid(), bank: 'Boshqa', type: 'virtual', holder: data.businessName || 'Mening kartam', number: genCardNumber('Boshqa'), last4: '0000', expiry: futureExpiry(), balance: data.wallet.balance, frozen: false, physicalStatus: null, createdAt: new Date().toISOString() });
      }
      data.clients.forEach(c => { if (!c.relation) c.relation = 'owed_to_me'; });
      data.cards.forEach(c => { if (typeof c.balance !== 'number') c.balance = 0; if (c.frozen === undefined) c.frozen = false; });
      return data;
    } catch (e) {
      return defaultDB();
    }
  }, []);

  const saveDBToStorage = useCallback(async (data, username) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await storage.set(dbKeyFor(username || currentUser), JSON.stringify(data), false);
      } catch (e) {
        toast('Saqlashda xatolik yuz berdi', 'error');
      }
    }, 120);
  }, [currentUser, toast]);

  const updateDB = useCallback((updater) => {
    setDb(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveDBToStorage(next);
      return next;
    });
  }, [saveDBToStorage]);

  // Theme
  const applyTheme = useCallback((theme) => {
    document.body.classList.toggle('dark', theme === 'dark');
  }, []);

  const applyAccent = useCallback((accent) => {
    const hex = ACCENTS[accent] || ACCENTS.gold;
    document.documentElement.style.setProperty('--gold', hex);
  }, []);

  const toggleTheme = useCallback(() => {
    updateDB(prev => {
      const next = { ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' };
      applyTheme(next.theme);
      return next;
    });
  }, [updateDB, applyTheme]);

  const setAccent = useCallback((accent) => {
    updateDB(prev => {
      const next = { ...prev, accent };
      applyAccent(accent);
      return next;
    });
  }, [updateDB, applyAccent]);

  // Auto Lock
  const resetAutoLock = useCallback(() => {
    clearTimeout(autoLockRef.current);
    if (!db) return;
    const mins = db.autoLockMinutes || 5;
    autoLockRef.current = setTimeout(() => {
      setUnlocked(false);
      setAuthState('pin');
      setPinMode('enter');
      toast('Beri turgani uchun ilova qulflandi');
    }, mins * 60 * 1000);
  }, [db, toast]);

  useEffect(() => {
    if (!unlocked) return;
    const handler = () => resetAutoLock();
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach(evt => document.addEventListener(evt, handler));
    resetAutoLock();
    return () => {
      events.forEach(evt => document.removeEventListener(evt, handler));
      clearTimeout(autoLockRef.current);
    };
  }, [unlocked, resetAutoLock]);

  // Navigation
  const navigate = useCallback((page, param = null) => {
    setCurrentPage(page);
    setCurrentClientId(param);
    window.scrollTo(0, 0);
  }, []);

  // Calculations
  const clientBalance = useCallback((clientId) => {
    if (!db) return 0;
    let bal = 0;
    for (const t of db.transactions) {
      if (t.clientId !== clientId) continue;
      bal += t.type === 'debt' ? Number(t.amount) : -Number(t.amount);
    }
    return bal;
  }, [db]);

  const clientTransactions = useCallback((clientId) => {
    if (!db) return [];
    return db.transactions.filter(t => t.clientId === clientId).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [db]);

  const clientIsOverdue = useCallback((clientId) => {
    if (!db) return false;
    const bal = clientBalance(clientId);
    if (bal <= 0) return false;
    const today = new Date().toISOString().slice(0, 10);
    return db.transactions.some(t => t.clientId === clientId && t.type === 'debt' && t.dueDate && t.dueDate < today);
  }, [db, clientBalance]);

  const totals = useCallback(() => {
    if (!db) return { owedToMe: 0, iOwe: 0, net: 0, overdueCount: 0, overdueSum: 0, clientCount: 0, txCount: 0 };
    let owedToMe = 0, iOwe = 0, overdueCount = 0, overdueSum = 0;
    for (const c of db.clients) {
      const bal = clientBalance(c.id);
      if (c.relation === 'i_owe') { if (bal > 0) iOwe += bal; }
      else { if (bal > 0) owedToMe += bal; }
      if (clientIsOverdue(c.id)) { overdueCount++; overdueSum += bal; }
    }
    return { owedToMe, iOwe, net: owedToMe - iOwe, overdueCount, overdueSum, clientCount: db.clients.length, txCount: db.transactions.length };
  }, [db, clientBalance, clientIsOverdue]);

  const totalCardBalance = useCallback(() => {
    if (!db) return 0;
    return db.cards.reduce((s, c) => s + Number(c.balance || 0), 0);
  }, [db]);

  // Auth
  const login = useCallback(async (username, password) => {
    if (systemConfig.lockdown && username !== 'admin') {
      addSecurityLog('LOCKDOWN_BLOCK', username, 'Favqulodda qulflash rejimida kirishga urinish', 'warning');
      throw new Error('Tizim administrator tomonidan vaqtincha favqulodda qulflangan.');
    }

    const acc = accounts.find(a => a.username === username);
    if (!acc) {
      addSecurityLog('FAILED_LOGIN', username, 'Topilmagan nom bilan kirishga urinish', 'warning');
      throw new Error('Bunday foydalanuvchi topilmadi.');
    }
    if (acc.status === 'banned') {
      addSecurityLog('BANNED_LOGIN', username, 'Bloklangan foydalanuvchi kirishga urindi', 'danger');
      throw new Error('Hisobingiz administrator tomonidan bloklangan!');
    }

    const hash = await sha256(password);
    if (hash !== acc.passHash) {
      addSecurityLog('WRONG_PASSWORD', username, 'Noto\'g\'ri parol kiritildi', 'warning');
      throw new Error('Parol noto\'g\'ri.');
    }

    const data = await loadDBFromStorage(username);
    setCurrentUser(username);
    setDb(data);
    await saveSessionToStorage(username);
    applyTheme(data.theme);
    applyAccent(data.accent);

    addSecurityLog('LOGIN_SUCCESS', username, 'Muvaffaqiyatli tizimga kirdi', 'info');

    if (!data.pinHash) {
      setAuthState('pin');
      setPinMode('setup1');
    } else {
      setAuthState('pin');
      setPinMode('enter');
    }
  }, [accounts, systemConfig, loadDBFromStorage, saveSessionToStorage, applyTheme, applyAccent, addSecurityLog]);

  const register = useCallback(async (bizName, username, password) => {
    if (systemConfig.lockdown) {
      throw new Error('Tizim administrator tomonidan vaqtincha favqulodda qulflangan.');
    }
    if (accounts.some(a => a.username === username)) throw new Error('Bu foydalanuvchi nomi band.');
    
    const passHash = await sha256(password);
    const newAccounts = [...accounts, {
      username,
      businessName: bizName,
      passHash,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString()
    }];
    setAccounts(newAccounts);
    await saveAccountsToStorage(newAccounts);
    
    const data = defaultDB();
    data.businessName = bizName;
    setCurrentUser(username);
    setDb(data);
    await saveDBToStorage(data, username);
    await saveSessionToStorage(username);

    addSecurityLog('REGISTER_SUCCESS', username, 'Yangi hisob yaratildi', 'info');

    toast('Hisob yaratildi. Endi PIN-kod o\'rnating.');
    setAuthState('pin');
    setPinMode('setup1');
  }, [accounts, systemConfig, saveAccountsToStorage, saveDBToStorage, saveSessionToStorage, toast, addSecurityLog]);

  const logout = useCallback(async () => {
    if (currentUser) {
      addSecurityLog('LOGOUT', currentUser, 'Hisobdan chiqdi', 'info');
    }
    clearTimeout(autoLockRef.current);
    await clearSessionFromStorage();
    setUnlocked(false);
    setDb(null);
    setCurrentUser(null);
    setAuthState('auth');
    setCurrentPage('dashboard');
  }, [currentUser, clearSessionFromStorage, addSecurityLog]);

  // PIN
  const enterApp = useCallback(() => {
    setUnlocked(true);
    setAuthState('app');
    setCurrentPage('dashboard');
    resetAutoLock();
  }, [resetAutoLock]);

  const lockApp = useCallback(() => {
    setUnlocked(false);
    setAuthState('pin');
    setPinMode('enter');
  }, []);

  const wipeAndResetPin = useCallback(async () => {
    addSecurityLog('WIPE_DATA', currentUser, 'Foydalanuvchi ma\'lumotlarini va PIN-kodni nolladi', 'danger');
    const data = defaultDB();
    setDb(data);
    await saveDBToStorage(data);
    setPinMode('setup1');
    toast('Ma\'lumotlar tozalandi. Yangi PIN o\'rnating.');
  }, [currentUser, saveDBToStorage, toast, addSecurityLog]);

  // Client CRUD
  const addClient = useCallback((client) => {
    updateDB(prev => ({
      ...prev,
      clients: [...prev.clients, { id: uid(), ...client, createdAt: new Date().toISOString() }]
    }));
  }, [updateDB]);

  const updateClient = useCallback((id, updates) => {
    updateDB(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  }, [updateDB]);

  const deleteClient = useCallback((id) => {
    updateDB(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id),
      transactions: prev.transactions.filter(t => t.clientId !== id)
    }));
  }, [updateDB]);

  // Transaction CRUD with Anti-Bug / Anti-Abuse validation
  const addTransaction = useCallback((tx) => {
    if (tx.amount > systemConfig.maxTxAmount) {
      addSecurityLog('EXCESSIVE_AMOUNT', currentUser, `Ruxsat etilgan limitdan yuqori summa: ${tx.amount}`, 'danger');
      toast(`Maksimal tranzaksiya limiti ${systemConfig.maxTxAmount} so'm.`, 'error');
      return;
    }

    updateDB(prev => {
      const next = { ...prev, transactions: [...prev.transactions, { id: uid(), ...tx }] };
      if (tx.cardId) {
        const client = prev.clients.find(c => c.id === tx.clientId);
        const iowe = client && client.relation === 'i_owe';
        const outflow = (tx.type === 'debt' && !iowe) || (tx.type === 'payment' && iowe);
        next.cards = next.cards.map(c => {
          if (c.id !== tx.cardId) return c;
          return { ...c, balance: c.balance + (outflow ? -Number(tx.amount) : Number(tx.amount)) };
        });
        next.cardTx = [...(next.cardTx || []), { id: uid(), type: outflow ? 'lend' : 'receive', cardId: tx.cardId, amount: tx.amount, clientId: tx.clientId, note: tx.note, date: new Date().toISOString() }];
      }
      return next;
    });
  }, [updateDB, systemConfig, currentUser, addSecurityLog, toast]);

  const deleteTransaction = useCallback((id) => {
    updateDB(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  }, [updateDB]);

  // Card CRUD
  const addCard = useCallback((card) => {
    updateDB(prev => ({
      ...prev,
      cards: [...prev.cards, { id: uid(), ...card, createdAt: new Date().toISOString() }]
    }));
  }, [updateDB]);

  const deleteCard = useCallback((id) => {
    updateDB(prev => ({
      ...prev,
      cards: prev.cards.filter(c => c.id !== id)
    }));
  }, [updateDB]);

  const toggleFreezeCard = useCallback((id) => {
    updateDB(prev => ({
      ...prev,
      cards: prev.cards.map(c => c.id === id ? { ...c, frozen: !c.frozen } : c)
    }));
  }, [updateDB]);

  const updateCardStatus = useCallback((id, updates) => {
    updateDB(prev => ({
      ...prev,
      cards: prev.cards.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  }, [updateDB]);

  // Card Transactions
  const addCardTx = useCallback((txData) => {
    updateDB(prev => {
      const next = { ...prev };
      next.cards = [...prev.cards];
      next.cardTx = [...(prev.cardTx || [])];
      const { kind, cardId, toCardId, amount, note } = txData;
      const cardIdx = next.cards.findIndex(c => c.id === cardId);
      if (cardIdx === -1) return prev;

      if (kind === 'topup') {
        next.cards[cardIdx] = { ...next.cards[cardIdx], balance: next.cards[cardIdx].balance + amount };
        next.cardTx.push({ id: uid(), type: 'topup', cardId, amount, note, date: new Date().toISOString() });
      } else if (kind === 'withdraw') {
        next.cards[cardIdx] = { ...next.cards[cardIdx], balance: next.cards[cardIdx].balance - amount };
        next.cardTx.push({ id: uid(), type: 'withdraw', cardId, amount, note, date: new Date().toISOString() });
      } else if (kind === 'transfer') {
        const toIdx = next.cards.findIndex(c => c.id === toCardId);
        if (toIdx === -1) return prev;
        next.cards[cardIdx] = { ...next.cards[cardIdx], balance: next.cards[cardIdx].balance - amount };
        next.cards[toIdx] = { ...next.cards[toIdx], balance: next.cards[toIdx].balance + amount };
        next.cardTx.push({ id: uid(), type: 'transfer_out', cardId, toCardId, amount, note, date: new Date().toISOString() });
        next.cardTx.push({ id: uid(), type: 'transfer_in', cardId: toCardId, toCardId: cardId, amount, note, date: new Date().toISOString() });
      } else if (kind === 'online') {
        next.cards[cardIdx] = { ...next.cards[cardIdx], balance: next.cards[cardIdx].balance - amount };
        next.cardTx.push({ id: uid(), type: 'online', cardId, amount, note, date: new Date().toISOString() });
      }
      return next;
    });
  }, [updateDB]);

  // Settings
  const updateSettings = useCallback((updates) => {
    updateDB(prev => ({ ...prev, ...updates }));
    if (updates.businessName) {
      setAccounts(prev => {
        const next = prev.map(a => a.username === currentUser ? { ...a, businessName: updates.businessName } : a);
        saveAccountsToStorage(next);
        return next;
      });
    }
  }, [updateDB, currentUser, saveAccountsToStorage]);

  const changePin = useCallback(async (currentPin, newPin) => {
    const curHash = await sha256(currentPin);
    if (curHash !== db.pinHash) throw new Error('Joriy PIN-kod noto\'g\'ri');
    const newHash = await sha256(newPin);
    updateDB(prev => ({ ...prev, pinHash: newHash }));
  }, [db, updateDB]);

  const changePassword = useCallback(async (currentPass, newPass) => {
    const acc = accounts.find(a => a.username === currentUser);
    const curHash = await sha256(currentPass);
    if (curHash !== acc.passHash) throw new Error('Joriy parol noto\'g\'ri');
    const newHash = await sha256(newPass);
    const newAccounts = accounts.map(a => a.username === currentUser ? { ...a, passHash: newHash } : a);
    setAccounts(newAccounts);
    await saveAccountsToStorage(newAccounts);
  }, [accounts, currentUser, saveAccountsToStorage]);

  const deleteAccount = useCallback(async (password) => {
    const acc = accounts.find(a => a.username === currentUser);
    const hash = await sha256(password);
    if (hash !== acc.passHash) throw new Error('Parol noto\'g\'ri');
    try { await storage.delete(dbKeyFor(currentUser), false); } catch (e) { /* ignore */ }
    const newAccounts = accounts.filter(a => a.username !== currentUser);
    setAccounts(newAccounts);
    await saveAccountsToStorage(newAccounts);
    await clearSessionFromStorage();
    setUnlocked(false);
    setDb(null);
    setCurrentUser(null);
    setAuthState('auth');
    toast('Hisob o\'chirildi');
  }, [accounts, currentUser, saveAccountsToStorage, clearSessionFromStorage, toast]);

  const wipeData = useCallback(() => {
    updateDB(prev => ({ ...prev, clients: [], transactions: [], cards: [], cardTx: [] }));
  }, [updateDB]);

  const exportData = useCallback(() => {
    if (!db) return;
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qarz-daftari-${currentUser}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Zaxira nusxa yuklab olindi');
  }, [db, currentUser, toast]);

  const importData = useCallback((jsonData) => {
    const data = { ...defaultDB(), ...jsonData };
    data.clients.forEach(c => { if (!c.relation) c.relation = 'owed_to_me'; });
    data.cards.forEach(c => { if (typeof c.balance !== 'number') c.balance = 0; });
    setDb(data);
    saveDBToStorage(data);
    applyTheme(data.theme);
    applyAccent(data.accent);
  }, [saveDBToStorage, applyTheme, applyAccent]);

  const exportCards = useCallback(() => {
    if (!db) return;
    const blob = new Blob([JSON.stringify({ cards: db.cards }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qarz-daftari-kartalar-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Kartalar yuklab olindi');
  }, [db, toast]);

  const importCards = useCallback((cardsData) => {
    updateDB(prev => {
      const newCards = cardsData.map(c => ({ ...c, id: uid() }));
      return { ...prev, cards: [...prev.cards, ...newCards] };
    });
  }, [updateDB]);

  // --- ADMIN ACTIONS ---
  const adminBlockUser = useCallback(async (targetUsername) => {
    if (targetUsername === 'admin') {
      toast('Admin hisobini bloklab bo\'lmaydi!', 'error');
      return;
    }
    const updated = accounts.map(a => a.username === targetUsername ? { ...a, status: 'banned' } : a);
    setAccounts(updated);
    await saveAccountsToStorage(updated);
    addSecurityLog('ADMIN_BLOCK_USER', currentUser, `${targetUsername} foydalanuvchisi bloklandi`, 'danger');
    toast(`${targetUsername} hisobi bloklandi`);
  }, [accounts, currentUser, saveAccountsToStorage, addSecurityLog, toast]);

  const adminUnblockUser = useCallback(async (targetUsername) => {
    const updated = accounts.map(a => a.username === targetUsername ? { ...a, status: 'active' } : a);
    setAccounts(updated);
    await saveAccountsToStorage(updated);
    addSecurityLog('ADMIN_UNBLOCK_USER', currentUser, `${targetUsername} foydalanuvchisi blokdan chiqarildi`, 'info');
    toast(`${targetUsername} hisobi faollashtirildi`);
  }, [accounts, currentUser, saveAccountsToStorage, addSecurityLog, toast]);

  const adminResetUserPassword = useCallback(async (targetUsername, newPass = '123456') => {
    const newHash = await sha256(newPass);
    const updated = accounts.map(a => a.username === targetUsername ? { ...a, passHash: newHash } : a);
    setAccounts(updated);
    await saveAccountsToStorage(updated);
    addSecurityLog('ADMIN_RESET_PASS', currentUser, `${targetUsername} paroli '${newPass}' ga nollanildi`, 'warning');
    toast(`${targetUsername} paroli '${newPass}' ga o'zgartirildi`);
  }, [accounts, currentUser, saveAccountsToStorage, addSecurityLog, toast]);

  const adminResetUserPin = useCallback(async (targetUsername) => {
    const userDb = await loadDBFromStorage(targetUsername);
    userDb.pinHash = null;
    await storage.set(dbKeyFor(targetUsername), JSON.stringify(userDb), false);
    addSecurityLog('ADMIN_RESET_PIN', currentUser, `${targetUsername} PIN-kodi nollanildi`, 'warning');
    toast(`${targetUsername} PIN-kodi nollandi`);
  }, [currentUser, loadDBFromStorage, addSecurityLog, toast]);

  const toggleSystemLockdown = useCallback(() => {
    const nextState = !systemConfig.lockdown;
    const newConf = { ...systemConfig, lockdown: nextState };
    saveSystemConfig(newConf);
    addSecurityLog('SYSTEM_LOCKDOWN', currentUser, `Favqulodda qulflash: ${nextState ? 'YOQILDI' : 'O\'CHIRILDI'}`, nextState ? 'danger' : 'info');
    toast(nextState ? 'TIZIM FAVQULODDA QULFLANDI' : 'Favqulodda qulflash bekor qilindi');
  }, [systemConfig, saveSystemConfig, currentUser, addSecurityLog, toast]);

  const toggleMaintenance = useCallback(() => {
    const nextState = !systemConfig.maintenance;
    const newConf = { ...systemConfig, maintenance: nextState };
    saveSystemConfig(newConf);
    addSecurityLog('SYSTEM_MAINTENANCE', currentUser, `Profilaktika rejimi: ${nextState ? 'YOQILDI' : 'O\'CHIRILDI'}`, 'warning');
    toast(nextState ? 'Profilaktika rejimi yoqildi' : 'Profilaktika rejimi o\'chirildi');
  }, [systemConfig, saveSystemConfig, currentUser, addSecurityLog, toast]);

  const updateSystemConfigValues = useCallback((updates) => {
    const newConf = { ...systemConfig, ...updates };
    saveSystemConfig(newConf);
    toast('Tizim xavfsizlik sozlamalari yangilandi');
  }, [systemConfig, saveSystemConfig, toast]);

  // --- Notification Center ---
  const addNotification = useCallback((type, message) => {
    const notif = {
      id: uid(),
      type, // 'payment' | 'debt' | 'overdue' | 'admin' | 'system'
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [notif, ...prev].slice(0, 50));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Admin Delete User
  const adminDeleteUser = useCallback(async (targetUsername) => {
    if (targetUsername === 'admin') {
      toast('Admin hisobini o\'chirib bo\'lmaydi!', 'error');
      return;
    }
    try { await storage.delete(dbKeyFor(targetUsername), false); } catch (e) { /* ignore */ }
    const updated = accounts.filter(a => a.username !== targetUsername);
    setAccounts(updated);
    await saveAccountsToStorage(updated);
    addSecurityLog('ADMIN_DELETE_USER', currentUser, `${targetUsername} hisobi admin tomonidan o'chirildi`, 'danger');
    addNotification('admin', `${targetUsername} hisobi o'chirildi`);
    toast(`${targetUsername} hisobi o'chirildi`);
  }, [accounts, currentUser, saveAccountsToStorage, addSecurityLog, addNotification, toast]);

  // Init
  useEffect(() => {
    async function init() {
      await loadSystemConfig();
      await loadSystemLogs();
      const accs = await loadAccountsFromStorage();
      const sessionUser = await loadSessionFromStorage();
      if (sessionUser && accs.some(a => a.username === sessionUser)) {
        const data = await loadDBFromStorage(sessionUser);
        setCurrentUser(sessionUser);
        setDb(data);
        applyTheme(data.theme);
        applyAccent(data.accent);
        if (!data.pinHash) {
          setAuthState('pin');
          setPinMode('setup1');
        } else {
          setAuthState('pin');
          setPinMode('enter');
        }
      } else {
        setAuthState('auth');
      }
      setInitialized(true);
    }
    init();
  }, []);

  const currentAccount = accounts.find(a => a.username === currentUser) || null;
  const isAdmin = Boolean(currentAccount?.isAdmin || currentAccount?.role === 'admin' || currentAccount?.username === 'admin');

  const value = {
    accounts, currentUser, db, unlocked, currentPage, currentClientId,
    searchQuery, setSearchQuery, clientFilter, setClientFilter,
    authState, setAuthState, pinMode, setPinMode, initialized, isAdmin,
    systemConfig, systemLogs,
    login, register, logout,
    enterApp, lockApp, wipeAndResetPin,
    navigate,
    toggleTheme, setAccent, applyAccent: () => applyAccent(db?.accent),
    clientBalance, clientTransactions, clientIsOverdue, totals, totalCardBalance,
    addClient, updateClient, deleteClient,
    addTransaction, deleteTransaction,
    addCard, deleteCard, toggleFreezeCard, updateCardStatus,
    addCardTx,
    updateSettings, changePin, changePassword, deleteAccount,
    wipeData, exportData, importData, exportCards, importCards,
    updateDB,
    // Admin functions
    adminBlockUser, adminUnblockUser, adminResetUserPassword, adminResetUserPin,
    adminDeleteUser,
    toggleSystemLockdown, toggleMaintenance, updateSystemConfigValues, addSecurityLog,
    // Notifications
    notifications, addNotification, markAllNotificationsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
