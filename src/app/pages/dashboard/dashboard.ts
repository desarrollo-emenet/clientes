import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgClass } from '@angular/common';
import { ClientService } from '../../services/user/clientService';
import { NgxSonnerToaster, toast } from "ngx-sonner";
import { Subscription } from 'rxjs';
import { LoginS } from '../../services/auth/login';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, NgIf, NgxSonnerToaster, NgClass],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  isLogin = false;
  username = 'Marcos'
  error = '';
  mostrarMensaje = false 

  data: any = null;
  loading = false;
  private subs: Subscription[] = [];

  constructor(private clientS: ClientService, private route: ActivatedRoute, private router: Router, private auth: LoginS) { }

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
              toast.error('No se encontro numero de cliente');
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
        //console.log(res);
        this.data = res;
        this.loading = false;

        const clasificacion = res?.cliente?.cliente?.clasificacion;
        if (clasificacion === 'BAJA') {
          this.mostrarMensaje = true;
        }

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
          //toast.error('No autorizado para eliminar este servicio');
          this.mostrarMensaje = true;
        } else {
          toast.error('Error inesperado');
        }
      }
    })
  }

  contactSupport() {
    const phone = '7121748293';
    const text = encodeURIComponent('Hola, necesito ayuda.');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }


  goEstadoCuenta() {
    this.auth.goNavigate('/estadoCuenta')
  }

  cerrarModal() {
    this.mostrarMensaje = false;
  }

  irAContratar() {
    window.open('https://emenet.mx/planes', '_blank');
  }


} 