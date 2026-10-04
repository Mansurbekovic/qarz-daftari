export const APP_VERSION = 'v1.0 Sodda Qarz Daftari';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Qarz Daftari', icon: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/><path d="M6 14h6"/>' },
  { id: 'settings', label: 'Sozlamalar', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.44.42.82.8 1.09.32.2.7.31 1.1.31H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' },
];

export const BANK_PRESETS = {};
export const CARD_TYPES = {};

export const ACCENTS = {
  gold: '#A9821F',
  teal: '#1F6E5C',
  rust: '#8B3A2B',
  plum: '#6A3E7A',
  blue: '#2A5FA5',
};

export const PAGE_TITLES = {
  dashboard: 'Qarz Daftari',
  clientDetail: 'Mijoz Qarzi',
  settings: 'Sozlamalar va Profil',
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
