import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ClientService } from '../../services/user/clientService';
import { NgxSonnerToaster, toast } from "ngx-sonner";
import { Subscription } from 'rxjs';
import { LoginS } from '../../services/auth/login';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, NgIf, NgxSonnerToaster, NgClass, NgFor, CurrencyPipe],
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

  getSaludo(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return 'Buenos días';

    }
    if (hour >= 12 && hour < 19) {
      return 'Buenas tardes';
    }
    return 'Buenas noches';
  }

  calcularTotalMensual(servicios: any): number {
    if (!servicios) return 0;
    let total = 0;

    if (servicios.internet && servicios.internet.precio) {
      total += Number(servicios.internet.precio);
    }

    if (servicios.camaras && servicios.camaras.precio) {
      const precio = Number(servicios.camaras.precio) || 0;
      const noCamaras = Number(servicios.camaras.canServicios) || 0;
      total += precio * noCamaras;
    }

    if (servicios.telefono) {
      const precio = Number(servicios.telefono.precio) || 0;
      const lineas = Number(servicios.telefono.canServicios) || 0;
      total += precio * lineas;
    }
    if (servicios.cuentasTv) {
      const precio = Number(servicios.cuentasTv.precio) || 0;
      const canServicios = Number(servicios.cuentasTv.canServicios) || 0;
      total += precio * canServicios;

    }

    return total;
  }

  getMesPagoReciente(): string {
    const estadoCuenta = this.data?.cliente?.servicios?.estadoCuenta;
    return estadoCuenta[estadoCuenta.length - 1].mensualidad;

  }

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
        //const estado = res?.cliente?.cliente?.infoRed?.estado;
        if (clasificacion === 'BAJA') {
          this.mostrarMensaje = true;
        } //else if ( estado === 'Suspendido') {
          //this.mostrarMensaje = true;
        //}

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