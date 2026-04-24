import { NgClass } from '@angular/common';
import { Component, HostListener } from '@angular/core';

const ZOOM_MIN  = 1;
const ZOOM_MAX  = 3;
const ZOOM_PASO = 0.05;

@Component({
  selector: 'app-faq',
  imports: [NgClass],
  templateUrl: './faq.html',
  styleUrl: './faq.css'
})
export class FAQ {

  activeSection: string = 'ayuda';
  activeView: string = 'puertos';
  modalAbierto: boolean = false;
  imagenModal: string = '';
  nivelZoom: number = 1;
  anchoNatural: number = 0;
  altoNatural: number = 0;

  showSection(id: string): void {
    this.activeSection = id;
  }

  showView(id: string): void {
    this.activeView = id;
  }

  abrirModal(src: string): void {
    this.imagenModal = src;
    this.nivelZoom = 1;
    this.anchoNatural = 0;
    this.altoNatural = 0;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.imagenModal = '';
    this.nivelZoom = 1;
  }

  acercar(): void {
    this.nivelZoom = Math.min(
      this.nivelZoom + ZOOM_PASO, ZOOM_MAX
    );
  }

  alejar(): void {
    this.nivelZoom = Math.max(
      this.nivelZoom - ZOOM_PASO, ZOOM_MIN
    );
  }

  get nivelZoomPorcentaje(): number {
    return Math.round(this.nivelZoom * 100);
  }

  capturarDimensiones(evento: Event): void {
    const img = evento.target as HTMLImageElement;
    const rect = img.getBoundingClientRect();
    this.anchoNatural = rect.width;
    this.altoNatural = rect.height;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalAbierto) this.cerrarModal();
  }
}
