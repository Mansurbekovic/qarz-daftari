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

// Generate Receipt Number
export function generateReceiptNumber() {
  const d = new Date();
  const dateStr = d.getFullYear().toString().slice(-2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `QD-${dateStr}-${rand}`;
}

// Generate Installment Plan
export function generateInstallmentPlan(totalAmount, months = 3, startDateStr = todayISO()) {
  const numMonths = Math.max(1, Math.min(24, parseInt(months, 10) || 1));
  const baseAmount = Math.floor(totalAmount / numMonths);
  const remainder = totalAmount - (baseAmount * numMonths);
  const start = new Date(startDateStr || todayISO());
  
  const installments = [];
  for (let i = 1; i <= numMonths; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const instAmount = i === numMonths ? baseAmount + remainder : baseAmount;
    installments.push({
      id: uid(),
      month: i,
      dueDate: d.toISOString().slice(0, 10),
      amount: instAmount,
      paid: false,
      paidDate: null,
    });
  }
  return installments;
}

// Calculate Client Trust / Reliability Score
export function calculateClientScore(client, txs = []) {
  if (!client) return { stars: 5, label: 'Yangi mijoz', color: 'teal' };
  const clientTxs = txs.filter(t => t.clientId === client.id);
  if (clientTxs.length === 0) return { stars: 5, label: 'Yangi mijoz', color: 'teal' };

  const debts = clientTxs.filter(t => t.type === 'debt');
  const payments = clientTxs.filter(t => t.type === 'payment');
  const totalDebt = debts.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalPaid = payments.reduce((s, t) => s + Number(t.amount || 0), 0);
  const today = todayISO();
  const overdueTxs = debts.filter(t => t.dueDate && t.dueDate < today && (totalDebt - totalPaid) > 0);

  if (overdueTxs.length > 2) {
    return { stars: 1, label: 'Xavfli / Ko\'p kechiktiruvchi', color: 'rust' };
  }
  if (overdueTxs.length === 1) {
    return { stars: 3, label: 'O\'rtacha ishonch', color: 'gold' };
  }
  if (totalPaid >= totalDebt * 0.7 && debts.length >= 2) {
    return { stars: 5, label: 'A\'lo / Doimiy ishonchli', color: 'teal' };
  }
  return { stars: 4, label: 'Yaxshi mijoz', color: 'teal' };
}

// Advanced Telegram Chek Link
export function telegramReceiptLink(clientName, amount, currency, items = [], totalBalance, businessName = 'Qarz Daftari', cardNum = '') {
  let text = `🧾 *XARID VA NASIYA CHEKI*\n🏢 *${businessName}*\n👤 Mijoz: *${clientName}*\n📅 Sana: ${todayISO()}\n\n`;
  if (items && items.length > 0) {
    text += `📦 *Mahsulotlar:*\n`;
    items.forEach((it, idx) => {
      text += `${idx + 1}. ${it.name} — ${it.qty} ${it.unit || 'dona'} x ${fmtMoney(it.price, currency)} = ${fmtMoney(it.total, currency)}\n`;
    });
    text += `\n`;
  }
  text += `💵 *Ushbu summa:* ${fmtMoney(amount, currency)}\n`;
  if (totalBalance !== undefined) {
    text += `📊 *Jami qarz balansingiz:* ${fmtMoney(totalBalance, currency)}\n`;
  }
  if (cardNum) {
    text += `💳 *To'lov uchun karta:* \`${cardNum}\`\n`;
  }
  text += `\n_Qarz Daftari orqali yuritiladi._`;
  return `https://t.me/share/url?url=${encodeURIComponent(businessName)}&text=${encodeURIComponent(text)}`;
}

// WhatsApp Reminder Link
export function whatsappReminderLink(phone, clientName, amount, currency, businessName = 'Qarz Daftari') {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const text = `Assalomu alaykum ${clientName}! ${businessName} hisob-kitob tizimidan: Sizda ${fmtMoney(amount, currency)} miqdorida qarz mavjud. Iltimos, to'lovni amalga oshiring.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

// Export to CSV / Excel
export function exportToCSV(headers, rows, fileName = 'qarz-daftari-export.csv') {
  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Cyrillic/Uzbek support
  csvContent += headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
  });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Safe fetch with strict timeout to prevent app hanging
export async function fetchWithTimeout(url, options = {}, timeoutMs = 2500) {
  if (typeof AbortController === 'undefined') {
    return fetch(url, options);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Get dynamic API base URL for multi-device network access and cloud deployments
export function getApiBase() {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname || '127.0.0.1';
    // Localhost or local network IP (192.168.x.x, 10.x.x.x, 127.0.0.1, 172.x)
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.')
    ) {
      const protocol = window.location.protocol || 'http:';
      return `${protocol}//${host}:5000`;
    }
    // Production cloud deployment (Render backend)
    return 'https://qarz-daftari.onrender.com';
  }
  return 'http://127.0.0.1:5000';
}



