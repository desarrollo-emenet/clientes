import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { toast } from 'ngx-sonner';
//import { environment } from '../services/user/routeApi';
import { environment } from '../../environments/environment';

export const emailVerificadoGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const http = inject(HttpClient);
  const apiLocalUrl = environment.apiLocalUrl;

  const token = route.queryParams['token'];

  //si no hay token redirige a vista de inicio de sesion
  if (!token) {
    router.navigate(['/iniciar-sesion']);
    setTimeout(() => toast.warning('Acceso denegado'), 0);
    return false;
  }

  // Validar el token (`${apiLocalUrl}/api/verify-token`
  
  return http.post<{ valid: boolean }>(`${apiLocalUrl}/verify-token`, { token })
    .pipe(
      map(response => {
        if (response.valid) {
          return true;
        } else {
          setTimeout(() => toast.warning('Acceso denegado'), 0);
          router.navigate(['/']);
          return false;
        }
      }),
      catchError(() => {
        setTimeout(() => toast.warning('Acceso denegado'), 0);
        router.navigate(['/']);
        return of(false);
      })
    );
};
