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
    toast.error(e.error?.message || mensajeAlt);
    if (e.status === 500) console.error('Error al procesar la solicitud:', e.error.error);
  }

  public goToUrl(url: string): boolean {
    setTimeout(() => this.router.navigateByUrl(url), 550);
    return true;
  }
}
