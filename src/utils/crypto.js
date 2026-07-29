export async function sha256(text) {
  try {
    if (window.crypto && window.crypto.subtle) {
      const enc = new TextEncoder().encode(text);
      const buf = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) { /* fallback below */ }
  let h1 = 0, h2 = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = (Math.imul(h1, 31) + c) | 0;
    h2 = (Math.imul(h2, 131) + c) | 0;
  }
  return 'fb' + (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}
