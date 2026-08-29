import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';

@Component({
  selector: 'app-modal-base',
  imports: [CommonModule, NgClass],
  templateUrl: './modal-base.html',
  styleUrl: './modal-base.css'
})
export class ModalBase {

  @Input() titulo = '';
  @Input() subtitulo = '';
  @Input() icono = '';
  @Input() clase = '';

  @Output() cerrar = new EventEmitter<void>();

  cerrarModal(): void {
    this.cerrar.emit();
  }

  cerrarPorOverlay(evento: MouseEvent): void {

    if (evento.target === evento.currentTarget) {
      this.cerrar.emit();
    }
  }

}
