import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { toast } from 'ngx-sonner';
import { LoginS } from '../services/auth/login';

export const emailVerificadoGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const loginS = inject(LoginS);

  // Segunda visita: ya viene marcado, dejamos pasar sin llamar al backend
  if (route.queryParams['yaVerificado'] === 'true') {
    return true;
  }

  const token = route.queryParams['token'];

  if (!token) {
    router.navigate(['/iniciar-sesion']);
    setTimeout(() => toast.warning('Acceso denegado'), 0);
    return false;
  }

  return loginS.verifyMail({ token })
    .pipe(
      map(response => {
        if (response.valid) {
          return true;
        }
        // Token ya consumido → misma pantalla con estado "ya verificado"
        router.navigate(['/email-verificado'], {
          queryParams: { yaVerificado: 'true' }
        });
        return false;
      }),
      catchError(() => {
        router.navigate(['/email-verificado'], {
          queryParams: { yaVerificado: 'true' }
        });
        return of(false);
      })
    );
};
