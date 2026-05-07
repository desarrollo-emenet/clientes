import { Component } from '@angular/core';
import { NavComponent } from '../../shared/nav/nav';

import { ClientService } from '../../services/user/clientService';
import { NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';
import { Subscription } from 'rxjs';
import { UserService } from '../../services/user/user-service';

@Component({
  selector: 'app-profile',
  imports: [NgIf, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  error = '';

  data: any;
  loading = false;
  private subs: Subscription[] = [];

  constructor(
    private clientS: ClientService,
    private route: ActivatedRoute,
    private user: UserService,
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
        this.data = {
          servicio: res.servicio,
          cliente: res.cliente?.cliente,
          servicios: res.cliente?.servicios,
          numero_cliente: res.numero_cliente
        };
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

}
