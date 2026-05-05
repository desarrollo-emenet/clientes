import { Injectable } from '@angular/core';
import { ClientService } from '../user/clientService';
import { toast } from 'ngx-sonner';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private loading = false;

  constructor(private clientS: ClientService){}

  
    pagar(numeroCliente: string) {
      const numero = String(numeroCliente || '').trim();
  
      if (!numero) {
        toast.error('No se encontró el número de cliente');
        return;
      }
  
      if (this.loading) return;
  
      this.loading = true;
  
      this.clientS.crearOrdenPagoralia({
        numero_cliente: numero
      }).subscribe({
        next: (res) => {
          this.loading = false;
  
          if (res.status && res.redirectUrl) {
            window.open(res.redirectUrl, '_blank');
          } else {
            toast.error('No se pudo generar la orden');
            console.error('Respuesta inesperada:', res);
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error:', err);
          console.error('Error detalles:', {
            status: err?.status,
            message: err?.message,
            error: err?.error
          });
          toast.error('Error al procesar el pago');
        }
      });
    }

}
