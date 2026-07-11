import { EventEmitter, Injectable, Output } from '@angular/core';
import { LoginRequest, RegisterRequest, RecoverRequest } from './loginRequest';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
// import { environment } from '../user/routeApi';
// environment
import { toast } from 'ngx-sonner';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

//servicio crea un observable que escucha la api rest
export class LoginS {
  @Output() linkClick = new EventEmitter<void>();

  constructor(private http: HttpClient, private router: Router) { }

  private apiLocalUrl = environment.apiLocalUrl

  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }
  getHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders().set('Accept', 'application/json');
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  //Login post
  login(credentials: LoginRequest): Observable<any> {
    //console.log(credentials);
    return this.http.post<any>(`${this.apiLocalUrl}/auth/login`, credentials);
  }

  logout(): Observable<any> {
    const headers = this.getHeaders();
    //console.log('Headers que se enviarán:', headers.keys().map(k => `${k}: ${headers.get(k)}`));
    return this.http.get(`${this.apiLocalUrl}/auth/logout`, { headers });
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.apiLocalUrl}/usuarios`, data);
  }

  sendPasswordReset(data: RecoverRequest): Observable<any> {
    return this.http.post<any>(`${this.apiLocalUrl}/auth/recoverPassword`,data);
  }
  sendPasswordUpdate(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiLocalUrl}/auth/updatePassword`,data);
  }

  


  logoutAndRedirect() {
    this.logout().subscribe({
      next: () => {
        //console.log('Logout exitoso');
        this.clearToken();
        this.router.navigate(['/iniciar-sesion']);
      },
      error: (err) => {
        this.clearToken();
        this.router.navigate(['/iniciar-sesion']);
        if (err?.status !== 401) {
          console.error('Error en logout:', err);
          toast.error('Error en logout. Por favor, inicie sesión de nuevo.');
        }
      }
    });
  }


    goNavigate(ruta: string) {
    const numero = localStorage.getItem('servicio_activo');

    if (!numero){
      toast.error('Seleeciona un servicio primero');
      this.router.navigate(['/servicios']);
      return;
    }

    this.router.navigate([ruta, numero]);
    this.linkClick.emit();
  }


  clearToken() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');

    localStorage.removeItem('servicio_activo');
    sessionStorage.removeItem('servicio_activo');
    //borrar tambien al usuario
     // localStorage.removeItem('savedUsuario');
  }
}



