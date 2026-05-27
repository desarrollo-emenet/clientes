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
  serviciosAbierto: string | null = null;
  productosAbierto: string | null = null;
  detalleSelec: any = null;


  showSection(id: string): void {
    this.activeSection = id;
    this.serviciosAbierto = null;
    this.productosAbierto = null;
  }

  abrirDetalle(detalles: any) {
    this.detalleSelec = detalles;
  }


  toggleServicios(id: string): void {
    this.serviciosAbierto = this.serviciosAbierto === id ? null : id;
  }

  toggleProductos(id: string): void {
    this.productosAbierto = this.productosAbierto === id ? null : id;
  }


}
