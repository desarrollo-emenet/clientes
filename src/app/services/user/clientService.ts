import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
//import { environment } from './routeApi';
import { environment } from '../../../environments/environment';



@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = environment.apiUrl
  private apiUrl2 = environment.apiUrl2
  private tokenKey = environment.tokenKey

  constructor(private http: HttpClient) { }

  //obtener token de local o de sessionStorage
  private getToken(): string | null {
    return sessionStorage.getItem('authToken');
  }

  getHeaders(inlcudeWebKey: boolean = false ): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders().set('Accept', 'application/json');
    if (inlcudeWebKey) headers = headers.set("x-web-key", `${this.tokenKey}`);
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }


  
  //peticiones para usuarios
  getAuthenticatedUser(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.apiUrl}/user`, { headers });
  }

  updateUser(id: string, data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.patch(`${this.apiUrl}/usuarios/${id}`, data, { headers });
  }

  //envia correo de verificacion para agregar servicio
  addService(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.apiUrl}/servicios`, data, { headers });
  }

  //verificador de codigo se agrega el servicio
  confirmarServicio(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.apiUrl}/servicios/verificar`, data, { headers });
  }

  //metodo index 
  getService(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.apiUrl}/servicios`, { headers });
  }

  // servicios.service.ts
  getClientePorNumero(numero: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.apiUrl}/cliente/${numero}`, { headers });
  }

  deleteService(id: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete<any>(`${this.apiUrl}/servicios/${id}`, { headers });
  }

  verifyAccessService(cliente: string): Observable<{ has_access: boolean, servicio?: any }> {
    const headers = this.getHeaders();
    return this.http.get<{ has_access: boolean, servicio?: any }>(`${this.apiUrl}/verify-access-service/${cliente}`, { headers });
  }

  //pagoralia
  crearOrdenPagoralia(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.apiUrl}/pagoralia/orden-pago`, data, { headers });
  }

  desencriptarInvoice(data: { invoice: string }): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.apiUrl}/pagoralia/invoice`, data, { headers });
  }

  //formulario para pagos
  pagosBanco(data: any): Observable<any> {
    const headers = this.getHeaders(true); 
    return this.http.post<any>(`${this.apiUrl2}/pagos-bancoV2`, data, { headers: headers });
  }
  
  resBanco(cliente: string): Observable<any> {
    const headers = this.getHeaders(true); 
    return this.http.get<any>(`${this.apiUrl2}/pagos-bancoV2/${cliente}`, { headers: headers });
  }

  //visitas
  visitas(cliente: string): Observable<any>{
    const headers = this.getHeaders(true);
    return this.http.get<any>(`${this.apiUrl2}/reportes-clienteV2/${cliente}`, { headers: headers });
  }

  //ticket
  ticket(venta: string): Observable<any>{
    const headers = this.getHeaders(true);
    return this.http.get<any>(`${this.apiUrl2}/clientesV3-ticket/${venta}?tipo=comprobanteCobro`, { headers: headers });
  }
}
