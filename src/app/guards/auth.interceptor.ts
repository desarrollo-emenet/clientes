import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { toast } from 'ngx-sonner';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = sessionStorage.getItem('authToken');

  // Clonar la petición HTTP real para meterle el Token de Laravel
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
        const isLoginRequest = req.url.includes('/iniciar-sesion');
              const teniaToken = !!token;

      // Si Laravel responde 401, el token fue eliminado por el límite de 2 sesiones
      if (error.status === 401 && !isLoginRequest  && teniaToken) {
        sessionStorage.clear(); 
        setTimeout(() => toast.error('Tu sesión ha expirado o se inició en otro dispositivo'), 0);
        router.navigate(['/iniciar-sesion']);
      }
      return throwError(() => error);
    })
  );
};
