import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ClipboardModule } from 'ngx-clipboard';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { ClientService } from '../../services/user/clientService';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoginS } from '../../services/auth/login';


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

  constructor(private clientS: ClientService, private auth: LoginS, private router: Router, private route: ActivatedRoute) { }

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
              toast.error('No se encontró información del cliente');
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
    const numeroCliente = String(this.data?.numero_cliente || '').trim();

    if (!numeroCliente) {
      toast.error('No se encontró el número de cliente');
      return;
    }

    if (this.loadingPago) return;

    this.loadingPago = true;

    const sub = this.clientS.crearOrdenPagoralia({
      numero_cliente: numeroCliente
    }).subscribe({
      next: (res) => {
        this.loadingPago = false;

        if (res.status && res.redirectUrl) {
          window.open(res.redirectUrl, '_blank');
        } else {
          toast.error('No se pudo generar la orden');
          console.error('Respuesta inesperada:', res);
        }
      },
      error: (err) => {
        this.loadingPago = false;
        console.error('Error:', err);
        console.error('Error detalles:', {
          status: err?.status,
          message: err?.message,
          error: err?.error
        });
        toast.error('Error al procesar el pago');
      }
    });

    this.subs.push(sub);
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
