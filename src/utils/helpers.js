export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function parseMoneyValue(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const raw = String(value).trim();
  if (!raw) return 0;

  const normalized = raw.replace(/\s/g, '');
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');

  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(',');
    const lastDot = normalized.lastIndexOf('.');
    if (lastComma > lastDot) {
      return Number(normalized.replace(/\./g, '').replace(',', '.'));
    }
    return Number(normalized.replace(/,/g, ''));
  }

  if (hasComma) {
    const parts = normalized.split(',');
    if (parts.length > 2) {
      return Number(parts.join(''));
    }
    if (parts[1].length === 3 && parts[0].length > 0) {
      return Number(normalized.replace(/,/g, ''));
    }
    return Number(normalized.replace(',', '.'));
  }

  if (hasDot) {
    const parts = normalized.split('.');
    if (parts.length > 2) {
      return Number(parts.join(''));
    }
    if (parts[1].length === 3 && parts[0].length > 0) {
      return Number(normalized.replace(/\./g, ''));
    }
    return Number(normalized);
  }

  return Number(normalized);
}

export function fmtMoney(n, currency = "so'm") {
  n = Math.round(Number(n) || 0);
  const neg = n < 0;
  n = Math.abs(n);
  return (neg ? '-' : '') + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ' + (currency || "so'm");
}

export function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  const months = ['yan','fev','mar','apr','may','iyun','iyul','avg','sen','okt','noy','dek'];
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function genCardNumber(bank) {
  const prefix = { Uzcard: '8600', Humo: '9860', Visa: '4231', Mastercard: '5412', Boshqa: '6262' }[bank] || '6262';
  let rest = '';
  for (let i = 0; i < 12; i++) rest += Math.floor(Math.random() * 10);
  return prefix + rest;
}

export function maskCardNumber(num) {
  if (!num) return '•••• •••• •••• ••••';
  return num.replace(/(.{4})/g, '$1 ').trim().replace(/\d(?=\d{4})/g, '•');
}

export function futureExpiry(years = 4) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getFullYear()).slice(-2);
}

// Luhn algorithm for card number validation
export function validateCardLuhn(number) {
  if (!number) return false;
  const digits = number.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// Detect card bank from BIN prefix
export function detectCardBank(number) {
  if (!number) return 'Boshqa';
  const digits = number.replace(/\D/g, '');
  if (digits.startsWith('8600')) return 'Uzcard';
  if (digits.startsWith('9860')) return 'Humo';
  if (digits.startsWith('4')) return 'Visa';
  if (digits.startsWith('5')) return 'Mastercard';
  return 'Boshqa';
}

// Format card number with spaces (8600 1234 5678 9012)
export function formatCardInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// Format expiry input (MM/YY)
export function formatExpiryInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

// Validate expiry date
export function validateExpiry(expiry) {
  if (!expiry) return false;
  const parts = expiry.split('/');
  if (parts.length !== 2) return false;
  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10) + 2000;
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expDate = new Date(year, month);
  return expDate > now;
}

// Generate Telegram reminder link
export function telegramReminderLink(clientName, amount, currency) {
  const text = `Assalomu alaykum, ${clientName}! Sizda ${fmtMoney(amount, currency)} miqdorda qarz mavjud. Iltimos, to'lovni amalga oshiring. — Qarz Daftari`;
  return `https://t.me/share/url?url=${encodeURIComponent('Qarz Daftari')}&text=${encodeURIComponent(text)}`;
}

// Generate SMS reminder text
export function smsReminderText(clientName, amount, currency) {
  return `Assalomu alaykum, ${clientName}! Sizda ${fmtMoney(amount, currency)} miqdorda qarz mavjud. Iltimos, to'lovni amalga oshiring.`;
}

// Sanitize text input (Anti-XSS)
export function sanitizeInput(text) {
  if (!text) return '';
  return String(text).replace(/[<>"'&]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;'
  }[c]));
}

// Get dynamic API base URL for multi-device network access
export function getApiBase() {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname || '127.0.0.1';
    const protocol = window.location.protocol || 'http:';
    return `${protocol}//${host}:5000`;
  }
  return 'http://127.0.0.1:5000';
}

// fetch with a hard timeout so an unreachable optional backend never hangs the UI
export function fetchWithTimeout(url, options = {}, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

