import { Component, HostListener } from '@angular/core';
import { NgClass, CommonModule, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PRODUCTOS, Producto, SERVICIOS_ADICIONALES, planesInternet } from './serviceAdicional';
import { ModalBase } from './modal-base/modal-base';
import { UserService } from '../../services/user/user-service';
import { ObservableService } from '../../services/utility/observable.service';
import { firstValueFrom } from 'rxjs';
import { ClientService } from '../../services/user/clientService';
import { CalculoService } from '../../services/utility/calculo.service';
import { HttpService } from '../../services/utility/http.service';
import { HttpErrorResponse } from '@angular/common/http';


@Component({
  selector: 'app-adicionales',
  imports: [NgClass, CommonModule, MatIconModule, ModalBase],
  templateUrl: './adicionales.html',
  styleUrl: './adicionales.css'
})
export class Adicionales {

  activeSection: string = 'servicios';
  modalActivo: string | null = null;
  productoSeleccionado: Producto | null = null;
  zoomIndex: number | null = null;

  servicios = SERVICIOS_ADICIONALES;
  planesInternet = planesInternet;
  productos = Object.values(PRODUCTOS);

  constructor(private user: UserService, private ObservableService: ObservableService, private clientS: ClientService,
    private calculo: CalculoService, private http: HttpService
  ){
    const clienteActivo = this.user.obtenerServicioActivo();
    this.ObservableService.cliente$.subscribe((info: any) => {
      if(!info.cliente) this.loadClientData(clienteActivo ?? '');
    })
  }

  protected async loadClientData(numeroCliente: string): Promise<void> {
    try {
      const { cliente, servicios } = await firstValueFrom(this.clientS.getClientePorNumero(numeroCliente));
      this.ObservableService.actualizarObs(cliente, this.calculo.construirNotificaciones(cliente), servicios);
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    }
  }

  private bloquearScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private desbloquearScroll(): void {
    document.body.style.overflow = '';
  }

  private esOverlay(evento: MouseEvent, clase: string): boolean {
    return (evento.target as HTMLElement).classList.contains(clase);
  }

  soloNumeros(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
  }

  soloTexto(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '');
  }

  @HostListener('window:keydown.escape')
  cerrarConEscape(): void {
    if (this.zoomIndex !== null) { this.cerrarZoom(); return; }
    if (this.modalActivo !== null) { this.modalActivo = null; this.desbloquearScroll(); }
  }

  showSection(id: string): void {
    this.activeSection = id;
    this.cerrarModal();
  }

  abrirModal(seccion: string): void {
    this.modalActivo = seccion;
    this.bloquearScroll();
  }

  cerrarModal(evento?: MouseEvent): void {
    if (evento && !this.esOverlay(evento, 'modal-overlay')) { return; }
    this.modalActivo = null;
    this.productoSeleccionado = null;
    this.desbloquearScroll();
  }

  abrirModalProducto(categoria: string): void {
    const producto = PRODUCTOS[categoria];
    if (!producto) {
      console.error(`Producto no encontrado: ${categoria}`);
      return;
    }

    this.productoSeleccionado = {
      ...producto,
      imagenActual: 0
    };
    this.modalActivo = 'producto';
    this.bloquearScroll();
  }

  cambiarImagen(index: number): void {
    if (!this.productoSeleccionado) return;
    const total = this.productoSeleccionado.imagenActual = index;
    if (index < 0 || index >= total) return;
    this.productoSeleccionado.imagenActual = index;
  }

  imagenAnterior(evento?: MouseEvent): void {
    evento?.stopPropagation();
    if (!this.productoSeleccionado) { return; }
    const total = this.productoSeleccionado.imagenes.length;
    if (total <= 1) { return; }

    this.productoSeleccionado.imagenActual =
      (this.productoSeleccionado.imagenActual - 1 + total) % total;
  }

  imagenSiguiente(evento?: MouseEvent): void {
    evento?.stopPropagation();
    if (!this.productoSeleccionado) { return; }
    const total = this.productoSeleccionado.imagenes.length;
    if (total <= 1) { return; }
    this.productoSeleccionado.imagenActual =
      (this.productoSeleccionado.imagenActual + 1) % total;
  }

  abrirZoom(index: number): void {
    this.zoomIndex = index;
  }

  cerrarZoom(evento?: MouseEvent): void {
    if (evento && !this.esOverlay(evento, 'zoom-overlay')) { return; }
    this.zoomIndex = null;
  }

  zoomSiguiente(evento: MouseEvent): void {
    evento.stopPropagation();
    if (!this.productoSeleccionado) { return; }
    const total = this.productoSeleccionado.imagenes.length;
    this.zoomIndex = ((this.zoomIndex ?? 0) + 1) % total;
  }

  zoomAnterior(evento: MouseEvent): void {
    evento.stopPropagation();
    if (!this.productoSeleccionado) { return; }
    const total = this.productoSeleccionado.imagenes.length;
    this.zoomIndex = ((this.zoomIndex! - 1 + total) % total);
  }

  get imagenZoomActual(): string | null {
    if (this.zoomIndex === null || !this.productoSeleccionado) return null;
    return this.productoSeleccionado.imagenes[this.zoomIndex];
  }

  private redirigirAWhatsApp(mensaje: string): void {
    const numeroWhatsApp = '5217131334557';
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=` +
      `${numeroWhatsApp}&text=${mensajeCodificado}`;
    window.open(urlWhatsApp, '_blank');
  }

  solicitarOpcion(opcion: string): void {
    this.redirigirAWhatsApp(
      `Hola, quiero información sobre el punto de venta My Business POS: ${opcion}`
    );
  }

  enviarCotizacion(evento: Event, servicio: string): void {
    evento.preventDefault();
    const formulario = evento.target as HTMLFormElement;
    const campos = new FormData(formulario);
    const mensaje = this.obtenerMensajeCotizacion(servicio, campos);
    this.redirigirAWhatsApp(mensaje);
  }

  private obtenerMensajeCotizacion(
    servicio: string,
    campos: FormData
  ): string {
    const constructor = this.constructoresMensaje[servicio];
    return constructor
      ? constructor(campos)
      : `Hola, quiero solicitar una cotización de: ${servicio}`;
  }

  private readonly constructoresMensaje: Record<string,
    (campos: FormData) => string> = {
      camaras: (campos) => this.construirMensajeCamaras(campos),
      web: (campos) => this.construirMensajeWeb(campos)
    };

  private construirMensajeCamaras(campos: FormData): string {
    const nombre = campos.get('nombre') as string;
    const telefono = campos.get('telefono') as string;
    const cantidad = campos.get('cantidadCamaras') as string;
    const instalacion = campos.get('tipoInstalacion') as string;

    return `Hola, quiero cotizar cámaras de seguridad.\n\n` +
      `*Nombre:* ${nombre}\n` +
      `*Teléfono:* ${telefono}\n` +
      `*Cantidad de cámaras:* ${cantidad}\n` +
      `*Tipo de instalación:* ${instalacion}`;
  }

  private construirMensajeWeb(campos: FormData): string {
    const nombre = campos.get('nombre') as string;
    const telefono = campos.get('telefono') as string;
    const tipoPagina = campos.get('tipoPagina') as string;

    return `Hola, quiero cotizar una página web.\n\n` +
      `*Nombre:* ${nombre}\n` +
      `*Teléfono:* ${telefono}\n` +
      `*Tipo de página:* ${tipoPagina}`;
  }
}
