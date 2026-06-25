import { Component, OnInit, HostListener } from '@angular/core';
import { CurrencyPipe, NgFor, NgClass } from '@angular/common';
import { NgIf } from '@angular/common';
import { ClientService } from '../../services/user/clientService';
import { ActivatedRoute, Route, Router, RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import { PaymentService } from '../../services/pagoralia/paymentService';
import { UserService } from '../../services/user/user-service';


@Component({
  selector: 'app-client',
  imports: [CurrencyPipe, NgIf, NgFor, RouterLink, NgClass],
  templateUrl: './client.html',
  styleUrl: './client.css'
})

export class Client implements OnInit {
  data: any;
  showDetails = false;
  loading = false;
  loadingPago = false;
  showEstadoCuentaModal = false;
  showPagoModal = false;
  private subs: Subscription[] = [];


  constructor(
    private clientS: ClientService,
    private route: ActivatedRoute,
    private user: UserService,
    private paymentService: PaymentService,
    private router: Router) { }

  ngOnInit(): void {
    const sub = this.user.obtenerUsuarioAutenticado(this.route)
      .subscribe({
        next: (numeroCliente) => {
          if (!numeroCliente) return;
          this.loadClientData(numeroCliente);
        },
        error: (e) => {
          console.error('Error al obtener usuario autenticado', e);
          toast.error('Error al obtener información del usuario');
        }
      });
    this.subs.push(sub);
  }

  loadClientData(numeroCliente: string) {
    this.loading = true;
    this.data = null;

    const sub = this.clientS.getClientePorNumero(numeroCliente).subscribe({
      next: res => {
        this.data = res,
          this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        console.error('Error en servicio', e);
        if (e?.status === 0) {
          toast.error('No se pudo conectar al servidor');
        } else if (e?.status === 404) {
          toast.error('Servicio no encontrado');
        } else if (e?.status === 401) {
          toast.error('No autorizado');
          this.router.navigateByUrl('/iniciar-sesion');
        } else if (e?.status === 403) {
          toast.error('No autorizado para eliminar este servicio');
        } else {
          toast.error('Error inesperado');
        }
      }

    })

  }

  pagar(): void {
    //window.open('https://emenet.mx/pagar-servicio', '_blank');
    const numeroCliente = this.data?.cliente?.cliente?.cliente ?? '';
    this.loadingPago = true;
    this.paymentService.pagar(numeroCliente);
    setTimeout(() => {
      this.loadingPago = false;
    }, 3600);
  }

  toggleDetails() { this.showDetails = !this.showDetails; }

  calcularTotalMensual(servicios: any): number {

    if (!servicios) return 0;
    let total = 0;
    let cantidadServicios = 0;

    if (servicios.internet && servicios.internet.precio) {
      total += Number(servicios.internet.precio);
      cantidadServicios++;
    }

    if (servicios.camaras && servicios.camaras.precio) {
      const precio = Number(servicios.camaras.precio) || 0;
      const noCamaras = Number(servicios.camaras.canServicios) || 0;
      total += precio * noCamaras;
      cantidadServicios++;
    }

    if (servicios.telefono) {
      const precio = Number(servicios.telefono.precio) || 0;
      const lineas = Number(servicios.telefono.canServicios) || 0;
      total += precio * lineas;
      cantidadServicios++;

    }
    if (servicios.cuentasTv) {
      const precio = Number(servicios.cuentasTv.precio) || 0;
      const canServicios = Number(servicios.cuentasTv.canServicios) || 0;
      total += precio * canServicios;
      cantidadServicios++;

    }


    return total;

    //console.log("Total de servicios: ", cantidadServicios)
    //console.log('Total servicio:', servicios.cuentasTv.precio);
    //console.log('Total mesualidad:', total);
    //return 0;
  }

  get latestPayments() {
    const list = this.data?.servicios?.estadoCuenta || [];
    return list.slice(0, 5);
  }

  getMesPagoReciente(): string {
    const estadoCuenta = this.data?.cliente?.servicios?.estadoCuenta;
    if (!estadoCuenta || estadoCuenta.length === 0) {
      return 'Sin pagos registrados';
    }
    return estadoCuenta[estadoCuenta.length - 1].mensualidad;
  }

  contactSupport() {
    const phone = '7133475658';
    const text = encodeURIComponent('Hola, necesito ayuda.');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  abrirEstadoCuentaModal() {
    this.showEstadoCuentaModal = true;
  }

  cerrarEstadoCuentaModal() {
    this.showEstadoCuentaModal = false;
  }

  abrirPagoModal() {
    this.showPagoModal = true;
  }

  cerrarPagoModal() {
    this.showPagoModal = false;
  }

  @HostListener('document:keydown.escape')
  manejarTeclaEscape(): void {
    if (this.showEstadoCuentaModal) {
      this.cerrarEstadoCuentaModal();
      return;
    }
    if (this.showPagoModal) {
      this.cerrarPagoModal();
    }
  }

  async descargarEstadoCuentaPDF(item: any): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait', unit: 'mm', format: 'letter'
    });
    const cliente = this.data?.cliente?.cliente;
    const servicios = this.data?.cliente?.servicios;
    const numeroCliente = this.data?.numero_cliente;
    const pageW = doc.internal.pageSize.getWidth();
    const margen = 12;
    const anchoUtil = pageW - margen * 2;
    const totalServicios = this.calcularTotalServicios(servicios);

    const pageH = doc.internal.pageSize.getHeight();
    const altoFooter = 13;
    const yMaxContenido = pageH - altoFooter - 3;

    await this.dibujarPiePDF(doc, pageW);
    await this.dibujarEncabezadoPDF(doc, pageW, margen, item);
    let y = await this.dibujarBannerClientePDF(
      doc, cliente, numeroCliente, item, totalServicios, margen, anchoUtil, pageW
    );
    y = this.dibujarTablaServiciosPDF(
      doc, servicios, cliente, y, margen, anchoUtil
    );
    y = this.dibujarResumenTotalPDF(
      doc, cliente, item, totalServicios, y, margen, anchoUtil
    );
    await this.dibujarSeccionPagoPDF(doc, y, margen, anchoUtil, yMaxContenido);

    const nombreArchivo =
      `estado-cuenta-${numeroCliente}-${item?.mensualidad ?? 'periodo'}.pdf`;
    doc.save(nombreArchivo);
  }

  private cargarJsBarcode(): Promise<any> {
    return new Promise((resolve) => {
      if ((window as any).JsBarcode) {
        resolve((window as any).JsBarcode);
        return;
      }
      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
      script.onload = () => resolve((window as any).JsBarcode);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }

  private async dibujarCodigoBarrasPDF(
    doc: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    valor: string
  ): Promise<void> {
    const jsbc = await this.cargarJsBarcode();
    if (!jsbc) return;

    const canvas = document.createElement('canvas');
    jsbc(canvas, valor, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: false,
      margin: 0
    });

    const dataUrl = canvas.toDataURL('image/png');
    doc.addImage(dataUrl, 'PNG', x, y, w, h, undefined, 'FAST');
  }

  private async dibujarLogoEncabezado(
    doc: jsPDF, margen: number
  ): Promise<void> {
    try {
      const resp = await fetch('assets/img/emenetLogo.png');
      const blob = await resp.blob();
      const dataUrl = await this.blobToDataUrl(blob);
      doc.addImage(dataUrl, 'PNG', margen, 4, 30, 15, undefined, 'FAST');
    } catch {
      try {
        const resp = await fetch('assets/img/emenetLogoB.png');
        const blob = await resp.blob();
        const dataUrl = await this.blobToDataUrl(blob);
        doc.addImage(dataUrl, 'PNG', margen, 4, 30, 15, undefined, 'FAST');
      } catch {
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('emenet', margen, 17);
      }
    }
  }

  private dibujarInfoEncabezado(
    doc: jsPDF, pageW: number, margen: number, item: any
  ): void {
    const hoy = new Date().toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const x = pageW - margen - 56;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Estado de cuenta', x, 8, { align: 'right' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 75, 100);
    doc.text(`Periodo: ${item?.mensualidad ?? 'N/A'}`, x, 13, { align: 'right' });
    doc.text(`Emitido: ${hoy}`, x, 18, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`Venta: #${item?.VENTA ?? 'N/A'}`, x, 23, { align: 'right' });
  }

  private async dibujarCodigoBarrasEncabezado(
    doc: jsPDF, pageW: number, margen: number
  ): Promise<void> {
    const x = pageW - margen - 50;
    const ref = '4741764001982278';
    await this.dibujarCodigoBarrasPDF(doc, x, 3, 50, 13, ref);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('4741  7640  0198  2278', x + 25, 19, { align: 'center' });

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 120, 130);
    doc.text('Ref. OXXO / Ahorro / Bienestar', x + 25, 24, { align: 'center' });
  }

  private async dibujarEncabezadoPDF(
    doc: jsPDF, pageW: number, margen: number, item: any
  ): Promise<void> {
    const altoHeader = 28;
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, altoHeader, 'F');
    doc.setFillColor(51, 51, 51);
    doc.rect(0, altoHeader, pageW, 1.2, 'F');

    await this.dibujarLogoEncabezado(doc, margen);
    this.dibujarInfoEncabezado(doc, pageW, margen, item);
    await this.dibujarCodigoBarrasEncabezado(doc, pageW, margen);
  }

  private calcularTotalServicios(servicios: any): number {
    const internet = servicios?.internet?.precio ?? 0;
    const camaras = (servicios?.camaras?.canServicios ?? 0) *
      (servicios?.camaras?.precio ?? 0);
    const telefono = (servicios?.telefono?.canServicios ?? 0) *
      (servicios?.telefono?.precio ?? 0);
    const tv = (servicios?.cuentasTv?.canServicios ?? 0) *
      (servicios?.cuentasTv?.precio ?? 0);
    return internet + camaras + telefono + tv;
  }

  private async dibujarBannerClientePDF(
    doc: jsPDF,
    cliente: any,
    numeroCliente: string,
    item: any,
    totalServicios: number,
    margen: number,
    anchoUtil: number,
    pageW: number
  ): Promise<number> {
    let y = 32;
    const pad = 3;
    const colIzq = anchoUtil * 0.55;
    const colDer = anchoUtil * 0.42;
    const xDer = margen + anchoUtil - colDer;
    const altoBloque = 36;

    doc.setFillColor(250, 250, 250);
    doc.rect(0, y, pageW, altoBloque, 'F');
    doc.setDrawColor(225, 225, 225);
    doc.setLineWidth(0.3);
    doc.line(0, y + altoBloque, pageW, y + altoBloque);

    // --- COLUMNA IZQUIERDA: Datos del cliente ---
    const nombre = (cliente?.nombre ?? 'N/A').toUpperCase();
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text(nombre, margen, y + 8);

    const direccionParts = [
      cliente?.direccion, cliente?.colonia,
      cliente?.municipio, cliente?.estado
    ].filter(Boolean);
    const direccion = direccionParts.join(', ') || 'Sin dirección registrada';
    const dirLines = doc.splitTextToSize(direccion, colIzq - pad);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 85, 110);
    doc.text(dirLines, margen, y + 14);

    doc.setFontSize(7);
    doc.setTextColor(120, 135, 160);
    doc.text(`No. Cliente:`, margen, y + 27);
    doc.text(`Documento informativo. No válido como comprobante de domicilio.`, margen, y + 32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text(`${numeroCliente ?? 'N/A'}`, margen + 20, y + 27);


    // --- COLUMNA DERECHA: Importe destacado ---
    const importe = this.formatearPesos(totalServicios);
    const deuda = cliente?.deuda ?? 0;
    const colorBordeCaja: [number, number, number] = deuda > 0
      ? [220, 53, 69] : [51, 51, 51];
    const colorTextoCaja: [number, number, number] = deuda > 0
      ? [180, 30, 50] : [51, 51, 51];

    doc.setFillColor(252, 252, 252);
    doc.roundedRect(xDer, y + 2, colDer, altoBloque - 5, 3, 3, 'F');
    doc.setDrawColor(...colorBordeCaja);
    doc.setLineWidth(1);
    doc.roundedRect(xDer, y + 2, colDer, altoBloque - 5, 3, 3, 'D');

    doc.setFillColor(...colorBordeCaja);
    doc.roundedRect(xDer, y + 2, colDer, 7, 3, 3, 'F');
    doc.rect(xDer, y + 5, colDer, 4, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    const etiqCaja = deuda > 0 ? 'IMPORTE DEL PERIODO' : 'CARGO MENSUAL';
    doc.text(etiqCaja, xDer + colDer / 2, y + 7.5, { align: 'center' });

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorTextoCaja);
    doc.text(`$${importe}`, xDer + colDer / 2, y + 23, { align: 'center' });

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 140, 170);
    doc.text('MXN · Incluye todos los servicios',
      xDer + colDer / 2, y + 29, { align: 'center' });

    return y + altoBloque + 4;
  }

  private dibujarTablaServiciosPDF(
    doc: jsPDF,
    servicios: any,
    cliente: any,
    yInicio: number,
    margen: number,
    anchoUtil: number
  ): number {
    let y = yInicio;
    const pad = 4;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Detalle de servicios contratados', margen, y + 6);

    doc.setFillColor(51, 51, 51);
    doc.rect(margen, y + 8.5, 35, 1.2, 'F');

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margen + 35, y + 9, margen + anchoUtil, y + 9);
    y += 13;

    const colServ = anchoUtil * 0.35;
    const colDet = anchoUtil * 0.40;

    // Encabezado tabla
    doc.setFillColor(51, 51, 51);
    doc.rect(margen, y, anchoUtil, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICIO', margen + pad, y + 4.2);
    doc.text('PLAN / DETALLE', margen + colServ + pad, y + 4.2);
    doc.text('IMPORTE/MES', margen + anchoUtil - pad, y + 4.2, {
      align: 'right'
    });
    y += 6;

    const filas = this.construirFilasServicios(servicios, cliente);
    let subtotal = 0;

    filas.forEach((fila, idx) => {
      const bgRgb: [number, number, number] = idx % 2 === 0
        ? [250, 250, 250] : [242, 242, 242];
      doc.setFillColor(...bgRgb);
      doc.rect(margen, y, anchoUtil, 7.5, 'F');

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(margen, y + 7.5, margen + anchoUtil, y + 7.5);

      doc.setTextColor(25, 40, 70);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(fila.servicio, margen + pad, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(80, 100, 130);
      const maxDet = colDet - 4;
      const detT = this.truncarTextoPDF(doc, fila.detalle, maxDet);
      doc.text(detT, margen + colServ + pad, y + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 51, 51);
      doc.text(
        `$ ${fila.precio}`,
        margen + anchoUtil - pad, y + 5.5, { align: 'right' }
      );

      subtotal += parseFloat(fila.precio.replace(/,/g, ''));
      y += 7.5;
    });

    // Subtotal
    doc.setFillColor(235, 235, 235);
    doc.rect(margen, y, anchoUtil, 7, 'F');
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Subtotal', margen + pad, y + 4.8);
    doc.text(
      `$ ${this.formatearPesos(subtotal)}`,
      margen + anchoUtil - pad, y + 4.8, { align: 'right' }
    );
    y += 7;

    return y + 4;
  }

  private truncarTextoPDF(
    doc: jsPDF, texto: string, maxWidth: number
  ): string {
    const t = texto ?? '';
    if (!t) return '';
    if (doc.getTextWidth(t) <= maxWidth) return t;

    const ellipsis = '...';
    const ellipsisW = doc.getTextWidth(ellipsis);
    const limite = Math.max(0, maxWidth - ellipsisW);

    let out = '';
    for (const ch of t) {
      if (doc.getTextWidth(out + ch) > limite) break;
      out += ch;
    }

    return out.trimEnd() + ellipsis;
  }

  private construirFilasServicios(
    servicios: any, cliente: any
  ): { servicio: string; detalle: string; precio: string }[] {
    const filas: { servicio: string; detalle: string; precio: string }[] = [];

    if (servicios?.internet) {
      filas.push({
        servicio: 'Internet',
        detalle: `${cliente?.nombrePlan ?? ''} — ${cliente?.planInternet ?? ''} Mbps`,
        precio: this.formatearPesos(servicios.internet.precio ?? 0)
      });
    }

    if ((servicios?.camaras?.canServicios ?? 0) > 0) {
      const costoTotalCamaras = (servicios.camaras.canServicios ?? 0) *
        (servicios.camaras.precio ?? 0);
      filas.push({
        servicio: 'Cámaras',
        detalle: `${servicios.camaras.canServicios} servicio(s)`,
        precio: this.formatearPesos(costoTotalCamaras)
      });
    }

    if ((servicios?.telefono?.canServicios ?? 0) > 0) {
      const costoTotalTelefono = (servicios.telefono.canServicios ?? 0) *
        (servicios.telefono.precio ?? 0);
      filas.push({
        servicio: 'Telefonía',
        detalle: `${servicios.telefono.canServicios} línea(s)`,
        precio: this.formatearPesos(costoTotalTelefono)
      });
    }

    if ((servicios?.cuentasTv?.canServicios ?? 0) > 0) {
      const costoTotalTv = (servicios.cuentasTv.canServicios ?? 0) *
        (servicios.cuentasTv.precio ?? 0);
      filas.push({
        servicio: 'TV',
        detalle: `${servicios.cuentasTv.canServicios} servicio(s)`,
        precio: this.formatearPesos(costoTotalTv)
      });
    }

    return filas;
  }

  private obtenerColoresEstado(deudor: boolean): {
    acento: [number, number, number];
    fondo: [number, number, number];
  } {
    if (deudor) {
      return {
        acento: [220, 53, 69],
        fondo: [255, 255, 255]
      };
    }
    return {
      acento: [25, 135, 84],
      fondo: [255, 255, 255]
    };
  }

  private dibujarCajaEstado(
    doc: jsPDF,
    x: number,
    y: number,
    ancho: number,
    alto: number,
    col: {
      acento: [number, number, number];
      fondo: [number, number, number];
    }
  ): void {
    doc.setFillColor(col.fondo[0], col.fondo[1], col.fondo[2]);
    doc.roundedRect(x, y, ancho, alto, 2, 2, 'F');
    doc.setDrawColor(col.acento[0], col.acento[1], col.acento[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, ancho, alto, 2, 2, 'D');
  }

  private dibujarTextosIzquierda(
    doc: jsPDF,
    deudor: boolean,
    mensualidad: string,
    x: number,
    y: number
  ): void {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    const msg = deudor
      ? 'SALDO ANTERIOR PENDIENTE'
      : 'TU CUENTA SE ENCUENTRA AL CORRIENTE';
    doc.text(msg, x, y + 5);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 120, 130);
    const sub = `Periodo: ${mensualidad}  ·  Límite: del 1 al 5 de cada mes`;
    doc.text(sub, x, y + 9.5);
  }

  private dibujarValoresDerecha(
    doc: jsPDF,
    deudor: boolean,
    importeText: string,
    colorAcento: [number, number, number],
    x: number,
    y: number
  ): void {
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 130, 140);
    const etiqueta = deudor ? 'TOTAL A PAGAR' : 'ESTADO';
    doc.text(etiqueta, x, y + 5, { align: 'right' });

    const tSize = deudor ? 11 : 9;
    doc.setFontSize(tSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorAcento[0], colorAcento[1], colorAcento[2]);
    const valor = deudor ? `$ ${importeText}` : 'AL CORRIENTE';
    doc.text(valor, x, y + 9.5, { align: 'right' });
  }

  private dibujarResumenTotalPDF(
    doc: jsPDF,
    cliente: any,
    item: any,
    totalServicios: number,
    y: number,
    margen: number,
    anchoUtil: number
  ): number {
    const deudor = (cliente?.deuda ?? 0) > 0;
    const imp = deudor ? cliente.deuda : totalServicios;
    const mes = item?.mensualidad ?? 'N/A';

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margen, y, margen + anchoUtil, y);
    y += 3;

    const alto = 13;
    const col = this.obtenerColoresEstado(deudor);
    this.dibujarCajaEstado(doc, margen, y, anchoUtil, alto, col);
    this.dibujarTextosIzquierda(doc, deudor, mes, margen + 5, y);
    this.dibujarValoresDerecha(
      doc, deudor, this.formatearPesos(imp), col.acento,
      margen + anchoUtil - 5, y
    );

    return y + alto + 4;
  }

  private async dibujarSeccionPagoPDF(
    doc: jsPDF,
    yInicio: number,
    margen: number,
    anchoUtil: number,
    yMax: number
  ): Promise<void> {
    let y = yInicio;
    const pad = 4;

    // Título sección
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Formas de pago disponibles', margen, y + 6);

    doc.setFillColor(51, 51, 51);
    doc.rect(margen, y + 8.5, 35, 1.2, 'F');

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margen + 35, y + 9, margen + anchoUtil, y + 9);
    y += 13;

    const colW = (anchoUtil - 6) / 2;
    const xIzq = margen;
    const xDer = margen + colW + 6;
    const yCajas = y;

    // Espacio restante para las 3 cajas
    const espacioDisponible = yMax - y;
    // Cajas HSBC/SPEI: toman ~55% del espacio, OXXO ~40%
    const altoCajasLaterales = Math.min(38, espacioDisponible * 0.52);
    const espacioOxxo = yMax - (yCajas + altoCajasLaterales + 4);
    const altoCajaOxxo = Math.min(36, Math.max(24, espacioOxxo));

    // --- Caja 1: HSBC ---
    y = await this.dibujarCajaPagoCompleta(doc, {
      x: xIzq, y: yCajas, w: colW,
      titulo: 'Sucursal bancaria · HSBC',
      lineas: [
        { label: 'Depósito en ventanilla o cajero', valor: '' },
        { label: 'No. Cuenta:', valor: '4062409131' },
        { label: 'Beneficiario:', valor: 'IPTVTEL COMUNICACIONES' },
        { label: 'Recuerda subir tu pago en la App o a nuestro Embot', valor: '' }
      ],
      logoPath: 'assets/img/FormasPago/hsbc.svg',
      pad,
      altoForzado: altoCajasLaterales
    });

    // --- Caja 2: SPEI ---
    await this.dibujarCajaPagoCompleta(doc, {
      x: xDer, y: yCajas, w: colW,
      titulo: 'Transferencia SPEI',
      lineas: [
        { label: 'Banca en línea o app bancaria', valor: '' },
        { label: 'CLABE:', valor: '021453040624091311' },
        { label: 'Beneficiario:', valor: 'IPTVTEL COMUNICACIONES' },
        { label: 'Recuerda subir tu pago en la App o a nuestro Embot', valor: '' }
      ],
      logoPath: 'assets/img/FormasPago/spei.png',
      pad,
      altoForzado: altoCajasLaterales
    });

    y += 4;

    // --- Caja 3: OXXO (ancho completo) ---
    await this.dibujarCajaPagoCompleta(doc, {
      x: margen, y, w: anchoUtil,
      titulo: 'Tiendas de conveniencia - OXXO · Farmacia del Ahorro · Financiera Bienestar',
      lineas: [
        { label: 'Pago en efectivo en cualquier establecimiento participante', valor: '' },
        { label: 'No. Referencia:', valor: '4741764001982278' },
        { label: 'Tu pago se verá reflejado en menos de 24 hrs.', valor: '' },
        { label: 'Recuerda subir tu pago en la App o a nuestro Embot al', valor: '713 347 5658' }
      ],
      logoPath: 'assets/img/FormasPago/oxxo.png',
      logoW: 36,
      logoH: 15,
      pad,
      altoForzado: altoCajaOxxo
    });
  }

  private async dibujarCajaPagoCompleta(
    doc: jsPDF,
    opciones: {
      x: number; y: number; w: number;
      titulo: string;
      lineas: { label: string; valor: string }[];
      logoPath: string;
      logoW?: number;
      logoH?: number;
      pad: number;
      altoForzado?: number;
    }
  ): Promise<number> {
    const { x, y, w, titulo, lineas, logoPath, logoW, logoH, pad, altoForzado } = opciones;
    const wLogo = logoW ?? 14;
    const hLogo = logoH ?? 10;
    const altoHeader = 8;
    const altoContenidoNatural = lineas.length * 8 + 4;
    const altoTotal = altoForzado ?? (altoHeader + altoContenidoNatural);

    // Fondo de la caja (Blanco)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, w, altoTotal, 3, 3, 'F');
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, altoTotal, 3, 3, 'D');

    // Encabezado color #333333
    doc.setFillColor(51, 51, 51);
    doc.roundedRect(x, y, w, altoHeader, 3, 3, 'F');
    doc.rect(x, y + altoHeader - 3, w, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, x + pad, y + 5.5);

    // Contenido con espaciado vertical dinámico y fuente tamaño 7
    const fontSize = 7;
    const N = lineas.length;
    const startY = y + altoHeader + 5;
    const endY = y + altoTotal - 4.5;
    const dY = N > 1 ? Math.min(7.5, (endY - startY) / (N - 1)) : 0;

    lineas.forEach((linea, idx) => {
      const lineY = N > 1 ? startY + idx * dY : startY;
      if (linea.valor) {
        doc.setTextColor(80, 100, 130);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.text(linea.label, x + pad, lineY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 51, 51);
        const labelW = doc.getTextWidth(linea.label + ' ');
        doc.text(linea.valor, x + pad + labelW, lineY);
      } else {
        doc.setTextColor(90, 110, 140);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        const maxW = w - pad * 2 - (wLogo + 4);
        const wrapped = doc.splitTextToSize(linea.label, maxW);
        doc.text(wrapped, x + pad, lineY);
      }
    });

    // Logo a la derecha
    await this.agregarImagenPDF(
      doc, logoPath, 'PNG',
      x + w - wLogo - pad, y + altoTotal - hLogo - 4, wLogo, hLogo
    );

    return y + altoTotal;
  }

  private async agregarImagenPDF(
    doc: jsPDF,
    assetPath: string,
    format: 'PNG' | 'JPEG',
    x: number,
    y: number,
    w: number,
    h: number
  ): Promise<void> {
    try {
      let dataUrl: string;
      if (assetPath.endsWith('.svg')) {
        dataUrl = await this.svgToPngDataUrl(assetPath);
      } else {
        const resp = await fetch(assetPath);
        const blob = await resp.blob();
        dataUrl = await this.blobToDataUrl(blob);
      }
      doc.addImage(dataUrl, 'PNG', x, y, w, h, undefined, 'FAST');
    } catch (e) {
      // Ignorado: imagen no crítica
    }
  }

  private svgToPngDataUrl(svgPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 3;
        canvas.width = (img.naturalWidth || 512) * scale;
        canvas.height = (img.naturalHeight || 512) * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load SVG'));
      img.src = svgPath;
    });
  }

  private async dibujarPiePDF(doc: jsPDF, pageW: number): Promise<void> {
    const pageH = doc.internal.pageSize.getHeight();
    const altoFoot = 13;

    // Franja fina de acento gris oscuro sobre el pie
    doc.setFillColor(80, 80, 80);
    doc.rect(0, pageH - altoFoot - 1, pageW, 1, 'F');

    // Fondo gris #333333 del pie
    doc.setFillColor(51, 51, 51);
    doc.rect(0, pageH - altoFoot, pageW, altoFoot, 'F');

    // Logo en pie
    try {
      const logoResp = await fetch('assets/img/emenetLogoB.png');
      const logoBlob = await logoResp.blob();
      const logoDataUrl = await this.blobToDataUrl(logoBlob);
      doc.addImage(
        logoDataUrl, 'PNG',
        12, pageH - altoFoot + 2, 20, 9, undefined, 'FAST'
      );
    } catch {
      // Sin logo de respaldo
    }

    // Texto central
    doc.setTextColor(220, 220, 220);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'IPTVTEL Comunicaciones S. DE R.L. DE C.V. ·  713 133 4557 Ext 1 · clientes@emenet.mx',
      pageW / 2, pageH - 5.5, { align: 'center' }
    );

    // Página
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(6.5);
    doc.text('Pág. 1 de 1', pageW - 12, pageH - 5.5, { align: 'right' });
  }



  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private formatearPesos(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(valor));
  }
  // Esta función solo cuenta cuántos servicios activos hay
  contarServicios(servicios: any): number {
    if (!servicios) return 0;

    let conteo = 0;

    if (servicios.internet) conteo++;
    if (servicios.camaras) conteo++;
    if (servicios.telefono) conteo++;
    if (servicios.cuentasTv) conteo++;

    return conteo;
  }

  contarServiciosActivos(): number {
    if (!this.data?.cliente?.servicios) return 0;

    let conteo = 0;
    const servicios = this.data.cliente.servicios;

    if (servicios.internet) conteo++;
    if (servicios.camaras) conteo++;
    if (servicios.telefono) conteo++;
    if (servicios.cuentasTv) conteo++;

    return conteo;
  }


}