import { HttpClient } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { LoginS } from '../services/auth/login';
import { inject } from '@angular/core';
import { toast } from 'ngx-sonner';
import { catchError, map, of } from 'rxjs';

export const recoverEmailGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const loginS = inject(LoginS);

  const token = route.queryParamMap.get('token');

  //si no hay token redirige a vista de inicio de sesion
  if (!token) {
    setTimeout(() => toast.warning('Acceso denegado'), 0);
    router.navigate(['/recuperar-password']);
    return false;
  }

  return loginS.veryfyMailRecoverPassword({ token }).pipe(
    map((response: any) => {

      if (response.status) {
        return true;
      }

      setTimeout(() => toast.warning(response.message), 0);
      router.navigate(['/recuperar-password']);
      return false;

    }),
    catchError(() => {
      setTimeout(() => toast.warning('Acceso denegado'), 0);
      router.navigate(['/recuperar-password']);
      return of(false);
    })

  );
};
