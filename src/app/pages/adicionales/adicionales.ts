import { Component, HostListener } from '@angular/core';
import { NgClass, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PRODUCTOS, Producto } from './serviceAdicional';


@Component({
  selector: 'app-adicionales',
  imports: [NgClass, CommonModule, MatIconModule],
  templateUrl: './adicionales.html',
  styleUrl: './adicionales.css'
})
export class Adicionales {

  activeSection: string = 'servicios';
  modalActivo: string | null = null;
  productoSeleccionado: Producto | null = null;
  zoomIndex: number | null = null;


  @HostListener('window:keydown.escape')
  cerrarConEscape(): void {
    if (this.zoomIndex !== null) {
      this.cerrarZoom();
      return;
    }
    if (this.modalActivo !== null) {
      this.modalActivo = null;
      document.body.style.overflow = '';
    }
  }

  get productos(): Producto[] {
    return Object.values(PRODUCTOS);
  }

  showSection(id: string): void {
    this.activeSection = id;
    this.cerrarModal();
  }

  abrirModal(seccion: string): void {
    this.modalActivo = seccion;
    document.body.style.overflow = 'hidden';
  }

  cerrarModal(evento?: MouseEvent): void {

    if (evento) {
      const target = evento.target as HTMLElement;

      if (!target.classList.contains('modal-overlay')) {
        return;
      }
    }
    this.modalActivo = null;
    this.productoSeleccionado = null;

    document.body.style.overflow = '';
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
    document.body.style.overflow = 'hidden';
  }

  cambiarImagen(index: number): void {
    if (!this.productoSeleccionado) return;
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
    if (evento) {
      const target = evento.target as HTMLElement;
      if (!target.classList.contains('zoom-overlay')) {
        return;
      }
    }
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
    const mensaje = encodeURIComponent(
      `Hola, quiero información sobre el punto de venta My Business POS: ${opcion}`
    );
    window.open(
      `https://api.whatsapp.com/send?phone=5217131334557&text=${mensaje}`,
      '_blank'
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
    if (servicio === 'camaras') {
      return this.construirMensajeCamaras(campos);
    }
    if (servicio === 'web') {
      return this.construirMensajeWeb(campos);
    }
    return `Hola, quiero solicitar una cotización de: ${servicio}`;
  }

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
