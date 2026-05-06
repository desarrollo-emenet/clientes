import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, NgFor, NgClass } from '@angular/common';
import { NgIf } from '@angular/common';
import { ClientService } from '../../services/user/clientService';
import { ActivatedRoute, Route, Router, RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';


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
  showEstadoCuentaModal = false;
   private subs: Subscription[] = [];

  
  constructor(private clientS: ClientService, private route: ActivatedRoute, private router: Router) { }

  /*ngOnInit(): void {
    //this.clientS.getclient('1').subscribe({
    this, this.clientS.getAuthenticatedUser().subscribe({
      next: user => {
        const cliente = user.cliente;
          this.clientS.getclientApi(cliente).subscribe({
          next: res => this.data = res,
          error: err => console.log("Error cliente", err)
        });
      },
      error: err => {
        console.log("Error al obtener los datos", err);
      }
    });
  }*/

    ngOnInit(): void {
        const sub = this.route.paramMap.subscribe(params => {
          const numero = params.get('numero_cliente');
          if (numero) {
            this.loadClientData(numero);
          } else {
            const userSub = this.clientS.getAuthenticatedUser().subscribe({
              next: user => {
                const cliente = user?.cliente;
                if (!cliente) {
                  toast.error('No se encontro infomarcion')
                  return;
                }
                this.loadClientData(cliente);
              },
              error: err => {
            console.error('Error obteniendo usuario autenticado', err);
            toast.error('Error al obtener los datos del usuario');
          }
            });
            this.subs.push(userSub);
          }
        });
        this.subs.push(sub);
        
    }

    loadClientData(numeroCliente: string) {
        this.loading = true;
        this.data = null;
    
        const sub = this.clientS.getClientePorNumero(numeroCliente).subscribe({
          next: res => {
            console.log(res);
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

  async descargarEstadoCuentaPDF(item: any): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const cliente = this.data?.cliente?.cliente;
    const servicios = this.data?.cliente?.servicios;
    const numeroCliente = this.data?.numero_cliente;
    const pageW = doc.internal.pageSize.getWidth();
    const margen = 15;
    const anchoUtil = pageW - margen * 2;

    await this.dibujarEncabezadoPDF(doc, pageW, margen);
    let y = this.dibujarInfoClientePDF(
      doc, cliente, numeroCliente, item, margen, anchoUtil
    );
    y = this.dibujarTablaServiciosPDF(doc, servicios, cliente, y, margen, anchoUtil);
    this.dibujarTotalPendientePDF(doc, cliente, y, margen, anchoUtil);
    await this.dibujarPiePDF(doc, pageW);

    const nombreArchivo =
      `estado-cuenta-${numeroCliente}-${item?.mensualidad ?? 'periodo'}.pdf`;
    doc.save(nombreArchivo);
  }

  private async dibujarEncabezadoPDF(
    doc: jsPDF, pageW: number, margen: number
  ): Promise<void> {
    doc.setFillColor(10, 36, 99);
    doc.rect(0, 0, pageW, 32, 'F');

    // Add larger logo to the header
    try {
      const logoResponse = await fetch('assets/img/logo.png');
      const logoBlob = await logoResponse.blob();
      const logoDataUrl = await this.blobToDataUrl(logoBlob);
      doc.addImage(logoDataUrl, 'PNG', margen, 4, 24, 24);
    } catch (error) {
      console.error('Error loading logo:', error);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('emenet comunicaciones', margen + 30, 13);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('', margen + 30, 20);

    const hoy = new Date().toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.setFontSize(8);
    doc.text(`Emitido: ${hoy}`, pageW - margen, 20, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  private dibujarInfoClientePDF(
    doc: jsPDF,
    cliente: any,
    numeroCliente: string,
    item: any,
    margen: number,
    anchoUtil: number
  ): number {
    let y = 42;

    doc.setFillColor(245, 247, 255);
    doc.roundedRect(margen, y, anchoUtil, 38, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 36, 99);
    doc.text('DATOS DEL CLIENTE', margen + 4, y + 7);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const nombre = cliente?.nombre ?? 'N/A';
    const numCliente = `Cliente #${numeroCliente ?? 'N/A'}`;
    const numVenta = `Venta #${item?.VENTA ?? 'N/A'}`;
    const direccionParts = [
      cliente?.direccion,
      cliente?.colonia,
      cliente?.municipio,
      cliente?.estado,
      cliente?.pais
    ].filter(Boolean);
    const direccion = direccionParts.join(', ') || 'Sin dirección registrada';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(nombre, margen + 4, y + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`${numCliente}   |   ${numVenta}`, margen + 4, y + 23);

    const dirLines = doc.splitTextToSize(direccion, anchoUtil - 8);
    doc.text(dirLines, margen + 4, y + 30);

    y += 46;

    doc.setFillColor(10, 36, 99);
    doc.roundedRect(margen, y, anchoUtil, 22, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PERÍODO DE PAGO', margen + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(item?.mensualidad ?? 'N/A', margen + 4, y + 15);

    const importe = this.formatearPesos(item?.importe ?? 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`MXN ${importe}`, margen + anchoUtil - 4, y + 15, { align: 'right' });

    return y + 30;
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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(10, 36, 99);
    doc.text('SERVICIOS CONTRATADOS', margen, y);
    y += 6;

    const colServicio = anchoUtil * 0.45;
    const colDetalle = anchoUtil * 0.30;
    const colPrecio = anchoUtil * 0.25;

    doc.setFillColor(10, 36, 99);
    doc.rect(margen, y, anchoUtil, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Servicio', margen + 3, y + 5);
    doc.text('Detalle', margen + colServicio + 3, y + 5);
    doc.text('Precio/mes', margen + colServicio + colDetalle + 3, y + 5);
    y += 7;

    const filas = this.construirFilasServicios(servicios, cliente);

    filas.forEach((fila, idx) => {
      const bgColor = idx % 2 === 0 ? [255, 255, 255] : [245, 247, 255];
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.rect(margen, y, anchoUtil, 8, 'F');

      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(fila.servicio, margen + 3, y + 5.5);
      doc.text(fila.detalle, margen + colServicio + 3, y + 5.5);
      doc.text(`MXN ${fila.precio}`, margen + colServicio + colDetalle + 3, y + 5.5);
      y += 8;
    });

    doc.setDrawColor(200, 210, 240);
    doc.line(margen, y, margen + anchoUtil, y);

    return y + 8;
  }

  private construirFilasServicios(
    servicios: any, cliente: any
  ): { servicio: string; detalle: string; precio: string }[] {
    const filas: { servicio: string; detalle: string; precio: string }[] = [];

    if (servicios?.internet) {
      filas.push({
        servicio: 'Internet',
        detalle: `${cliente?.nombrePlan ?? ''} · ${cliente?.planInternet ?? 0} Mbps`,
        precio: this.formatearPesos(servicios.internet.precio ?? 0)
      });
    }

    if ((servicios?.camaras?.canServicios ?? 0) > 0) {
      filas.push({
        servicio: 'Cámaras',
        detalle: `${servicios.camaras.canServicios} servicio(s)`,
        precio: this.formatearPesos(servicios.camaras.precio ?? 0)
      });
    }

    if ((servicios?.telefono?.canServicios ?? 0) > 0) {
      filas.push({
        servicio: 'Telefonía',
        detalle: `${servicios.telefono.canServicios} línea(s)`,
        precio: this.formatearPesos(servicios.telefono.precio ?? 0)
      });
    }

    if ((servicios?.cuentasTv?.canServicios ?? 0) > 0) {
      filas.push({
        servicio: 'TV',
        detalle: `${servicios.cuentasTv.canServicios} servicio(s)`,
        precio: this.formatearPesos(servicios.cuentasTv.precio ?? 0)
      });
    }

    return filas;
  }

  private dibujarTotalPendientePDF(
    doc: jsPDF,
    cliente: any,
    y: number,
    margen: number,
    anchoUtil: number
  ): void {
    const deuda = cliente?.deuda ?? 0;
    const colorFondo = deuda > 0 ? [220, 53, 69] : [40, 167, 69];

    doc.setFillColor(colorFondo[0], colorFondo[1], colorFondo[2]);
    doc.roundedRect(margen, y, anchoUtil, 18, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL PENDIENTE', margen + 4, y + 7);

    doc.setFontSize(13);
    doc.text(
      `MXN ${this.formatearPesos(deuda)}`,
      margen + anchoUtil - 4,
      y + 12,
      { align: 'right' }
    );

    if (deuda > 0) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Realiza tu pago del 1 al 5 de cada mes.', margen + 4, y + 14);
    }
  }

  private async dibujarPiePDF(doc: jsPDF, pageW: number): Promise<void> {
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(10, 36, 99);
    doc.rect(0, pageH - 12, pageW, 12, 'F');

    // Add logo to the left corner
    try {
      const logoResponse = await fetch('assets/img/emenetLogo.png');
      const logoBlob = await logoResponse.blob();
      const logoDataUrl = await this.blobToDataUrl(logoBlob);
      doc.addImage(logoDataUrl, 'PNG', 3, pageH - 10, 8, 8);
    } catch (error) {
      console.error('Error loading logo:', error);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'EMENET · Documento generado automáticamente · emenet.mx',
      pageW / 2,
      pageH - 4.5,
      { align: 'center' }
    );
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