/**
 * ESC/POS Direct Hardware Thermal Printer Driver for 58mm / 80mm
 * Supports Web Serial (USB/COM) and Web Bluetooth thermal POS printers
 * (e.g. Xprinter, Rongta, POS-58, POS-80, Hoin, Goojprt)
 */

// Command bytes
const ESC = 0x1B;
const GS = 0x1D;

export const ESC_COMMANDS = {
  INIT: new Uint8Array([ESC, 0x40]), // ESC @
  ALIGN_LEFT: new Uint8Array([ESC, 0x61, 0x00]), // ESC a 0
  ALIGN_CENTER: new Uint8Array([ESC, 0x61, 0x01]), // ESC a 1
  ALIGN_RIGHT: new Uint8Array([ESC, 0x61, 0x02]), // ESC a 2
  BOLD_ON: new Uint8Array([ESC, 0x45, 0x01]), // ESC E 1
  BOLD_OFF: new Uint8Array([ESC, 0x45, 0x00]), // ESC E 0
  DOUBLE_SIZE: new Uint8Array([GS, 0x21, 0x11]), // GS ! 17 (Double width & height)
  NORMAL_SIZE: new Uint8Array([GS, 0x21, 0x00]), // GS ! 0
  LINE_FEED: new Uint8Array([0x0A]), // LF
  FEED_3_LINES: new Uint8Array([ESC, 0x64, 0x03]), // ESC d 3
  CUT_PAPER: new Uint8Array([GS, 0x56, 0x42, 0x00]), // GS V 66 0
};

// Encode string to CP866 / UTF-8 / ASCII bytes
function encodeText(text) {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

// Concatenate multiple Uint8Arrays
function concatBuffers(buffers) {
  const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const b of buffers) {
    result.set(b, offset);
    offset += b.length;
  }
  return result;
}

// Pad text left and right for 2-column receipt rows
function formatRow(leftText, rightText, width = 32) {
  const l = String(leftText || '');
  const r = String(rightText || '');
  const spaces = width - l.length - r.length;
  if (spaces <= 0) {
    return l + ' ' + r;
  }
  return l + ' '.repeat(spaces) + r;
}

export function isThermalPrintingSupported() {
  return typeof navigator !== 'undefined' && ('serial' in navigator || 'bluetooth' in navigator);
}

/**
 * Builds raw binary ESC/POS byte stream for receipt
 */
export function buildEscPosReceiptBuffer({
  businessName = 'QARZ DAFTARI',
  phone = '',
  address = '',
  receiptNumber = '',
  date = '',
  clientName = '',
  clientPhone = '',
  type = 'debt',
  items = [],
  amount = 0,
  currency = "so'm",
  totalBalance = null,
  dueDate = null,
  note = '',
  width = 58
}) {
  const cols = width === 80 ? 48 : 32;
  const divider = '-'.repeat(cols);
  const buffers = [];

  // 1. Initialize
  buffers.push(ESC_COMMANDS.INIT);

  // 2. Business Header (Centered, Double size)
  buffers.push(ESC_COMMANDS.ALIGN_CENTER);
  buffers.push(ESC_COMMANDS.BOLD_ON);
  buffers.push(ESC_COMMANDS.DOUBLE_SIZE);
  buffers.push(encodeText(businessName.toUpperCase() + '\n'));

  buffers.push(ESC_COMMANDS.NORMAL_SIZE);
  buffers.push(ESC_COMMANDS.BOLD_OFF);

  if (phone) {
    buffers.push(encodeText(`Tel: ${phone}\n`));
  }
  if (address) {
    buffers.push(encodeText(`Manzil: ${address}\n`));
  }

  // 3. Receipt Title & Metadata
  buffers.push(encodeText(divider + '\n'));
  buffers.push(ESC_COMMANDS.BOLD_ON);
  const title = type === 'debt' ? 'NASIYA SAVDO CHEKI' : 'TO\'LOV KVITANSIYASI';
  buffers.push(encodeText(title + '\n'));
  buffers.push(ESC_COMMANDS.BOLD_OFF);

  buffers.push(ESC_COMMANDS.ALIGN_LEFT);
  if (receiptNumber) buffers.push(encodeText(formatRow('Chek:', '#' + receiptNumber, cols) + '\n'));
  if (date) buffers.push(encodeText(formatRow('Sana:', date, cols) + '\n'));
  buffers.push(encodeText(formatRow('Mijoz:', clientName, cols) + '\n'));
  if (clientPhone) buffers.push(encodeText(formatRow('Tel:', clientPhone, cols) + '\n'));

  buffers.push(encodeText(divider + '\n'));

  // 4. Items Table
  if (items && items.length > 0) {
    buffers.push(ESC_COMMANDS.BOLD_ON);
    buffers.push(encodeText(formatRow('MAHSULOT / MIQDOR', 'SUMMA', cols) + '\n'));
    buffers.push(ESC_COMMANDS.BOLD_OFF);

    items.forEach((it, idx) => {
      const line1 = `${idx + 1}. ${it.name}`;
      buffers.push(encodeText(line1 + '\n'));
      const line2Left = `   ${it.qty} ${it.unit || 'dona'} x ${Number(it.price || 0).toLocaleString()}`;
      const line2Right = `${Number(it.total || 0).toLocaleString()} ${currency}`;
      buffers.push(encodeText(formatRow(line2Left, line2Right, cols) + '\n'));
    });
    buffers.push(encodeText(divider + '\n'));
  } else if (note) {
    buffers.push(encodeText(`Izoh: ${note}\n`));
    buffers.push(encodeText(divider + '\n'));
  }

  // 5. Total and Balance
  buffers.push(ESC_COMMANDS.ALIGN_LEFT);
  buffers.push(ESC_COMMANDS.BOLD_ON);
  const amtLabel = type === 'debt' ? 'USHMBU NASIYA:' : 'TO\'LANGAN SUMMA:';
  const amtVal = `${Number(amount || 0).toLocaleString()} ${currency}`;
  buffers.push(encodeText(formatRow(amtLabel, amtVal, cols) + '\n'));

  if (totalBalance !== null && totalBalance !== undefined) {
    const balLabel = 'JAMI QARZ BALANSI:';
    const balVal = `${Number(totalBalance || 0).toLocaleString()} ${currency}`;
    buffers.push(encodeText(formatRow(balLabel, balVal, cols) + '\n'));
  }

  if (dueDate && type === 'debt') {
    buffers.push(encodeText(formatRow('TO\'LOV MUDDATI:', dueDate, cols) + '\n'));
  }
  buffers.push(ESC_COMMANDS.BOLD_OFF);

  // 6. Footer
  buffers.push(encodeText(divider + '\n'));
  buffers.push(ESC_COMMANDS.ALIGN_CENTER);
  buffers.push(encodeText("Xaridingiz uchun rahmat!\n"));
  buffers.push(encodeText("Qarz Daftari Enterprise\n"));

  // 7. Feed and cut
  buffers.push(ESC_COMMANDS.FEED_3_LINES);
  buffers.push(ESC_COMMANDS.CUT_PAPER);

  return concatBuffers(buffers);
}

/**
 * Sends ESC/POS raw bytes directly to USB or Bluetooth printer
 */
export async function sendToThermalPrinter(dataBuffer) {
  // Option A: Try Web Serial (USB / COM)
  if ('serial' in navigator) {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      const writer = port.writable.getWriter();
      await writer.write(dataBuffer);
      writer.releaseLock();
      await port.close();
      return { success: true, channel: 'serial' };
    } catch (err) {
      if (err.name === 'NotFoundError') {
        // User cancelled selection
        return { success: false, cancelled: true };
      }
      console.warn('Web Serial failed, attempting Bluetooth fallback:', err);
    }
  }

  // Option B: Try Web Bluetooth
  if ('bluetooth' in navigator) {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2']
      });
      const server = await device.gatt.connect();
      // Look for write characteristic
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            // Send in chunks of 512 bytes for bluetooth MTU
            const chunkSize = 512;
            for (let i = 0; i < dataBuffer.length; i += chunkSize) {
              const chunk = dataBuffer.slice(i, i + chunkSize);
              await char.writeValue(chunk);
            }
            await server.disconnect();
            return { success: true, channel: 'bluetooth' };
          }
        }
      }
    } catch (err) {
      if (err.name === 'NotFoundError') {
        return { success: false, cancelled: true };
      }
      throw err;
    }
  }

  throw new Error("Ushbu brauzerda Web Serial yoki Web Bluetooth qo'llab-quvvatlanmaydi. Iltimos Chrome yoki Edge brauzeridan foydalaning.");
}
