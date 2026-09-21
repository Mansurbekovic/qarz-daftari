export const APP_VERSION = 'v3.5 Enterprise Pro';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Bosh sahifa', icon: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>' },
  { id: 'clients', label: 'Mijozlar (Nasiya)', icon: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="8.5" r="2.4"/><path d="M15.5 14.2c2.7.4 4.6 2.4 4.6 5.3"/>' },
  { id: 'messages', label: 'SMS & Chat', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/>' },
  { id: 'debtRequests', label: 'Qarz So\'rovlari', icon: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
  { id: 'warehouse', label: 'Omborxona (Sklad)', icon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>' },
  { id: 'kassa', label: 'Kassa & Savdo', icon: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>' },
  { id: 'suppliers', label: 'Ta\'minotchilar (Optom)', icon: '<rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>' },
  { id: 'invoices', label: 'Hisob-Faktura (B2B)', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' },
  { id: 'branches', label: 'Filiallar & Tarmoq', icon: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>' },
  { id: 'employees', label: 'Xodimlar & Oylik', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { id: 'reminders', label: 'Aqlli Eslatmalar', icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><circle cx="12" cy="2" r="1"/>' },
  { id: 'reports', label: 'Moliya & Foyda-Zarar', icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><path d="M2 20h20"/>' },
  { id: 'subscriptions', label: 'PRO Tarif & SMS Do\'kon', icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
  { id: 'transactions', label: 'Tranzaksiyalar', icon: '<path d="M4 7h13l-3-3M20 17H7l3 3"/>' },
  { id: 'wallet', label: 'Kartalarim', icon: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="16.5" cy="14.2" r="1.2" fill="currentColor" stroke="none"/>' },
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

export const MEASURE_UNITS = ['dona', 'kg', 'litr', 'metr', 'quti', 'pachka', 'blok', 'm²', 'tonna', 'komplekt'];

export const CLIENT_CATEGORIES = ['Oddiy', 'Doimiy', 'Ulgurji (Optom)', 'VIP', 'Qarindosh/Tanish', 'Ishonchli', 'Muammoli'];

export const PRODUCT_CATEGORIES = [
  'Oziq-ovqat',
  'Ichimliklar',
  'Maishiy kimyo',
  'Qurilish mollari',
  'Kiyim-kechak',
  'Elektronika',
  'Avtoehtiyot qismlar',
  'Xizmatlar',
  'Boshqa'
];

export const SUPPLIER_CATEGORIES = [
  'Zavod / Ishlab chiqaruvchi',
  'Ulgurji Baza (Optovik)',
  'Importyor / Distribyutor',
  'Diler',
  'Xizmat ko\'rsatuvchi',
  'Boshqa'
];

export const EMPLOYEE_ROLES = [
  'Boshqaruvchi / Direktor',
  'Katta sotuvchi',
  'Sotuvchi / Kassir',
  'Omborchi / Ta\'minotchi',
  'Haydovchi / Kuryer',
  'Hisobchi',
  'Yordamchi'
];

export const INVOICE_STATUSES = {
  draft: { label: 'Qoralama', color: 'gray', badge: '📝' },
  sent: { label: 'Yuborilgan', color: 'blue', badge: '📤' },
  partially_paid: { label: 'Qisman to\'langan', color: 'gold', badge: '⏳' },
  paid: { label: 'To\'liq to\'landi', color: 'teal', badge: '✅' },
  overdue: { label: 'Muddati o\'tgan', color: 'rust', badge: '⚠️' },
  cancelled: { label: 'Bekor qilingan', color: 'muted', badge: '🚫' }
};

export const PAGE_TITLES = {
  dashboard: 'Bosh sahifa & Tahliliy Markaz',
  clients: 'Mijozlar & Nasiya Daftari',
  messages: 'SMS & Chat Muloqot Markazi',
  debtRequests: 'Mijozlar Qarz va Nasiya So\'rovlari',
  warehouse: 'Omborxona & Sklad',
  kassa: 'Kassa & Savdo Jurnali',
  suppliers: 'Yetkazib Beruvchilar (Optom)',
  invoices: 'Elektron Hisob-Fakturalar (B2B)',
  branches: 'Filiallar & Savdo Nuqtalari Tarmog\'i',
  employees: 'Xodimlar & Oylik Maosh',
  reminders: 'Aqlli Eslatmalar & Kalendar',
  reports: 'Moliya & Foyda-Zarar Tahlili',
  subscriptions: 'Monetizatsiya & PRO Tariflar',
  transactions: 'Barcha Tranzaksiyalar',
  wallet: 'Mening Kartalarim',
  stats: 'Statistika & Tahlil',
  settings: 'Tizim Sozlamalari',
  clientDetail: 'Mijoz Profili & Nasiyalar',
  clientPortal: 'Mijoz Ochiq Portali',
  admin: 'Admin Panel — Tizim Nazorati',
};

export const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Start (Bepul)',
    price: 0,
    period: 'Doimiy',
    description: 'Boshlang\'ich kichik savdo nuqtalari uchun',
    features: [
      '20 tagacha mijoz hisobi',
      'Asosiy qarz daftari',
      'Oddiy kassa amaliyotlari',
      'Lokal ma\'lumotlar xavfsizligi'
    ],
    badge: 'Boshlang\'ich'
  },
  {
    id: 'pro',
    name: 'Pro Biznes',
    price: 49000,
    period: 'oyiga',
    description: 'Rivojlanayotgan do\'konlar va savdo markazlari uchun',
    popular: true,
    features: [
      'Cheksiz mijozlar va nasiyalar',
      'Elektron hisob-fakturalar (B2B)',
      'Ta\'minotchilar & Ombor kirimlari',
      'SMS & Telegram eslatmalar',
      'POS chek printeri & Shtrixkod skaner',
      'Eksport: Excel & PDF tilxat generator'
    ],
    badge: 'Eng ommabop'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Korxona',
    price: 149000,
    period: 'oyiga',
    description: 'Yirik do\'konlar tarmog\'i, optom omborlar va kompaniyalar',
    features: [
      'Cheksiz filiallar & savdo nuqtalari',
      'Ko\'p xodimlik tizim & huquqlar (Kassir, Hisobchi)',
      'Xodimlar oyligi & KPI hisoboti',
      'Foyda-Zarar (P&L) moliyaviy tahlil',
      'Mijozlar uchun shaxsiy WebApp portal',
      'Prioritet 24/7 VIP texnik qo\'llab-quvvatlash'
    ],
    badge: 'Maksimal imkoniyat'
  }
];

export const SMS_PACKAGES = [
  { id: 'sms_100', count: 100, price: 20000, perSms: '200 so\'m/dona' },
  { id: 'sms_500', count: 500, price: 85000, perSms: '170 so\'m/dona', popular: true },
  { id: 'sms_2000', count: 2000, price: 280000, perSms: '140 so\'m/dona' },
  { id: 'sms_5000', count: 5000, price: 600000, perSms: '120 so\'m/dona' },
];

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
    passport: '',
    inn: '',
    bankAccount: '',
    mfo: '',
    theme: 'light',
    accent: 'gold',
    autoLockMinutes: 5,
    currency: "so'm",
    exchangeRate: 12850,
    eurRate: 13900,
    rubRate: 140,
    notifications: true,
    ageConfirmed: false,
    clients: [],
    transactions: [],
    cards: [],
    cardTx: [],
    kassaEntries: [],
    products: [],
    warehouseLogs: [],
    contracts: [],
    staff: [],
    userRole: 'admin',
    suppliers: [],
    supplyOrders: [],
    supplierPayments: [],
    invoices: [],
    employees: [],
    advances: [],
    payrolls: [],
    callLogs: [],
    reminders: [],
    collaterals: [],
    branches: [
      {
        id: 'main',
        name: 'Bosh savdo nuqtasi',
        address: 'Toshkent sh.',
        phone: '',
        isMain: true,
        createdAt: new Date().toISOString()
      }
    ],
    currentBranchId: 'main',
    subscription: {
      plan: 'enterprise',
      validUntil: '2030-12-31',
      status: 'active',
      autoRenew: true
    },
    smsBalance: 250,
    loyaltySettings: { enabled: true, percent: 1, minSpend: 50000 },
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
