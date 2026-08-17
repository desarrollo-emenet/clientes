import { Injectable } from '@angular/core';
import { ClientService } from '../user/clientService';
import { toast } from 'ngx-sonner';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private loading = false;

  constructor(private clientS: ClientService) { }


  pagar(numeroCliente: string): Observable<any> {
    const numero = String(numeroCliente || '').trim();

    if (!numero) {
      throw new Error('No se encontró el número de cliente');
    }

    return this.clientS.crearOrdenPagoralia({
      numero_cliente: numero
    });
  }
  

  invoice(invoice: string) {
    return this.clientS.desencriptarInvoice({ invoice });
  }

}
