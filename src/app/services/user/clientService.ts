import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from './routeApi';


@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiLocalUrl = environment.apiLocalUrl

  constructor(private http: HttpClient) { }

  //obtener token de local o de sessionStorage
  private getToken(): string | null {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  //obtencion de headers
  getHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders().set('Accept', 'application/json');
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  //peticiones para usuarios
  getAuthenticatedUser(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.apiLocalUrl}/user`, { headers });
  }

  updateUser(id: string, data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.patch(`${this.apiLocalUrl}/usuarios/${id}`, data, { headers });
  }
 
 //envia correo de verificacion para agregar servicio
  addService(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.apiLocalUrl}/servicios`, data, { headers });
  }

  //verificador de codigo se agrega el servicio
  confirmarServicio(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.apiLocalUrl}/servicios/verificar`, data, { headers });
  }

  //metodo index 
  getService(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.apiLocalUrl}/servicios`, { headers });
  }

  // servicios.service.ts
  getClientePorNumero(numero: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.apiLocalUrl}/cliente/${numero}`, { headers });
  }

  deleteService(id: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete<any>(`${this.apiLocalUrl}/servicios/${id}`, { headers });
  }

  verifyAccessService(cliente: string): Observable<{has_access: boolean, servicio?: any}>{
    const headers = this.getHeaders();
    return this.http.get<{has_access: boolean, servicio?: any}>(`${this.apiLocalUrl}/verify-access-service/${cliente}`, { headers });
  }

  //pagoralia
  crearOrdenPagoralia(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.apiLocalUrl}/pagoralia/orden-pago`, data, { headers });
  }

  desencriptarInvoice(data: { invoice: string }): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.apiLocalUrl}/pagoralia/invoice`, data, { headers });
  }

}
