import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ClipboardModule } from 'ngx-clipboard';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { ClientService } from '../../services/user/clientService';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaymentService } from '../../services/pagoralia/paymentService';
import { UserService } from '../../services/user/user-service';


@Component({
  selector: 'app-payment',
  imports: [ClipboardModule, NgxSonnerToaster, NgIf],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class Payment {
  mensajeCopiado: boolean = false;
  data: any;
  loading = false;
  loadingPago = false;

  private subs: Subscription[] = [];

  constructor(
    private clientS: ClientService,
    private paymentService: PaymentService,
    private router: Router,
    private user: UserService,
    private route: ActivatedRoute,) { }

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

  //
  loadClientData(numeroCliente: string): void {
    this.loading = true;
    this.data = null;

    const sub = this.clientS.getClientePorNumero(numeroCliente).subscribe({
      next: res => {
        this.data = {
          numero_cliente: res?.cliente?.cliente?.cliente ?? ''
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
          toast.error('No autorizado');
        } else {
          toast.error('Error inesperado');
        }
      }
    });

    this.subs.push(sub);
  }

  // 
  pagar(): void {
    this.paymentService.pagar(this.data?.numero_cliente);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }


  copy(dato: string) {
    navigator.clipboard.writeText(dato)
      .then(() => {
        this.mensajeCopiado = true;
        toast.success("Datos copiados");
      })
      .catch(err => {
        toast.error('Error al copiar');
      });
  }



  contactSupport() {
    const phone = '7291792524';
    const text = encodeURIComponent('Hola, necesito ayuda con mi pago.');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  selectedMethod: string | null = null;

  selectMethod(method: string) {
    this.selectedMethod = method;
  }

}
