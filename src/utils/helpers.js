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
