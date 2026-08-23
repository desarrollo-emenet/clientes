import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { toast } from 'ngx-sonner';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor(private router: Router) {}

  public errorHttp(e: HttpErrorResponse, mensajeAlt: string): void {
    toast.dismiss();
    toast.error(e.error?.message || mensajeAlt);
    if (e.status === 500) console.error('Error al procesar la solicitud:', e.error.error);
  }

  public goToUrl(url: string): boolean {
    setTimeout(() => this.router.navigateByUrl(url), 550);
    return true;
  }

  public obtenerIniciales(nombre: string): string {
    if (!nombre) return '—';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) {
      return partes[0].substring(0, 2).toUpperCase();
    }
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }
}
