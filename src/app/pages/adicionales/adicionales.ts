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
    const mensaje = encodeURIComponent(
      `Hola, quiero solicitar una cotización de: ${servicio}`
    );
    window.open(
      `https://api.whatsapp.com/send?phone=5217131334557&text=${mensaje}`,
      '_blank'
    );
  }

}
