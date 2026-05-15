import { NgClass, NgIf, NgForOf } from '@angular/common';
import { Component } from '@angular/core';
import { UserService } from '../../services/user/user-service';
import { toast } from 'ngx-sonner';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-visits',
  imports: [NgClass, NgIf, NgForOf],
  templateUrl: './visits.html',
  styleUrl: './visits.css'
})
export class Visits {

    private subs: Subscription[] = [];
  
    constructor(
      private user: UserService,
      private route: ActivatedRoute,) { }
  
    ngOnInit(): void {
      const sub = this.user.obtenerUsuarioAutenticado(this.route)
        .subscribe({
          next: (numeroCliente) => {
            if (!numeroCliente) return;
            //this.loadClientData(numeroCliente);
          },
          error: (e) => {
            console.error('Error al obtener usuario autenticado', e);
            toast.error('Error al obtener información del usuario');
          }
        });
      this.subs.push(sub);
    }

  visitas = [
    {
      asunto: 'Sin conexión a Internet',
      fecha: '13 Mayo 2026',
      tecnico: 'Luis Bernal',
      estatus: 'atendido',
      detalles: 'Se realizó revisión de ONT y reconexión.',
      diagnostico: 'Sin conexión a Internet',
      solucion: 'Se restableció el acceso a Internet'
    },
    {
      asunto: 'Foco Rojo',
      fecha: '10 Mayo 2026',
      tecnico: 'Daniel',
      estatus: 'cancelado',
      detalles: 'Cliente no se encontraba en domicilio.',
      diagnostico: 'Sin conexión a Internet',
      solucion: 'Se restableció el acceso a Internet'
    },
    {
      asunto: 'Internet lento a',
      fecha: '3 Mayo 2026',
      tecnico: 'Daniel',
      estatus: 'pendiente',
      detalles: 'Cliente no se encontraba en domicilio.'
    }
  ];

  visitaSeleccionada: any = null;

  abrirDetalle(visita: any) {
    this.visitaSeleccionada = visita;
  }

}
