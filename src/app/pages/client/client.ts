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
      orientation: 'portrait', unit: 'mm', format: 'a4'
    });
    const cliente = this.data?.cliente?.cliente;
    const servicios = this.data?.cliente?.servicios;
    const numeroCliente = this.data?.numero_cliente;
    const pageW = doc.internal.pageSize.getWidth();
    const margen = 12;
    const anchoUtil = pageW - margen * 2;
    const totalServicios = this.calcularTotalServicios(servicios);

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
    await this.dibujarSeccionPagoPDF(doc, y, margen, anchoUtil);
    await this.dibujarPiePDF(doc, pageW);

    const nombreArchivo =
      `estado-cuenta-${numeroCliente}-${item?.mensualidad ?? 'periodo'}.pdf`;
    doc.save(nombreArchivo);
  }

  private async dibujarEncabezadoPDF(
    doc: jsPDF, pageW: number, margen: number, item: any
  ): Promise<void> {
    const altoHeader = 22;
    const altoSub = 10;

    // Barra principal azul oscura
    doc.setFillColor(11, 78, 148);
    doc.rect(0, 0, pageW, altoHeader, 'F');

    // Barra secundaria azul más clara
    doc.setFillColor(24, 106, 206);
    doc.rect(0, altoHeader, pageW, altoSub, 'F');

    // Logo en barra principal
    try {
      const logoResp = await fetch('assets/img/emenetLogoB.png');
      const logoBlob = await logoResp.blob();
      const logoDataUrl = await this.blobToDataUrl(logoBlob);
      doc.addImage(
        logoDataUrl, 'PNG', margen, 3, 32, 16, undefined, 'FAST'
      );
    } catch {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('emenet', margen, 15);
    }

    // Etiqueta "ESTADO DE CUENTA" centrada arriba
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO DE CUENTA', pageW / 2, 14, { align: 'center' });

    // Folio y fecha en la barra secundaria
    const hoy = new Date().toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 220, 255);
    doc.text(
      `Periodo: ${item?.mensualidad ?? 'N/A'}  ·  Emitido: ${hoy}`,
      margen, altoHeader + 7
    );

    const folio = `Folio: ${Date.now().toString().slice(-8)}`;
    doc.text(folio, pageW - margen, altoHeader + 7, { align: 'right' });
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
    let y = 38;
    const pad = 4;
    const colIzq = anchoUtil * 0.55;
    const colDer = anchoUtil * 0.42;
    const xDer = margen + anchoUtil - colDer;
    const altoBloque = 42;

    // Fondo del bloque de cliente
    doc.setFillColor(248, 250, 255);
    doc.rect(0, y, pageW, altoBloque, 'F');
    doc.setDrawColor(220, 232, 252);
    doc.setLineWidth(0.3);
    doc.line(0, y + altoBloque, pageW, y + altoBloque);

    // --- COLUMNA IZQUIERDA: Datos del cliente ---
    const nombre = (cliente?.nombre ?? 'N/A').toUpperCase();
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 78, 148);
    doc.text(nombre, margen, y + 9);

    const direccionParts = [
      cliente?.direccion, cliente?.colonia,
      cliente?.municipio, cliente?.estado
    ].filter(Boolean);
    const direccion = direccionParts.join(', ') || 'Sin dirección registrada';
    const dirLines = doc.splitTextToSize(direccion, colIzq - pad);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 85, 110);
    doc.text(dirLines, margen, y + 16);

    doc.setFontSize(7.5);
    doc.setTextColor(120, 135, 160);
    doc.text(`No. Cliente:`, margen, y + 30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 78, 148);
    doc.text(`${numeroCliente ?? 'N/A'}`, margen + 22, y + 30);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 135, 160);
    doc.text(`Venta: #${item?.VENTA ?? 'N/A'}`, margen + 55, y + 30);

    // --- COLUMNA DERECHA: Importe destacado (estilo cajita TotalPlay) ---
    const importe = this.formatearPesos(totalServicios);
    const deuda = cliente?.deuda ?? 0;
    const colorCaja: [number, number, number] = deuda > 0
      ? [220, 53, 69] : [11, 78, 148];

    doc.setFillColor(...colorCaja);
    doc.roundedRect(xDer, y + 2, colDer, altoBloque - 6, 4, 4, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    const etiqCaja = deuda > 0 ? 'IMPORTE DEL PERIODO' : 'CARGO MENSUAL';
    doc.text(etiqCaja, xDer + colDer / 2, y + 11, { align: 'center' });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${importe}`, xDer + colDer / 2, y + 25, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(210, 230, 255);
    doc.text('MXN · Incluye todos los servicios',
      xDer + colDer / 2, y + 33, { align: 'center' });

    return y + altoBloque + 6;
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

    // Título sección con barra lateral
    doc.setFillColor(11, 78, 148);
    doc.rect(margen, y, 3, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 78, 148);
    doc.text('Detalle de servicios contratados', margen + 6, y + 6);
    y += 12;

    const colServ = anchoUtil * 0.35;
    const colDet = anchoUtil * 0.40;

    // Encabezado tabla
    doc.setFillColor(11, 78, 148);
    doc.rect(margen, y, anchoUtil, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICIO', margen + pad, y + 5);
    doc.text('PLAN / DETALLE', margen + colServ + pad, y + 5);
    doc.text('IMPORTE/MES', margen + anchoUtil - pad, y + 5, {
      align: 'right'
    });
    y += 7;

    const filas = this.construirFilasServicios(servicios, cliente);
    let subtotal = 0;

    filas.forEach((fila, idx) => {
      const bgRgb: [number, number, number] = idx % 2 === 0
        ? [248, 251, 255] : [238, 245, 255];
      doc.setFillColor(...bgRgb);
      doc.rect(margen, y, anchoUtil, 9, 'F');

      doc.setDrawColor(220, 232, 250);
      doc.setLineWidth(0.2);
      doc.line(margen, y + 9, margen + anchoUtil, y + 9);

      doc.setTextColor(25, 40, 70);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(fila.servicio, margen + pad, y + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(80, 100, 130);
      const maxDet = colDet - 4;
      const detT = this.truncarTextoPDF(doc, fila.detalle, maxDet);
      doc.text(detT, margen + colServ + pad, y + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(11, 78, 148);
      doc.text(
        `$ ${fila.precio}`,
        margen + anchoUtil - pad, y + 6.5, { align: 'right' }
      );

      subtotal += parseFloat(fila.precio.replace(/,/g, ''));
      y += 9;
    });

    // Subtotal
    doc.setFillColor(225, 235, 250);
    doc.rect(margen, y, anchoUtil, 8, 'F');
    doc.setTextColor(11, 78, 148);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Subtotal', margen + pad, y + 5.5);
    doc.text(
      `$ ${this.formatearPesos(subtotal)}`,
      margen + anchoUtil - pad, y + 5.5, { align: 'right' }
    );
    y += 8;

    return y + 6;
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

  private dibujarResumenTotalPDF(
    doc: jsPDF,
    cliente: any,
    item: any,
    totalServicios: number,
    y: number,
    margen: number,
    anchoUtil: number
  ): number {
    const deuda = cliente?.deuda ?? 0;
    const importe = this.formatearPesos(totalServicios);
    const pad = 4;

    // Separador visual
    doc.setDrawColor(200, 218, 248);
    doc.setLineWidth(0.4);
    doc.line(margen, y, margen + anchoUtil, y);
    y += 5;

    // Caja principal de total
    const altoTotal = 26;
    const colorFondo: [number, number, number] = deuda > 0
      ? [255, 242, 244] : [240, 255, 248];
    const colorBorde: [number, number, number] = deuda > 0
      ? [220, 53, 69] : [25, 160, 80];
    const colorTexto: [number, number, number] = deuda > 0
      ? [190, 30, 50] : [20, 120, 65];
    const colorImporte: [number, number, number] = deuda > 0
      ? [220, 53, 69] : [25, 160, 80];

    doc.setFillColor(...colorFondo);
    doc.roundedRect(margen, y, anchoUtil, altoTotal, 3, 3, 'F');
    doc.setDrawColor(...colorBorde);
    doc.setLineWidth(0.5);
    doc.roundedRect(margen, y, anchoUtil, altoTotal, 3, 3, 'D');

    // Barra izquierda de acento
    doc.setFillColor(...colorBorde);
    doc.roundedRect(margen, y, 4, altoTotal, 2, 2, 'F');

    // Etiqueta estado
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorTexto);
    const etiqTotal = deuda > 0 ? 'TOTAL A PAGAR' : 'TU CUENTA ESTÁ AL CORRIENTE';
    doc.text(etiqTotal, margen + pad + 4, y + 9);

    // Periodo
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 120, 150);
    doc.text(
      `Periodo: ${item?.mensualidad ?? 'N/A'}  ·  Fecha límite: del 1 al 5 de cada mes`,
      margen + pad + 4, y + 16
    );

    // Importe grande a la derecha
    if (deuda > 0) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorImporte);
      doc.text(
        `$ ${this.formatearPesos(deuda)}`,
        margen + anchoUtil - pad, y + 18, { align: 'right' }
      );
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(160, 80, 90);
      doc.text('MXN · Saldo pendiente',
        margen + anchoUtil - pad, y + 24, { align: 'right' });
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorImporte);
      doc.text(
        `$ ${importe} MXN`,
        margen + anchoUtil - pad, y + 20, { align: 'right' }
      );
    }

    return y + altoTotal + 8;
  }

  private async dibujarSeccionPagoPDF(
    doc: jsPDF,
    yInicio: number,
    margen: number,
    anchoUtil: number
  ): Promise<void> {
    let y = yInicio;
    const pad = 4;

    // Encabezado de sección
    doc.setFillColor(11, 78, 148);
    doc.rect(margen, y, 3, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 78, 148);
    doc.text('Formas de pago disponibles', margen + 6, y + 6);
    y += 14;

    const colW = (anchoUtil - 6) / 2;
    const xIzq = margen;
    const xDer = margen + colW + 6;

    // --- Caja 1: HSBC ---
    y = await this.dibujarCajaPagoCompleta(doc, {
      x: xIzq, y, w: colW,
      titulo: 'Sucursal bancaria · HSBC',
      lineas: [
        { label: 'Depósito en ventanilla o cajero', valor: '' },
        { label: 'No. Cuenta:', valor: '4062409131' },
        { label: 'Beneficiario:', valor: 'IPTVTEL COMUNICACIONES' }
      ],
      logoPath: 'assets/img/FormasPago/hsbc.svg',
      pad
    });

    // --- Caja 2: SPEI ---
    await this.dibujarCajaPagoCompleta(doc, {
      x: xDer, y: yInicio + 14, w: colW,
      titulo: 'Transferencia SPEI',
      lineas: [
        { label: 'Banca en línea o app bancaria', valor: '' },
        { label: 'CLABE:', valor: '021453040624091311' },
        { label: 'Beneficiario:', valor: 'IPTVTEL COMUNICACIONES' }
      ],
      logoPath: 'assets/img/FormasPago/spei.png',
      pad
    });

    y += 6;

    // --- Caja 3: OXXO (ancho completo) ---
    await this.dibujarCajaPagoCompleta(doc, {
      x: margen, y, w: anchoUtil,
      titulo: 'Tiendas de conveniencia · OXXO · Farmacia del Ahorro',
      lineas: [
        { label: 'Pago en efectivo en cualquier establecimiento participante', valor: '' },
        { label: 'No. Referencia:', valor: '4741764001982278' },
        { label: 'Tu pago se verá reflejado en menos de 24 hrs.', valor: '' }
      ],
      logoPath: 'assets/img/FormasPago/oxxo.png',
      logoW: 36,
      logoH: 15,
      pad
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
    }
  ): Promise<number> {
    const { x, y, w, titulo, lineas, logoPath, logoW, logoH, pad } = opciones;
    const wLogo = logoW ?? 14;
    const hLogo = logoH ?? 10;
    const altoHeader = 8;
    const altoContenido = lineas.length * 8 + 4;
    const altoTotal = altoHeader + altoContenido;

    // Fondo de la caja
    doc.setFillColor(248, 251, 255);
    doc.roundedRect(x, y, w, altoTotal, 3, 3, 'F');
    doc.setDrawColor(205, 222, 248);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, altoTotal, 3, 3, 'D');

    // Encabezado azul
    doc.setFillColor(11, 78, 148);
    doc.roundedRect(x, y, w, altoHeader, 3, 3, 'F');
    doc.rect(x, y + altoHeader - 3, w, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, x + pad, y + 5.5);

    // Contenido
    lineas.forEach((linea, idx) => {
      const lineY = y + altoHeader + 6 + idx * 8;
      if (linea.valor) {
        doc.setTextColor(80, 100, 130);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(linea.label, x + pad, lineY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(11, 78, 148);
        const labelW = doc.getTextWidth(linea.label + ' ');
        doc.text(linea.valor, x + pad + labelW, lineY);
      } else {
        doc.setTextColor(90, 110, 140);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
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
    const altoFoot = 16;

    // Franja fina de acento sobre el pie
    doc.setFillColor(24, 106, 206);
    doc.rect(0, pageH - altoFoot - 1, pageW, 1, 'F');

    // Fondo azul oscuro del pie
    doc.setFillColor(11, 78, 148);
    doc.rect(0, pageH - altoFoot, pageW, altoFoot, 'F');

    // Logo en pie
    try {
      const logoResp = await fetch('assets/img/emenetLogoB.png');
      const logoBlob = await logoResp.blob();
      const logoDataUrl = await this.blobToDataUrl(logoBlob);
      doc.addImage(
        logoDataUrl, 'PNG',
        12, pageH - altoFoot + 3, 22, 10, undefined, 'FAST'
      );
    } catch {
      // Sin logo de respaldo
    }

    // Texto central
    doc.setTextColor(180, 210, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'emenet comunicaciones  ·  Estado de Cuenta  ·  Documento generado automáticamente',
      pageW / 2, pageH - 5.5, { align: 'center' }
    );

    // Página
    doc.setTextColor(140, 180, 230);
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