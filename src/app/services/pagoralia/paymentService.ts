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
  formInfo: FormGroup;


  private apiUrl = environment.apiUrl
  constructor(private clientS: ClientService, private http: HttpClient, private fb: FormBuilder) {
    this.formInfo = fb.group({
      isUnique: [1, [Validators.required]],
      invoice: [null, [Validators.required]],
      cliente: [null, [Validators.required]],
      nombre: [null, [Validators.required]],
      apellido: [null, [Validators.required]],
      monto: [null, [Validators.required]],
      moneda: [null, [Validators.required]],
    });
  }

  crearOrdenPagoralia(data: any): Observable<any> {
    const headers = this.clientS.getHeaders();
    return this.http.post<any>(`${this.apiUrl}/pagoralia/orden-pago`, data, { headers });
  }

  invoice(invoice: string) {
    return this.clientS.desencriptarInvoice({ invoice });
  }




}
