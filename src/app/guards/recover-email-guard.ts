import { HttpClient } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { LoginS } from '../services/auth/login';
import { inject } from '@angular/core';
import { toast } from 'ngx-sonner';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const recoverEmailGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const loginS = inject(LoginS);

  const token = route.queryParamMap.get('token');

  //si no hay token redirige a vista de inicio de sesion
  if (!token) {
    setTimeout(() => toast.warning('Acceso denegado'), 0);
    router.navigate(['/recuperar-password']);
    return false;
  }

  try {
    const response: any = await firstValueFrom(loginS.veryfyMailRecoverPassword({ token }));
    if (response.status) {
      return true;
    }
    setTimeout(() => toast.warning(response.message), 0);
    router.navigate(['/recuperar-password']);
    return false;
  } catch (e) {
    setTimeout(() => toast.warning('Acceso denegado'), 0);
    router.navigate(['/recuperar-password']);
    return false;
  }
};
