export const APP_VERSION = 'v1.2 Pro';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Bosh sahifa', icon: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>' },
  { id: 'clients', label: 'Mijozlar', icon: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="8.5" r="2.4"/><path d="M15.5 14.2c2.7.4 4.6 2.4 4.6 5.3"/>' },
  { id: 'kassa', label: 'Kassa & Savdo', icon: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>' },
  { id: 'transactions', label: 'Tranzaksiyalar', icon: '<path d="M4 7h13l-3-3M20 17H7l3 3"/>' },
  { id: 'wallet', label: 'Kartalar', icon: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="16.5" cy="14.2" r="1.2" fill="currentColor" stroke="none"/>' },
  { id: 'stats', label: 'Statistika', icon: '<path d="M4 20V10M11 20V4M18 20v-7"/>' },
  { id: 'settings', label: 'Sozlamalar', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.44.42.82.8 1.09.32.2.7.31 1.1.31H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' },
  { id: 'admin', label: 'Admin Panel', icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', adminOnly: true },
];

export const BANK_PRESETS = {
  Uzcard: { grad: 'linear-gradient(135deg,#1F6E5C,#0A3A2E)' },
  Humo: { grad: 'linear-gradient(135deg,#5B3A8B,#2A1750)' },
  Visa: { grad: 'linear-gradient(135deg,#1B3E7A,#0A1F45)' },
  Mastercard: { grad: 'linear-gradient(135deg,#B23A2B,#6E1E14)' },
  Anorbank: { grad: 'linear-gradient(135deg,#0F7B6C,#0A4F42)' },
  Kapitalbank: { grad: 'linear-gradient(135deg,#2166A5,#113D68)' },
  Mikrokreditbank: { grad: 'linear-gradient(135deg,#8A2A2A,#4A1111)' },
  Boshqa: { grad: 'linear-gradient(135deg,#A9821F,#5C4610)' },
};

export const CARD_TYPES = {
  virtual: { label: 'Virtual karta', emoji: '✨', desc: 'Ilova ichida darhol yaratiladi' },
  plastic: { label: 'Plastik karta', emoji: '💳', desc: 'Sizda mavjud jismoniy karta' },
  online: { label: 'Onlayn karta', emoji: '🌐', desc: 'Faqat onlayn to\'lovlar uchun' },
};

export const ACCENTS = {
  gold: '#A9821F',
  teal: '#1F6E5C',
  rust: '#8B3A2B',
  plum: '#6A3E7A',
  blue: '#2A5FA5',
};

export const CARD_BIN_PREFIXES = {
  '8600': 'Uzcard',
  '9860': 'Humo',
  '4': 'Visa',
  '5': 'Mastercard',
};

export const PAYMENT_PROVIDERS = {
  payme: { name: 'Payme', color: '#00CCCC', icon: '💎', url: 'https://payme.uz' },
  click: { name: 'Click', color: '#00B5E2', icon: '🔵', url: 'https://click.uz' },
  paynet: { name: 'Paynet', color: '#ED1C24', icon: '🔴', url: 'https://paynet.uz' },
};

export const MEASURE_UNITS = ['dona', 'kg', 'litr', 'metr', 'quti', 'pachka', 'blok', 'm²'];

export const CLIENT_CATEGORIES = ['Oddiy', 'Doimiy', 'Ulgurji (Optom)', 'VIP', 'Qarindosh/Tanish', 'Ishonchli', 'Muammoli'];

export const PAGE_TITLES = {
  dashboard: 'Bosh sahifa',
  clients: 'Mijozlar',
  kassa: 'Kassa & Savdo Jurnali',
  transactions: 'Barcha tranzaksiyalar',
  wallet: 'Kartalarim',
  stats: 'Statistika & Tahlil',
  settings: 'Sozlamalar',
  clientDetail: 'Mijoz kartasi',
  admin: 'Admin Panel — Tizim Nazorati',
};

export const ACCOUNTS_KEY = 'qd-accounts-index';
export const SESSION_KEY = 'qd-session';
export const SYSTEM_CONFIG_KEY = 'qd-system-config';
export const SYSTEM_LOGS_KEY = 'qd-system-logs';

export function dbKeyFor(username) { return 'qd-db::' + username; }

export function defaultDB() {
  return {
    pinHash: null,
    businessName: 'Mening biznesim',
    phone: '',
    address: '',
    theme: 'light',
    accent: 'gold',
    autoLockMinutes: 5,
    currency: "so'm",
    exchangeRate: 12850,
    notifications: true,
    ageConfirmed: false,
    clients: [],
    transactions: [],
    cards: [],
    cardTx: [],
    kassaEntries: [],
  };
}

export function defaultSystemConfig() {
  return {
    lockdown: false,
    maintenance: false,
    maxTxAmount: 500000000, // 500M sum max transaction
    rateLimitPerMin: 15,
    detectVpnProxy: true,
    blockSuspiciousIps: true,
  };
}

