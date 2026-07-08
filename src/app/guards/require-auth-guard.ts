import { CanActivateFn, CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';

export const requireAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  if (hasToken()) return true;
  //alert("No puede acceder");
  setTimeout(() => toast.error('No tienes acceso'), 0);
  router.navigate(['/iniciar-sesion']);
  return false;
};

export function hasToken(): boolean {
  return !!localStorage.getItem('authToken');
}