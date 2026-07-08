import { CanActivateFn, CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const onlyGuestsGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  if (!hasToken()) return true;  
  router.navigate(['/dashboard']);
  return false;
};

export function hasToken(): boolean {
  return !!localStorage.getItem('authToken');
}