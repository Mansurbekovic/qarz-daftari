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
  if (!client) return { stars: 5, points: 100, label: 'Yangi mijoz', color: 'teal', risk: 'low' };
  if (client.isBlacklisted) return { stars: 0, points: 15, label: "Qora ro'yxatda (Ishonchsiz)", color: 'rust', risk: 'critical', isBlacklisted: true };
  const clientTxs = txs.filter(t => t.clientId === client.id);
  if (clientTxs.length === 0) return { stars: 5, label: 'Yangi mijoz', color: 'teal' };

  const debts = clientTxs.filter(t => t.type === 'debt');
  const payments = clientTxs.filter(t => t.type === 'payment');
  const totalDebt = debts.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalPaid = payments.reduce((s, t) => s + Number(t.amount || 0), 0);
  const today = todayISO();
  const overdueTxs = debts.filter(t => t.dueDate && t.dueDate < today && (totalDebt - totalPaid) > 0);

  if (overdueTxs.length >= 2) {
    return { stars: 1, points: 30, label: 'Xavfli / Ko\'p kechiktiruvchi', color: 'rust', risk: 'high' };
  }
  if (overdueTxs.length === 1) {
    return { stars: 3, points: 65, label: 'O\'rtacha ishonch', color: 'gold', risk: 'medium' };
  }
  if (totalPaid >= totalDebt * 0.7 && debts.length >= 2) {
    return { stars: 5, points: 98, label: 'A\'lo / Doimiy ishonchli', color: 'teal', risk: 'low' };
  }
  return { stars: 4, points: 85, label: 'Yaxshi mijoz', color: 'teal', risk: 'low' };
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

export const getBackendUrl = getApiBase;

// Web Audio API Beep feedback for barcode and actions
export function playBeep(type = 'success') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // AudioContext blocked by browser policy until interaction
  }
}

// Generate Contract / Promissory Note Number
export function generateContractNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SH-${dateStr}-${rand}`;
}

// Format Passport / ID (e.g. AA 1234567 or AB1234567)
export function formatPassport(val) {
  if (!val) return '';
  const cleaned = String(val).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length > 2) {
    return cleaned.slice(0, 2) + ' ' + cleaned.slice(2, 9);
  }
  return cleaned;
}

// Smart Speech-to-Debt Parser (Extracts name, amount, items from speech)
export function parseVoiceDebt(text) {
  if (!text) return { raw: '', amount: null, note: '', items: [] };

  const raw = text.trim();
  let note = raw;
  let amount = null;
  const items = [];

  // Match numbers (e.g. 50 000, 50000, 50 ming, 50k)
  const mingMatch = raw.match(/(\d+(?:[\s.,]\d+)?)\s*(?:ming|k)\b/i);
  const mlnMatch = raw.match(/(\d+(?:[\s.,]\d+)?)\s*(?:million|mln|m)\b/i);
  const plainNumMatch = raw.match(/(\d[\d\s.,]{3,})\s*(?:so['`]?m)?/i);

  if (mingMatch) {
    const n = parseFloat(mingMatch[1].replace(/[\s,]/g, ''));
    if (!isNaN(n)) amount = n * 1000;
  } else if (mlnMatch) {
    const n = parseFloat(mlnMatch[1].replace(/[\s,]/g, ''));
    if (!isNaN(n)) amount = n * 1000000;
  } else if (plainNumMatch) {
    const n = parseFloat(plainNumMatch[1].replace(/[\s,]/g, ''));
    if (!isNaN(n) && n > 0) amount = n;
  }

  // Parse simple items like "2 ta yog", "5 kg un"
  const itemRegex = /(\d+(?:[\s.,]\d+)?)\s*(ta|kg|litr|metr|dona|quti|blok|pachka)\s+([a-zA-Zа-яА-Яo'g'shch]+)/gi;
  let match;
  while ((match = itemRegex.exec(raw)) !== null) {
    const qty = parseFloat(match[1].replace(/[\s,]/g, '')) || 1;
    const unit = match[2].toLowerCase();
    const name = match[3];
    items.push({
      id: uid(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      quantity: qty,
      unit: unit === 'ta' ? 'dona' : unit,
      price: 0,
      subtotal: 0
    });
  }

  return { raw, amount, note, items };
}

// Generate Click/Payme Direct Payment URI
export function generatePaymentLink(provider, cardOrPhone, amount, comment = 'Qarz to\'lovi') {
  if (provider === 'payme') {
    // Payme P2P / merchant link
    const cleanCard = String(cardOrPhone || '').replace(/\D/g, '');
    const tiAmount = (amount || 0) * 100; // in tiyin
    return `https://checkout.paycom.uz/${encodeURIComponent(cleanCard || '')}?a=${tiAmount}&c=${encodeURIComponent(comment)}`;
  } else if (provider === 'click') {
    // Click P2P link
    const cleanNum = String(cardOrPhone || '').replace(/\D/g, '');
    return `https://my.click.uz/services/p2p?card=${cleanNum}&amount=${amount || ''}&desc=${encodeURIComponent(comment)}`;
  }
  return `https://payme.uz`;
}


// Generate Electronic Invoice (Hisob-faktura) Number
export function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `INV-${year}-${rand}`;
}

// Generate Supply Order (Kirim hujjati) Number
export function generateSupplyOrderNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SUP-${year}-${rand}`;
}

// Format INN (Tax ID - 9 digits)
export function formatINN(val) {
  if (!val) return '';
  return String(val).replace(/\D/g, '').slice(0, 9);
}

// Format MFO (Bank code - 5 digits)
export function formatMFO(val) {
  if (!val) return '';
  return String(val).replace(/\D/g, '').slice(0, 5);
}

// Calculate Days Difference to Due Date (Negative = Overdue, Positive = Days Left)
export function getDaysDifference(dueDate) {
  if (!dueDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Number to Uzbek Words (Yozma summa generatsiyasi)
export function numberToUzbekWords(num) {
  if (!num || isNaN(num) || num <= 0) return "nol so'm";

  const ones = ['', 'bir', 'ikki', 'uch', "to'rt", 'besh', 'olti', 'yetti', 'sakkiz', "to'qqiz"];
  const tens = ['', "o'n", 'yigirma', "o'ttiz", 'qirq', 'ellik', 'oltmish', 'yetmish', 'sakson', "to'qson"];
  const scales = ['', 'ming', 'million', 'milliard', 'trillion'];

  function convertHundreds(n) {
    let result = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;

    if (h > 0) {
      result += (h === 1 ? 'bir yuz ' : ones[h] + ' yuz ');
    }
    if (t > 0) {
      result += tens[t] + ' ';
    }
    if (o > 0) {
      result += ones[o] + ' ';
    }
    return result.trim();
  }

  const integerPart = Math.floor(num);
  if (integerPart === 0) return "nol so'm";

  let parts = [];
  let temp = integerPart;
  let scaleIndex = 0;

  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const chunkText = convertHundreds(chunk);
      const scaleText = scales[scaleIndex];
      parts.unshift((chunkText + (scaleText ? ' ' + scaleText : '')).trim());
    }
    temp = Math.floor(temp / 1000);
    scaleIndex++;
  }

  const capitalized = parts.join(' ');
  return capitalized.charAt(0).toUpperCase() + capitalized.slice(1) + " so'm";
}

// Calculate Line Items, Tax, and Discounts for Invoicing
export function calculateInvoiceTotals(items = [], discountPercent = 0, vatPercent = 0) {
  const subtotal = items.reduce((acc, it) => acc + ((Number(it.price) || 0) * (Number(it.quantity || it.qty || 0))), 0);
  const discountAmount = (subtotal * (Number(discountPercent) || 0)) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const vatAmount = (taxableAmount * (Number(vatPercent) || 0)) / 100;
  const grandTotal = taxableAmount + vatAmount;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    vatAmount,
    grandTotal
  };
}
