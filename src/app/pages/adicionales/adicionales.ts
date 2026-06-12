import { Component } from '@angular/core';
import { NgClass } from '@angular/common';


@Component({
  selector: 'app-adicionales',
  imports: [NgClass],
  templateUrl: './adicionales.html',
  styleUrl: './adicionales.css'
})
export class Adicionales {

  activeSection: string = 'servicios';
  modalActivo: string | null = null;

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
      const esOverlay = (evento.target as HTMLElement)
        .classList.contains('modal-overlay');
      if (!esOverlay) return;
    }
    this.modalActivo = null;
    document.body.style.overflow = '';
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

  private redirigirAWhatsApp(mensaje: string): void {
    const numeroWhatsApp = '5217131334557';
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=` +
      `${numeroWhatsApp}&text=${mensajeCodificado}`;
    window.open(urlWhatsApp, '_blank');
  }

}
