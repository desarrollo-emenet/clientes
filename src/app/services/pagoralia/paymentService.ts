import { Injectable } from '@angular/core';
import { ClientService } from '../user/clientService';
import { toast } from 'ngx-sonner';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private apiUrl = environment.apiUrl
  constructor(private clientS: ClientService, private http: HttpClient, private fb: FormBuilder) {
  }

  crearOrdenPagoralia(data: any): Observable<any> {
    const headers = this.clientS.getHeaders();
    return this.http.post<any>(`${this.apiUrl}/pagoralia/orden-pago`, data, { headers });
  }

  invoice(invoice: string) {
    return this.clientS.desencriptarInvoice({ invoice });
  }
}
