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
    const altoHeader = 34;

    // Fondo blanco del encabezado
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, altoHeader, 'F');

    // Línea inferior de acento en color #333333
    doc.setFillColor(51, 51, 51);
    doc.rect(0, altoHeader, pageW, 1.5, 'F');

    // Logo emenet a la izquierda (oscuro, sobre fondo blanco)
    try {
      const logoResp = await fetch('assets/img/emenetLogo.png');
      const logoBlob = await logoResp.blob();
      const logoDataUrl = await this.blobToDataUrl(logoBlob);
      doc.addImage(
        logoDataUrl, 'PNG', margen, 5, 36, 18, undefined, 'FAST'
      );
    } catch {
      try {
        const logoResp = await fetch('assets/img/emenetLogoB.png');
        const logoBlob = await logoResp.blob();
        const logoDataUrl = await this.blobToDataUrl(logoBlob);
        doc.addImage(
          logoDataUrl, 'PNG', margen, 5, 36, 18, undefined, 'FAST'
        );
      } catch {
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('emenet', margen, 20);
      }
    }

    // Bloque de información en esquina derecha (estilo recibo Telmex)
    const hoy = new Date().toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const folio = `Folio: ${Date.now().toString().slice(-8)}`;
    const xInfo = pageW - margen;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('COMPROBANTE DE PAGO', xInfo, 9, { align: 'right' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 75, 100);
    doc.text(`Periodo: ${item?.mensualidad ?? 'N/A'}`, xInfo, 16, { align: 'right' });
    doc.text(`Emitido: ${hoy}`, xInfo, 22, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 140, 170);
    doc.text(folio, xInfo, 28, { align: 'right' });
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

    // Fondo del bloque de cliente (gris neutro muy claro)
    doc.setFillColor(250, 250, 250);
    doc.rect(0, y, pageW, altoBloque, 'F');
    doc.setDrawColor(225, 225, 225);
    doc.setLineWidth(0.3);
    doc.line(0, y + altoBloque, pageW, y + altoBloque);

    // --- COLUMNA IZQUIERDA: Datos del cliente ---
    const nombre = (cliente?.nombre ?? 'N/A').toUpperCase();
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
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
    doc.setTextColor(51, 51, 51);
    doc.text(`${numeroCliente ?? 'N/A'}`, margen + 22, y + 30);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 135, 160);
    doc.text(`Venta: #${item?.VENTA ?? 'N/A'}`, margen + 55, y + 30);

    // --- COLUMNA DERECHA: Importe destacado (estilo comprobante con borde) ---
    const importe = this.formatearPesos(totalServicios);
    const deuda = cliente?.deuda ?? 0;
    const colorBordeCaja: [number, number, number] = deuda > 0
      ? [220, 53, 69] : [51, 51, 51];
    const colorTextoCaja: [number, number, number] = deuda > 0
      ? [180, 30, 50] : [51, 51, 51];

    // Solo borde, sin relleno
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(xDer, y + 2, colDer, altoBloque - 6, 4, 4, 'F');
    doc.setDrawColor(...colorBordeCaja);
    doc.setLineWidth(1.2);
    doc.roundedRect(xDer, y + 2, colDer, altoBloque - 6, 4, 4, 'D');

    // Franja superior coloreada como acento
    doc.setFillColor(...colorBordeCaja);
    doc.roundedRect(xDer, y + 2, colDer, 8, 4, 4, 'F');
    doc.rect(xDer, y + 6, colDer, 4, 'F');

    // Etiqueta en la franja
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    const etiqCaja = deuda > 0 ? 'IMPORTE DEL PERIODO' : 'CARGO MENSUAL';
    doc.text(etiqCaja, xDer + colDer / 2, y + 8.5, { align: 'center' });

    // Importe con texto de color oscuro sobre fondo claro
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorTextoCaja);
    doc.text(`$${importe}`, xDer + colDer / 2, y + 26, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 140, 170);
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

    // Título sección (estilo Totalplay)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Detalle de servicios contratados', margen, y + 7);

    // Barra de acento horizontal gruesa (Totalplay)
    doc.setFillColor(51, 51, 51);
    doc.rect(margen, y + 10, 35, 1.5, 'F');

    // Línea fina continuadora gris
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margen + 35, y + 10.6, margen + anchoUtil, y + 10.6);
    y += 17;

    const colServ = anchoUtil * 0.35;
    const colDet = anchoUtil * 0.40;

    // Encabezado tabla (Gris #333333)
    doc.setFillColor(51, 51, 51);
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
      // Filas con gris claro alternado neutro
      const bgRgb: [number, number, number] = idx % 2 === 0
        ? [250, 250, 250] : [242, 242, 242];
      doc.setFillColor(...bgRgb);
      doc.rect(margen, y, anchoUtil, 9, 'F');

      doc.setDrawColor(220, 220, 220);
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
      doc.setTextColor(51, 51, 51);
      doc.text(
        `$ ${fila.precio}`,
        margen + anchoUtil - pad, y + 6.5, { align: 'right' }
      );

      subtotal += parseFloat(fila.precio.replace(/,/g, ''));
      y += 9;
    });

    // Subtotal
    doc.setFillColor(235, 235, 235);
    doc.rect(margen, y, anchoUtil, 8, 'F');
    doc.setTextColor(51, 51, 51);
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

    // Separador visual gris neutro
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.4);
    doc.line(margen, y, margen + anchoUtil, y);
    y += 5;

    // Caja principal de total (Diseño estilo Totalplay con bordes y acento)
    const altoTotal = 28;
    const esDeudor = deuda > 0;
    const colorAcento: [number, number, number] = esDeudor ? [220, 53, 69] : [25, 135, 84];
    const colorFondo: [number, number, number] = esDeudor ? [255, 248, 248] : [245, 253, 248];

    // Fondo y borde
    doc.setFillColor(...colorFondo);
    doc.roundedRect(margen, y, anchoUtil, altoTotal, 2, 2, 'F');
    doc.setDrawColor(...colorAcento);
    doc.setLineWidth(0.6);
    doc.roundedRect(margen, y, anchoUtil, altoTotal, 2, 2, 'D');

    // Barra izquierda de acento gruesa (estilo Totalplay)
    doc.setFillColor(...colorAcento);
    doc.rect(margen, y, 4, altoTotal, 'F');

    // Mensaje de estado principal
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    const mensajeEstado = esDeudor ? 'SALDO ANTERIOR PENDIENTE' : 'TU CUENTA SE ENCUENTRA AL CORRIENTE';
    doc.text(mensajeEstado, margen + 8, y + 10);

    // Subtexto del periodo
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 120, 130);
    doc.text(
      `Periodo de facturación: ${item?.mensualidad ?? 'N/A'}  ·  Límite de pago: del 1 al 5 de cada mes`,
      margen + 8, y + 19
    );

    // Sección de importe a la derecha
    if (esDeudor) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69);
      doc.text(
        `$ ${this.formatearPesos(deuda)}`,
        margen + anchoUtil - 6, y + 12, { align: 'right' }
      );
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(150, 60, 70);
      doc.text('TOTAL A PAGAR (MXN)',
        margen + anchoUtil - 6, y + 19, { align: 'right' });
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(25, 135, 84);
      doc.text(
        `$ ${importe} MXN`,
        margen + anchoUtil - 6, y + 11.5, { align: 'right' }
      );
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(110, 120, 130);
      doc.text('SIN ADEUDOS PENDIENTES',
        margen + anchoUtil - 6, y + 19, { align: 'right' });
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

    // Título sección (estilo Totalplay)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Formas de pago disponibles', margen, y + 7);

    // Barra de acento horizontal gruesa (Totalplay)
    doc.setFillColor(51, 51, 51);
    doc.rect(margen, y + 10, 35, 1.5, 'F');

    // Línea fina continuadora gris
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margen + 35, y + 10.6, margen + anchoUtil, y + 10.6);
    y += 17;

    const colW = (anchoUtil - 6) / 2;
    const xIzq = margen;
    const xDer = margen + colW + 6;

    const yCajas = y;

    // --- Caja 1: HSBC ---
    y = await this.dibujarCajaPagoCompleta(doc, {
      x: xIzq, y: yCajas, w: colW,
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
      x: xDer, y: yCajas, w: colW,
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

    // Contenido
    lineas.forEach((linea, idx) => {
      const lineY = y + altoHeader + 6 + idx * 8;
      if (linea.valor) {
        doc.setTextColor(80, 100, 130);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(linea.label, x + pad, lineY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 51, 51);
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
        12, pageH - altoFoot + 3, 22, 10, undefined, 'FAST'
      );
    } catch {
      // Sin logo de respaldo
    }

    // Texto central
    doc.setTextColor(220, 220, 220);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'emenet comunicaciones  ·  Estado de Cuenta  ·  Documento generado automáticamente',
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