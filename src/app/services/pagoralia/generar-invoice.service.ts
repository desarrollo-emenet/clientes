import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GenerarInvoiceService {
  BASE62_INVOICE =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  LETTERS_INVOICE = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  toBase62InvoiceBigInt(value: any) {
    let n = typeof value === 'bigint' ? value : BigInt(value);
    if (n === 0n) return '0';
    let result = '';
    while (n > 0n) {
      const r = Number(n % 62n);
      result = this.BASE62_INVOICE[r] + result;
      n /= 62n;
    }
    return result;
  }

  obtenerFechaActualFactura14() {
    const now = new Date();
    const yyyy = String(now.getFullYear()).padStart(4, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
  }

  generarInvoiceEncriptado(cliente: any, fecha14: any) {
    const num = BigInt(fecha14);
    const letterIndex = Number(num % 52n);
    const baseNum = num / 52n;
    const codigo = this.toBase62InvoiceBigInt(baseNum);
    const letra = this.LETTERS_INVOICE[letterIndex];
    return `${String(cliente || '').trim()}-${codigo}${letra}`;
  }

  construirInvoiceDesdeBilling(cliente: any) {
    const clienteStr = String(cliente || '').trim();
    if (!clienteStr) {
      return this.obtenerMesEnEspanolMayus(new Date());
    }
    const fecha = this.obtenerFechaActualFactura14();
    return this.generarInvoiceEncriptado(clienteStr, fecha);
  }

  formatearMontoPagoralia(value: any) {
    const n =
      typeof value === 'number' ? value : parseFloat(String(value || '0'));
    if (!Number.isFinite(n)) return '0';
    const rounded = Math.round(n);
    if (Math.abs(n - rounded) < 0.0001) return String(rounded);
    return String(Number(n.toFixed(2)));
  }
  obtenerMesEnEspanolMayus(date: any) {
    const meses = [
      'ENERO',
      'FEBRERO',
      'MARZO',
      'ABRIL',
      'MAYO',
      'JUNIO',
      'JULIO',
      'AGOSTO',
      'SEPTIEMBRE',
      'OCTUBRE',
      'NOVIEMBRE',
      'DICIEMBRE',
    ];
    const idx = date.getMonth();
    return meses[idx] || '';
  }
}
