import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ClipboardModule } from 'ngx-clipboard';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { ClientService } from '../../services/user/clientService';
import { firstValueFrom } from 'rxjs';
import { PaymentService } from '../../services/pagoralia/paymentService';
import { UserService } from '../../services/user/user-service';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../../services/utility/http.service';

@Component({
  selector: 'app-payment',
  imports: [ClipboardModule, NgxSonnerToaster, NgIf, FormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class Payment {
  mensajeCopiado: boolean = false;
  data: any;
  loading = false;
  loadingPago = false;


  constructor(
    private clientS: ClientService,
    private paymentService: PaymentService,
    private user: UserService,
    protected http: HttpService) { }

  ngOnInit(): void {
    const numeroCliente = this.user.obtenerServicioActivo();
    if (!numeroCliente) return;
    this.loadClientData(numeroCliente);
  }

  protected async loadClientData(numeroCliente: string): Promise<void> {
    this.loading = true;
    this.data = null;
    try {
      const res = await firstValueFrom(this.clientS.getClientePorNumero(numeroCliente));
      this.data = { numeroCliente: res?.cliente?.cliente?.cliente ?? '' };
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    } finally {
      this.loading = false;
    }

  }

  protected async pagar(): Promise<void> {
    const numeroCliente = this.user.obtenerServicioActivo();
    if (!numeroCliente) return;

    try {
      this.loadingPago = true;
      const res = await firstValueFrom(this.paymentService.pagar(numeroCliente));

      if (res.status && res.redirectUrl) {
      window.open(res.redirectUrl, '_blank');
    } else {
      toast.error('No se pudo generar la orden');
    }

    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    } finally {
      this.loadingPago = false;
    }
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
    const phone = '7133475658';
    const text = encodeURIComponent('Hola, necesito ayuda con mi pago.');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  // Modal para buscar invoice solo pruebas, quitar posteriormente
  showInvoiceModal = false;
  invoiceInput = '';
  invoiceResult: any = null;
  invoiceError: string | null = null;

  openInvoiceModal(): void {
    this.showInvoiceModal = true;
  }

  closeInvoiceModal(): void {
    this.showInvoiceModal = false;
    this.invoiceInput = '';
    this.invoiceResult = null;
    this.invoiceError = null;
  }

  /*buscarInvoice(): void {
    const invoice = this.invoiceInput.trim();

    if (!invoice) {
      this.invoiceError = 'Ingresa un invoice válido';
      return;
    }

    this.invoiceResult = null;
    this.invoiceError = null;

    this.paymentService.invoice(invoice).subscribe({
      next: (res: any) => {

        if (res.success && res.data) {
          this.invoiceResult = res.data;
        } else {
          this.invoiceError = 'No se pudo obtener información';
        }
      },
      error: (err) => {
        console.error(err);
        this.invoiceError = 'Error al consultar el invoice';
      }
    });
  }*/
}
