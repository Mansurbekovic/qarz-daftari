import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { storage } from '../utils/storage';
import { sha256 } from '../utils/crypto';
import { uid, genCardNumber, futureExpiry, getApiBase, fetchWithTimeout } from '../utils/helpers';
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

  // --- Storage helpers (Instant Local First + Non-blocking Background Sync) ---
  const loadAccountsFromStorage = useCallback(async () => {
    try {
      const res = await storage.get(ACCOUNTS_KEY, false);
      let accs = [];

      if (res && res.value) {
        const parsed = JSON.parse(res.value);
        accs = Array.isArray(parsed) ? parsed : [];
      }

      // 1. Auto-discover users from all localStorage keys starting with qd-db::
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.includes('qd-db::')) {
            const username = k.split('qd-db::')[1];
            if (username && !accs.some(a => a.username === username)) {
              try {
                const dbStr = window.localStorage.getItem(k);
                const parsed = JSON.parse(dbStr);
                accs.push({
                  username,
                  businessName: parsed.businessName || username,
                  role: username === 'admin' ? 'admin' : 'user',
                  status: 'active',
                  createdAt: new Date().toISOString()
                });
              } catch (e) {
                accs.push({
                  username,
                  businessName: username,
                  role: username === 'admin' ? 'admin' : 'user',
                  status: 'active',
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        }
      }

      // Ensure super admin exists and migrate/update default password if needed
      const NEW_ADMIN_PLAIN = 'admin1234567890';
      const OLD_ADMIN_PLAIN = 'admin123';
      if (!accs.some(a => a.username === 'admin')) {
        const adminHash = await sha256(NEW_ADMIN_PLAIN);
        const adminAcc = {
          username: 'admin',
          businessName: 'Tizim Administratori',
          passHash: adminHash,
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        accs = [adminAcc, ...accs];
      } else {
        // If admin exists but has no passHash or still uses old default, migrate to new default
        const adminIdx = accs.findIndex(a => a.username === 'admin');
        if (adminIdx >= 0) {
          const currentPassHash = accs[adminIdx].passHash;
          const oldHash = await sha256(OLD_ADMIN_PLAIN);
          const newHash = await sha256(NEW_ADMIN_PLAIN);
          if (!currentPassHash || currentPassHash === oldHash) {
            accs[adminIdx] = { ...accs[adminIdx], passHash: newHash };
          }
        }
      }

      // Normalize user records so admin table always shows all known accounts
      accs = accs.map((account) => ({
        ...account,
        username: account.username || account.id || 'unknown',
        businessName: account.businessName || account.name || '—',
        role: account.role || (account.username === 'admin' ? 'admin' : 'user'),
        status: account.status || 'active',
        createdAt: account.createdAt || new Date().toISOString(),
      }));

      await storage.set(ACCOUNTS_KEY, JSON.stringify(accs), false);
      setAccounts(accs);

      // Non-blocking Background Sync with backend API (Does NOT stall UI)
      setTimeout(async () => {
        try {
          const backendRes = await fetchWithTimeout(`${getApiBase()}/api/users`, {}, 3000);
          if (backendRes.ok) {
            const backendUsers = await backendRes.json();
            if (Array.isArray(backendUsers)) {
              setAccounts(prev => {
                let updated = [...prev];
                let changed = false;
                for (const u of backendUsers) {
                  const uname = u.username || u.name;
                  if (uname && !updated.some(a => a.username === uname)) {
                    updated.push({
                      username: uname,
                      businessName: u.businessName || u.name || uname,
                      role: u.role || (uname === 'admin' ? 'admin' : 'user'),
                      status: u.status || 'active',
                      createdAt: u.createdAt || new Date().toISOString()
                    });
                    changed = true;
                  }
                }
                if (changed) {
                  storage.set(ACCOUNTS_KEY, JSON.stringify(updated), false);
                }
                return updated;
              });
            }
          }
        } catch (e) { /* background offline ignore */ }
      }, 500);

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
      setTimeout(async () => {
        try {
          await fetchWithTimeout(`${getApiBase()}/api/users/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accs)
          }, 3000);
        } catch (e) { /* ignore */ }
      }, 100);
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
      let data = null;
      if (res && res.value) {
        data = { ...defaultDB(), ...JSON.parse(res.value) };
      }

      if (!data) data = defaultDB();
      if (!data.clients) data.clients = [];
      if (!data.transactions) data.transactions = [];
      if (!data.cards) data.cards = [];
      if (!data.cardTx) data.cardTx = [];
      if (!data.kassaEntries) data.kassaEntries = [];
      if (!data.products) data.products = [];
      if (!data.warehouseLogs) data.warehouseLogs = [];
      if (!data.contracts) data.contracts = [];
      if (!data.staff) data.staff = [];
      if (!data.userRole) data.userRole = 'admin';
      if (!data.suppliers) data.suppliers = [];
      if (!data.supplyOrders) data.supplyOrders = [];
      if (!data.supplierPayments) data.supplierPayments = [];
      if (!data.invoices) data.invoices = [];
      if (!data.employees) data.employees = [];
      if (!data.advances) data.advances = [];
      if (!data.payrolls) data.payrolls = [];
      if (!data.callLogs) data.callLogs = [];
      if (!data.reminders) data.reminders = [];
      if (!data.collaterals) data.collaterals = [];
      if (!data.branches || data.branches.length === 0) {
        data.branches = [{ id: 'main', name: 'Bosh savdo nuqtasi', address: 'Toshkent sh.', phone: '', isMain: true, createdAt: new Date().toISOString() }];
      }
      if (!data.currentBranchId) data.currentBranchId = 'main';
      if (!data.subscription) {
        data.subscription = { plan: 'enterprise', validUntil: '2030-12-31', status: 'active', autoRenew: true };
      }
      if (typeof data.smsBalance !== 'number') data.smsBalance = 250;
      if (data.wallet && typeof data.wallet.balance === 'number' && data.wallet.balance !== 0 && data.cards.length === 0) {
        data.cards.push({ id: uid(), bank: 'Boshqa', type: 'virtual', holder: data.businessName || 'Mening kartam', number: genCardNumber('Boshqa'), last4: '0000', expiry: futureExpiry(), balance: data.wallet.balance, frozen: false, physicalStatus: null, createdAt: new Date().toISOString() });
      }
      data.clients.forEach(c => { if (!c.relation) c.relation = 'owed_to_me'; });
      data.cards.forEach(c => { if (typeof c.balance !== 'number') c.balance = 0; if (c.frozen === undefined) c.frozen = false; });

      // Background Sync (Non-blocking, UI loads in 0ms)
      setTimeout(async () => {
        try {
          const backendRes = await fetchWithTimeout(`${getApiBase()}/api/users/${username}/db`, {}, 3000);
          if (backendRes.ok) {
            const serverData = await backendRes.json();
            if (serverData && Object.keys(serverData).length > 0) {
              setDb(prev => ({ ...prev, ...serverData }));
            }
          }
        } catch (e) { /* ignore */ }
      }, 600);

      return data;
    } catch (e) {
      return defaultDB();
    }
  }, []);

  const saveDBToStorage = useCallback(async (data, username) => {
    const targetUser = username || currentUser;
    if (!targetUser) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await storage.set(dbKeyFor(targetUser), JSON.stringify(data), false);
        try {
          await fetchWithTimeout(`${getApiBase()}/api/users/${targetUser}/db`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }, 2500);
        } catch (e) { /* ignore */ }
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

  // Ultra-fast Indexed Calculations (0ms lag)
  const { balanceMap, overdueSet } = useMemo(() => {
    const bMap = {};
    const oSet = new Set();
    if (!db || !db.transactions) return { balanceMap: bMap, overdueSet: oSet };

    const today = new Date().toISOString().slice(0, 10);
    const txs = db.transactions;
    for (let i = 0; i < txs.length; i++) {
      const t = txs[i];
      const amt = Number(t.amount) || 0;
      bMap[t.clientId] = (bMap[t.clientId] || 0) + (t.type === 'debt' ? amt : -amt);
      if (t.type === 'debt' && t.dueDate && t.dueDate < today) {
        oSet.add(t.clientId);
      }
    }
    return { balanceMap: bMap, overdueSet: oSet };
  }, [db?.transactions]);

  const clientBalance = useCallback((clientId) => {
    return balanceMap[clientId] || 0;
  }, [balanceMap]);

  const clientTransactions = useCallback((clientId) => {
    if (!db || !db.transactions) return [];
    return db.transactions.filter(t => t.clientId === clientId).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [db?.transactions]);

  const clientIsOverdue = useCallback((clientId) => {
    const bal = balanceMap[clientId] || 0;
    return bal > 0 && overdueSet.has(clientId);
  }, [balanceMap, overdueSet]);

  const cachedTotals = useMemo(() => {
    if (!db || !db.clients) return { owedToMe: 0, iOwe: 0, net: 0, overdueCount: 0, overdueSum: 0, clientCount: 0, txCount: 0 };
    let owedToMe = 0, iOwe = 0, overdueCount = 0, overdueSum = 0;
    const clients = db.clients;
    for (let i = 0; i < clients.length; i++) {
      const c = clients[i];
      const bal = balanceMap[c.id] || 0;
      if (c.relation === 'i_owe') {
        if (bal > 0) iOwe += bal;
      } else {
        if (bal > 0) owedToMe += bal;
      }
      if (bal > 0 && overdueSet.has(c.id)) {
        overdueCount++;
        overdueSum += bal;
      }
    }
    return {
      owedToMe,
      iOwe,
      net: owedToMe - iOwe,
      overdueCount,
      overdueSum,
      clientCount: clients.length,
      txCount: (db.transactions || []).length
    };
  }, [db?.clients, db?.transactions?.length, balanceMap, overdueSet]);

  const totals = useCallback(() => cachedTotals, [cachedTotals]);

  const totalCardBalance = useCallback(() => {
    if (!db || !db.cards) return 0;
    return db.cards.reduce((s, c) => s + Number(c.balance || 0), 0);
  }, [db?.cards]);

  // Auth
  const login = useCallback(async (username, password) => {
    if (systemConfig.lockdown && username !== 'admin') {
      addSecurityLog('LOCKDOWN_BLOCK', username, 'Favqulodda qulflash rejimida kirishga urinish', 'warning');
      throw new Error('Tizim administrator tomonidan vaqtincha favqulodda qulflangan.');
    }

    let acc = accounts.find(a => a.username === username);
    if (!acc) {
      // Reload accounts from backend/storage to discover users created on other devices
      const freshAccounts = await loadAccountsFromStorage();
      acc = freshAccounts.find(a => a.username === username);
    }

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
  }, [accounts, systemConfig, loadAccountsFromStorage, loadDBFromStorage, saveSessionToStorage, applyTheme, applyAccent, addSecurityLog]);

  const register = useCallback(async (bizName, username, password) => {
    if (systemConfig.lockdown) {
      throw new Error('Tizim administrator tomonidan vaqtincha favqulodda qulflangan.');
    }
    if (accounts.some(a => a.username === username)) throw new Error('Bu foydalanuvchi nomi band.');
    
    const passHash = await sha256(password);
    const newAccount = {
      username,
      businessName: bizName,
      passHash,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    const newAccounts = [...accounts, newAccount];
    setAccounts(newAccounts);
    await saveAccountsToStorage(newAccounts);
    
    // Immediately register user on backend for cross-device visibility
    try {
      await fetch(`${getApiBase()}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      });
    } catch (e) { /* backend offline */ }
    
    const data = defaultDB();
    data.businessName = bizName;
    setCurrentUser(username);
    setDb(data);

    // Save DB immediately (no debounce) to ensure data persists
    try {
      await storage.set(dbKeyFor(username), JSON.stringify(data), false);
      try {
        await fetch(`${getApiBase()}/api/users/${username}/db`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } catch (e) { /* ignore */ }
    } catch (e) { /* ignore */ }

    await saveSessionToStorage(username);

    addSecurityLog('REGISTER_SUCCESS', username, 'Yangi hisob yaratildi', 'info');

    toast('Hisob yaratildi. Endi PIN-kod o\'rnating.');
    setAuthState('pin');
    setPinMode('setup1');
  }, [accounts, systemConfig, saveAccountsToStorage, saveSessionToStorage, toast, addSecurityLog]);

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

  // Transaction CRUD with Anti-Bug / Anti-Abuse validation & Auto Stock Update
  const addTransaction = useCallback((tx) => {
    if (tx.amount > systemConfig.maxTxAmount) {
      addSecurityLog('EXCESSIVE_AMOUNT', currentUser, `Ruxsat etilgan limitdan yuqori summa: ${tx.amount}`, 'danger');
      toast(`Maksimal tranzaksiya limiti ${systemConfig.maxTxAmount} so'm.`, 'error');
      return;
    }

    updateDB(prev => {
      const next = { ...prev, transactions: [...prev.transactions, { id: uid(), ...tx }] };
      
      // Auto decrement stock if items from warehouse were sold
      if (Array.isArray(tx.items) && tx.items.length > 0 && Array.isArray(prev.products)) {
        next.products = prev.products.map(p => {
          const matched = tx.items.find(i => (i.productId && i.productId === p.id) || (i.barcode && i.barcode === p.barcode) || (i.name && i.name.toLowerCase() === p.name.toLowerCase()));
          if (matched) {
            const soldQty = Number(matched.quantity || 1);
            const newStock = Math.max(0, (p.stock || 0) - soldQty);
            return { ...p, stock: newStock };
          }
          return p;
        });

        // Add log
        const logEntries = tx.items.map(i => ({
          id: uid(),
          date: new Date().toISOString(),
          type: 'sale',
          itemName: i.name,
          quantity: i.quantity,
          unit: i.unit,
          note: `Nasiya savdoga chiqim (Mijoz ID: ${tx.clientId})`
        }));
        next.warehouseLogs = [...(prev.warehouseLogs || []), ...logEntries];
      }

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

  // Warehouse Products CRUD
  const addProduct = useCallback((prod) => {
    updateDB(prev => {
      const newProd = {
        id: uid(),
        name: prod.name || 'Nomsiz tovar',
        barcode: prod.barcode || '',
        price: Number(prod.price || 0),
        costPrice: Number(prod.costPrice || 0),
        stock: Number(prod.stock || 0),
        unit: prod.unit || 'dona',
        category: prod.category || 'Boshqa',
        minStock: Number(prod.minStock || 5),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const log = {
        id: uid(),
        date: new Date().toISOString(),
        type: 'initial',
        itemName: newProd.name,
        quantity: newProd.stock,
        unit: newProd.unit,
        note: 'Boshlang\'ich qoldiq kiritildi'
      };
      return {
        ...prev,
        products: [...(prev.products || []), newProd],
        warehouseLogs: [...(prev.warehouseLogs || []), log]
      };
    });
    toast('Mahsulot omborga qo\'shildi');
  }, [updateDB, toast]);

  const updateProduct = useCallback((id, updates) => {
    updateDB(prev => ({
      ...prev,
      products: (prev.products || []).map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
    }));
    toast('Mahsulot ma\'lumotlari yangilandi');
  }, [updateDB, toast]);

  const deleteProduct = useCallback((id) => {
    updateDB(prev => ({
      ...prev,
      products: (prev.products || []).filter(p => p.id !== id)
    }));
    toast('Mahsulot ombordan o\'chirildi');
  }, [updateDB, toast]);

  const adjustProductStock = useCallback((id, delta, reason = 'Korreksiya') => {
    updateDB(prev => {
      let prodName = '';
      let prodUnit = 'dona';
      const updatedProducts = (prev.products || []).map(p => {
        if (p.id === id) {
          prodName = p.name;
          prodUnit = p.unit;
          const newStock = Math.max(0, (p.stock || 0) + Number(delta));
          return { ...p, stock: newStock, updatedAt: new Date().toISOString() };
        }
        return p;
      });

      const log = {
        id: uid(),
        date: new Date().toISOString(),
        type: delta >= 0 ? 'incoming' : 'outgoing',
        itemName: prodName,
        quantity: Math.abs(delta),
        unit: prodUnit,
        note: reason
      };

      return {
        ...prev,
        products: updatedProducts,
        warehouseLogs: [...(prev.warehouseLogs || []), log]
      };
    });
  }, [updateDB]);

  // Contracts / Promissory Notes CRUD
  const saveContract = useCallback((contract) => {
    updateDB(prev => {
      const existingIdx = (prev.contracts || []).findIndex(c => c.id === contract.id);
      let nextContracts;
      if (existingIdx >= 0) {
        nextContracts = prev.contracts.map(c => c.id === contract.id ? { ...c, ...contract, updatedAt: new Date().toISOString() } : c);
      } else {
        nextContracts = [...(prev.contracts || []), { id: uid(), ...contract, createdAt: new Date().toISOString() }];
      }
      return { ...prev, contracts: nextContracts };
    });
    toast('Qarz shartnomasi saqlandi');
  }, [updateDB, toast]);

  const deleteContract = useCallback((id) => {
    updateDB(prev => ({
      ...prev,
      contracts: (prev.contracts || []).filter(c => c.id !== id)
    }));
    toast('Shartnoma o\'chirildi');
  }, [updateDB, toast]);

  // ===== V3.0 ENTERPRISE: SUPPLIERS & SUPPLY ORDERS =====
  const addSupplier = useCallback((supplier) => {
    updateDB(prev => ({
      ...prev,
      suppliers: [...(prev.suppliers || []), {
        id: uid(),
        name: supplier.name,
        company: supplier.company || '',
        category: supplier.category || 'Zavod / Ishlab chiqaruvchi',
        phone: supplier.phone || '',
        address: supplier.address || '',
        inn: supplier.inn || '',
        bankAccount: supplier.bankAccount || '',
        mfo: supplier.mfo || '',
        note: supplier.note || '',
        createdAt: new Date().toISOString()
      }]
    }));
    toast('Yangi ta\'minotchi qo\'shildi');
  }, [updateDB, toast]);

  const updateSupplier = useCallback((id, updates) => {
    updateDB(prev => ({
      ...prev,
      suppliers: (prev.suppliers || []).map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)
    }));
    toast('Ta\'minotchi ma\'lumotlari yangilandi');
  }, [updateDB, toast]);

  const deleteSupplier = useCallback((id) => {
    updateDB(prev => ({
      ...prev,
      suppliers: (prev.suppliers || []).filter(s => s.id !== id),
      supplyOrders: (prev.supplyOrders || []).filter(o => o.supplierId !== id),
      supplierPayments: (prev.supplierPayments || []).filter(p => p.supplierId !== id)
    }));
    toast('Ta\'minotchi va unga bog\'liq yozuvlar o\'chirildi');
  }, [updateDB, toast]);

  const supplierBalance = useCallback((supplierId) => {
    if (!db) return 0;
    const orders = (db.supplyOrders || []).filter(o => o.supplierId === supplierId);
    const payments = (db.supplierPayments || []).filter(p => p.supplierId === supplierId);
    const totalOrdered = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return totalOrdered - totalPaid;
  }, [db]);

  const addSupplyOrder = useCallback((order) => {
    updateDB(prev => {
      const next = { ...prev };
      const newOrder = {
        id: uid(),
        ...order,
        orderNo: order.orderNo || `SUP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: order.date || new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString()
      };
      next.supplyOrders = [...(prev.supplyOrders || []), newOrder];

      // Auto update products stock or add new product into warehouse
      if (Array.isArray(order.items) && order.items.length > 0) {
        next.products = [...(prev.products || [])];
        order.items.forEach(it => {
          const pIdx = next.products.findIndex(p => (it.productId && p.id === it.productId) || (it.barcode && p.barcode === it.barcode) || p.name.toLowerCase() === it.name.toLowerCase());
          if (pIdx >= 0) {
            const currentP = next.products[pIdx];
            next.products[pIdx] = {
              ...currentP,
              stock: (currentP.stock || 0) + (Number(it.quantity) || 0),
              costPrice: Number(it.price) || currentP.costPrice || 0,
              updatedAt: new Date().toISOString()
            };
          } else {
            next.products.push({
              id: uid(),
              name: it.name,
              barcode: it.barcode || '',
              category: 'Boshqa',
              price: (Number(it.price) || 0) * 1.25, // default 25% markup
              costPrice: Number(it.price) || 0,
              stock: Number(it.quantity) || 0,
              unit: it.unit || 'dona',
              minStock: 5,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        });

        // Add warehouse log
        const logs = order.items.map(it => ({
          id: uid(),
          date: newOrder.date,
          type: 'supply',
          itemName: it.name,
          quantity: it.quantity,
          unit: it.unit || 'dona',
          note: `Ta\'minotchi kirimi (${newOrder.orderNo})`
        }));
        next.warehouseLogs = [...(prev.warehouseLogs || []), ...logs];
      }

      return next;
    });
    toast('Tovar qabuli muvaffaqiyatli saqlandi');
  }, [updateDB, toast]);

  const addSupplierPayment = useCallback((payment) => {
    updateDB(prev => {
      const next = { ...prev };
      const newPay = {
        id: uid(),
        ...payment,
        date: payment.date || new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString()
      };
      next.supplierPayments = [...(prev.supplierPayments || []), newPay];

      // If card was chosen, deduct card balance
      if (payment.cardId) {
        next.cards = (prev.cards || []).map(cd => cd.id === payment.cardId ? { ...cd, balance: cd.balance - Number(payment.amount) } : cd);
        next.cardTx = [...(prev.cardTx || []), {
          id: uid(),
          type: 'supplier_pay',
          cardId: payment.cardId,
          amount: payment.amount,
          note: `Ta\'minotchiga to\'lov (${payment.supplierName || 'Ta\'minotchi'})`,
          date: new Date().toISOString()
        }];
      }

      return next;
    });
    toast('Ta\'minotchiga to\'lov qayd etildi');
  }, [updateDB, toast]);

  // ===== V3.0 ENTERPRISE: INVOICES (HISOB-FAKTURALAR) =====
  const addInvoice = useCallback((inv) => {
    updateDB(prev => ({
      ...prev,
      invoices: [...(prev.invoices || []), {
        id: uid(),
        invoiceNo: inv.invoiceNo,
        date: inv.date,
        dueDate: inv.dueDate,
        clientId: inv.clientId || null,
        clientName: inv.clientName || 'Mijoz',
        clientPhone: inv.clientPhone || '',
        clientInn: inv.clientInn || '',
        clientAddress: inv.clientAddress || '',
        items: inv.items || [],
        subtotal: inv.subtotal || 0,
        discountPercent: inv.discountPercent || 0,
        vatPercent: inv.vatPercent || 0,
        grandTotal: inv.grandTotal || 0,
        currency: inv.currency || 'so\'m',
        notes: inv.notes || '',
        status: inv.status || 'draft',
        createdAt: new Date().toISOString()
      }]
    }));
    toast('Hisob-faktura saqlandi');
  }, [updateDB, toast]);

  const updateInvoice = useCallback((id, updates) => {
    updateDB(prev => ({
      ...prev,
      invoices: (prev.invoices || []).map(inv => inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv)
    }));
    toast('Faktura yangilandi');
  }, [updateDB, toast]);

  const deleteInvoice = useCallback((id) => {
    updateDB(prev => ({
      ...prev,
      invoices: (prev.invoices || []).filter(inv => inv.id !== id)
    }));
    toast('Faktura o\'chirildi');
  }, [updateDB, toast]);

  const updateInvoiceStatus = useCallback((id, newStatus) => {
    updateDB(prev => {
      const inv = (prev.invoices || []).find(i => i.id === id);
      if (!inv) return prev;
      const next = {
        ...prev,
        invoices: prev.invoices.map(i => i.id === id ? { ...i, status: newStatus, updatedAt: new Date().toISOString() } : i)
      };

      // If marked as paid and client is attached, add to kassa and transaction ledger
      if (newStatus === 'paid' && inv.clientId) {
        next.transactions = [...(prev.transactions || []), {
          id: uid(),
          clientId: inv.clientId,
          type: 'payment',
          amount: inv.grandTotal,
          date: new Date().toISOString().slice(0, 10),
          note: `Faktura to\'lovi (${inv.invoiceNo})`,
          receiptNumber: `RCP-${inv.invoiceNo}`
        }];
      }
      return next;
    });
    toast(`Faktura holati: "${newStatus}" ga o\'zgartirildi`);
  }, [updateDB, toast]);

  // ===== V3.0 ENTERPRISE: EMPLOYEES & PAYROLL =====
  const addEmployee = useCallback((emp) => {
    updateDB(prev => ({
      ...prev,
      employees: [...(prev.employees || []), {
        id: uid(),
        name: emp.name,
        role: emp.role || 'Sotuvchi / Kassir',
        phone: emp.phone || '',
        passport: emp.passport || '',
        address: emp.address || '',
        hireDate: emp.hireDate || new Date().toISOString().slice(0, 10),
        salaryType: emp.salaryType || 'fixed', // 'fixed' | 'commission' | 'both'
        baseSalary: Number(emp.baseSalary) || 0,
        commissionPercent: Number(emp.commissionPercent) || 0,
        status: 'active',
        createdAt: new Date().toISOString()
      }]
    }));
    toast('Yangi xodim qo\'shildi');
  }, [updateDB, toast]);

  const updateEmployee = useCallback((id, updates) => {
    updateDB(prev => ({
      ...prev,
      employees: (prev.employees || []).map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e)
    }));
    toast('Xodim ma\'lumotlari yangilandi');
  }, [updateDB, toast]);

  const deleteEmployee = useCallback((id) => {
    updateDB(prev => ({
      ...prev,
      employees: (prev.employees || []).filter(e => e.id !== id),
      advances: (prev.advances || []).filter(a => a.employeeId !== id),
      payrolls: (prev.payrolls || []).filter(p => p.employeeId !== id)
    }));
    toast('Xodim tizimdan o\'chirildi');
  }, [updateDB, toast]);

  const addAdvance = useCallback((adv) => {
    updateDB(prev => ({
      ...prev,
      advances: [...(prev.advances || []), {
        id: uid(),
        employeeId: adv.employeeId,
        employeeName: adv.employeeName,
        amount: Number(adv.amount) || 0,
        date: adv.date || new Date().toISOString().slice(0, 10),
        note: adv.note || 'Avans',
        status: 'unsettled',
        createdAt: new Date().toISOString()
      }]
    }));
    toast('Xodimga avans berildi');
  }, [updateDB, toast]);

  const deleteAdvance = useCallback((id) => {
    updateDB(prev => ({
      ...prev,
      advances: (prev.advances || []).filter(a => a.id !== id)
    }));
    toast('Avans yozuvi o\'chirildi');
  }, [updateDB, toast]);

  const addPayroll = useCallback((pay) => {
    updateDB(prev => {
      const next = { ...prev };
      next.payrolls = [...(prev.payrolls || []), {
        id: uid(),
        ...pay,
        createdAt: new Date().toISOString()
      }];
      // Mark advances for that period as settled
      if (pay.employeeId) {
        next.advances = (prev.advances || []).map(a => a.employeeId === pay.employeeId ? { ...a, status: 'settled' } : a);
      }
      return next;
    });
    toast('Oylik maosh vedomosti tasdiqlandi');
  }, [updateDB, toast]);

  // ===== V3.0 ENTERPRISE: SMART REMINDERS & CALL LOGS =====
  const addReminder = useCallback((rem) => {
    updateDB(prev => ({
      ...prev,
      reminders: [...(prev.reminders || []), {
        id: uid(),
        clientId: rem.clientId || null,
        clientName: rem.clientName || 'Mijoz',
        clientPhone: rem.clientPhone || '',
        title: rem.title,
        dueDate: rem.dueDate,
        amount: Number(rem.amount) || 0,
        priority: rem.priority || 'medium', // 'high' | 'medium' | 'low'
        status: 'pending',
        notes: rem.notes || '',
        createdAt: new Date().toISOString()
      }]
    }));
    toast('Eslatma rejalashtirildi');
  }, [updateDB, toast]);

  const toggleReminderDone = useCallback((id) => {
    updateDB(prev => ({
      ...prev,
      reminders: (prev.reminders || []).map(r => r.id === id ? { ...r, status: r.status === 'completed' ? 'pending' : 'completed' } : r)
    }));
  }, [updateDB]);

  const deleteReminder = useCallback((id) => {
    updateDB(prev => ({
      ...prev,
      reminders: (prev.reminders || []).filter(r => r.id !== id)
    }));
    toast('Eslatma o\'chirildi');
  }, [updateDB, toast]);

  const addCallLog = useCallback((log) => {
    updateDB(prev => ({
      ...prev,
      callLogs: [...(prev.callLogs || []), {
        id: uid(),
        ...log,
        date: log.date || new Date().toISOString(),
        createdAt: new Date().toISOString()
      }]
    }));
    toast('Muloqot jurnali qayd etildi');
  }, [updateDB, toast]);

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

  // ===== V3.5 ENTERPRISE: BRANCHES & MULTI-STORE =====
  const addBranch = useCallback((branch) => {
    updateDB(prev => ({
      ...prev,
      branches: [...(prev.branches || []), {
        id: uid(),
        name: branch.name,
        address: branch.address || '',
        phone: branch.phone || '',
        manager: branch.manager || '',
        isMain: false,
        createdAt: new Date().toISOString()
      }]
    }));
    toast('Yangi filial muvaffaqiyatli qo\'shildi');
  }, [updateDB, toast]);

  const updateBranch = useCallback((id, updates) => {
    updateDB(prev => ({
      ...prev,
      branches: (prev.branches || []).map(b => b.id === id ? { ...b, ...updates } : b)
    }));
    toast('Filial ma\'lumotlari yangilandi');
  }, [updateDB, toast]);

  const deleteBranch = useCallback((id) => {
    updateDB(prev => {
      const remaining = (prev.branches || []).filter(b => b.id !== id);
      return {
        ...prev,
        branches: remaining,
        currentBranchId: prev.currentBranchId === id ? (remaining[0]?.id || 'main') : prev.currentBranchId
      };
    });
    toast('Filial o\'chirildi');
  }, [updateDB, toast]);

  const switchBranch = useCallback((branchId) => {
    updateDB(prev => ({ ...prev, currentBranchId: branchId }));
  }, [updateDB]);

  // ===== V3.5 ENTERPRISE: COLLATERAL & GUARANTORS (GAROV VA KAFIL) =====
  const addCollateral = useCallback((col) => {
    updateDB(prev => ({
      ...prev,
      collaterals: [...(prev.collaterals || []), {
        id: uid(),
        clientId: col.clientId,
        type: col.type || 'texnika', // tilla, avto, mulk, texnika, boshqa
        title: col.title,
        estimatedValue: Number(col.estimatedValue) || 0,
        condition: col.condition || 'Yaxshi',
        storageLocation: col.storageLocation || 'Do\'kon seyfi',
        guarantorName: col.guarantorName || '',
        guarantorPhone: col.guarantorPhone || '',
        guarantorPassport: col.guarantorPassport || '',
        photoUrl: col.photoUrl || '',
        notes: col.notes || '',
        status: 'held', // held, returned, liquidated
        createdAt: new Date().toISOString()
      }]
    }));
    toast('Garov va kafil ma\'lumotlari biriktirildi');
  }, [updateDB, toast]);

  const deleteCollateral = useCallback((id) => {
    updateDB(prev => ({
      ...prev,
      collaterals: (prev.collaterals || []).filter(c => c.id !== id)
    }));
    toast('Garov yozuvi o\'chirildi');
  }, [updateDB, toast]);

  const updateCollateralStatus = useCallback((id, status) => {
    updateDB(prev => ({
      ...prev,
      collaterals: (prev.collaterals || []).map(c => c.id === id ? { ...c, status } : c)
    }));
    toast(`Garov holati: "${status}" ga o'zgartirildi`);
  }, [updateDB, toast]);

  // ===== V3.5 ENTERPRISE: MONETIZATION & SUBSCRIPTIONS =====
  const buySubscription = useCallback((planId, months = 1) => {
    updateDB(prev => {
      const validDate = new Date();
      validDate.setMonth(validDate.getMonth() + Number(months));
      return {
        ...prev,
        subscription: {
          plan: planId,
          validUntil: validDate.toISOString().slice(0, 10),
          status: 'active',
          updatedAt: new Date().toISOString()
        }
      };
    });
    toast(`Tabriklaymiz! "${planId.toUpperCase()}" tarifi faollashtirildi 🎉`);
  }, [updateDB, toast]);

  const buySmsPackage = useCallback((count) => {
    updateDB(prev => ({
      ...prev,
      smsBalance: (prev.smsBalance || 0) + Number(count)
    }));
    toast(`${count} ta SMS xabarnoma balansingizga qo'shildi!`);
  }, [updateDB, toast]);

  const sendSmsReminder = useCallback((phone, message) => {
    let sent = false;
    updateDB(prev => {
      if ((prev.smsBalance || 0) <= 0) {
        toast('SMS balansingizda mablag\' yetarli emas! Iltimos, SMS paket xarid qiling.', 'warning');
        return prev;
      }
      sent = true;
      return {
        ...prev,
        smsBalance: prev.smsBalance - 1,
        callLogs: [...(prev.callLogs || []), {
          id: uid(),
          clientPhone: phone,
          type: 'sms',
          note: message,
          date: new Date().toISOString(),
          status: 'sent'
        }]
      };
    });
    if (sent) {
      toast(`SMS muvaffaqiyatli jo'natildi (${phone})`);
    }
    return sent;
  }, [updateDB, toast]);

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
    try {
      await fetch(`${getApiBase()}/api/users/${targetUsername}`, { method: 'DELETE' });
    } catch (e) { /* ignore backend offline */ }

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
      try {
        await loadSystemConfig().catch(() => {});
        await loadSystemLogs().catch(() => {});
        const accs = await loadAccountsFromStorage().catch(() => []);
        const sessionUser = await loadSessionFromStorage().catch(() => null);
        if (sessionUser && accs && accs.some(a => a.username === sessionUser)) {
          const data = await loadDBFromStorage(sessionUser).catch(() => defaultDB());
          setCurrentUser(sessionUser);
          setDb(data);
          applyTheme(data?.theme || 'light');
          applyAccent(data?.accent || 'gold');
          if (!data?.pinHash) {
            setAuthState('pin');
            setPinMode('setup1');
          } else {
            setAuthState('pin');
            setPinMode('enter');
          }
        } else {
          setAuthState('auth');
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setAuthState('auth');
      } finally {
        setInitialized(true);
      }
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
    // Warehouse & Products
    addProduct, updateProduct, deleteProduct, adjustProductStock,
    // Contracts
    saveContract, deleteContract,
    // Enterprise v3.0: Suppliers
    addSupplier, updateSupplier, deleteSupplier, supplierBalance, addSupplyOrder, addSupplierPayment,
    // Enterprise v3.0: Invoices
    addInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus,
    // Enterprise v3.0: Employees & Payroll
    addEmployee, updateEmployee, deleteEmployee, addAdvance, deleteAdvance, addPayroll,
    // Enterprise v3.0: Reminders & Call Logs
    addReminder, toggleReminderDone, deleteReminder, addCallLog,
    // Enterprise v3.5: Branches & Multi-store
    addBranch, updateBranch, deleteBranch, switchBranch,
    // Enterprise v3.5: Collateral & Guarantors
    addCollateral, deleteCollateral, updateCollateralStatus,
    // Enterprise v3.5: Subscriptions & SMS
    buySubscription, buySmsPackage, sendSmsReminder,
    updateSettings, changePin, changePassword, deleteAccount,
    wipeData, exportData, importData, exportCards, importCards,
    updateDB,
    // Admin functions
    adminBlockUser, adminUnblockUser, adminResetUserPassword, adminResetUserPin,
    adminDeleteUser, loadAccountsFromStorage,
    toggleSystemLockdown, toggleMaintenance, updateSystemConfigValues, addSecurityLog,
    // Notifications
    notifications, addNotification, markAllNotificationsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

