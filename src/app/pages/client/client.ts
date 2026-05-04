import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, NgFor, NgClass } from '@angular/common';
import { NgIf } from '@angular/common';
import { ClientService } from '../../services/user/clientService';
import { ActivatedRoute, Route, Router, RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-client',
  imports: [CurrencyPipe, NgIf, NgFor, RouterLink, NgClass],
  templateUrl: './client.html',
  styleUrl: './client.css'
})

export class Client implements OnInit {
  data: any;
  showDetails = false;
  loading = false;
  showEstadoCuentaModal = false;
   private subs: Subscription[] = [];

  
  constructor(private clientS: ClientService, private route: ActivatedRoute, private router: Router) { }

  /*ngOnInit(): void {
    //this.clientS.getclient('1').subscribe({
    this, this.clientS.getAuthenticatedUser().subscribe({
      next: user => {
        const cliente = user.cliente;
          this.clientS.getclientApi(cliente).subscribe({
          next: res => this.data = res,
          error: err => console.log("Error cliente", err)
        });
      },
      error: err => {
        console.log("Error al obtener los datos", err);
      }
    });
  }*/

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
                  toast.error('No se encontro infomarcion')
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
            console.log(res);
            this.data = res,
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

  toggleDetails() { this.showDetails = !this.showDetails; }

  calcularTotalMensual(servicios: any): number {

    if (!servicios) return 0;
    let total = 0;
    let cantidadServicios = 0;

    if (servicios.internet && servicios.internet.precio) {
      total += Number(servicios.internet.precio);
      cantidadServicios++;
    }

    if (servicios.camaras && servicios.camaras.precio) {
      const precio = Number(servicios.camaras.precio) || 0;
      const noCamaras = Number(servicios.camaras.canServicios) || 0;
      total += precio * noCamaras;
      cantidadServicios++;
    }

    if (servicios.telefono) {
      const precio = Number(servicios.telefono.precio) || 0;
      const lineas = Number(servicios.telefono.canServicios) || 0;
      total += precio * lineas;
      cantidadServicios++;
  
    }
    if (servicios.cuentasTv) {
      const precio = Number(servicios.cuentasTv.precio) || 0;
      const canServicios = Number(servicios.cuentasTv.canServicios) || 0;
      total += precio * canServicios;
      cantidadServicios++;

    }
 

    return total;

    //console.log("Total de servicios: ", cantidadServicios)
    //console.log('Total servicio:', servicios.cuentasTv.precio);
    //console.log('Total mesualidad:', total);
    //return 0;
  }

    get latestPayments() {
    const list = this.data?.servicios?.estadoCuenta || [];
    return list.slice(0, 5);
  }

  getMesPagoReciente(): string {
    const estadoCuenta = this.data?.cliente?.servicios?.estadoCuenta;
    if (!estadoCuenta || estadoCuenta.length === 0) {
      return 'Sin pagos registrados';
    }
    return estadoCuenta[estadoCuenta.length - 1].mensualidad;
  }

  contactSupport() {
    const phone = '7133475658';
    const text = encodeURIComponent('Hola, necesito ayuda.');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  abrirEstadoCuentaModal() {
    this.showEstadoCuentaModal = true;
  }

  cerrarEstadoCuentaModal() {
    this.showEstadoCuentaModal = false;
  }
  // Esta función solo cuenta cuántos servicios activos hay
contarServicios(servicios: any): number {
  if (!servicios) return 0;
  
  let conteo = 0;

  if (servicios.internet) conteo++;
  if (servicios.camaras) conteo++;
  if (servicios.telefono) conteo++;
  if (servicios.cuentasTv) conteo++;

  return conteo;
}

contarServiciosActivos(): number {
  if (!this.data?.cliente?.servicios) return 0;
  
  let conteo = 0;
  const servicios = this.data.cliente.servicios;

  if (servicios.internet) conteo++;
  if (servicios.camaras) conteo++;
  if (servicios.telefono) conteo++;
  if (servicios.cuentasTv) conteo++;

  return conteo;
}


}