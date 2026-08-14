import { Injectable } from '@angular/core';
import { ClientService } from './clientService';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { toast } from 'ngx-sonner';

@Injectable({
  providedIn: 'root'
})

export class UserService {

  private readonly maxIntentos = 3;
  private readonly penalizacion = [30, 60, /*2 * 60 * 60*/ 90];

  constructor(private clientS: ClientService) { }

  enviarCorreo(id: string): boolean {
    this.resetDiario(id);

    const intentos = this.getIntentos(id);
    const unlock = Number(localStorage.getItem(`${id}_unlock`) || 0);

    return intentos < this.maxIntentos && Date.now() >= unlock;
  }

  registrarIntentos(id: string): number {
    this.resetDiario(id);

    const intentos = this.getIntentos(id) + 1;
    const seconds = this.penalizacion[intentos - 1] ?? 0;

    localStorage.setItem(`${id}_attempts`, intentos.toString());
    localStorage.setItem(`${id}_unlock`, (Date.now() + seconds * 1000).toString());

    return seconds;
  }

  getFaltante(id: string): number {
    const unlock = Number(localStorage.getItem(`${id}_unlock`) || 0);
    return Math.max(0, Math.ceil((unlock - Date.now()) / 1000));
  }

  getIntentos(id: string): number {
    return Number(localStorage.getItem(`${id}_attempts`) || 0);
  }

  reset(id: string): void {
    localStorage.removeItem(`${id}_attempts`);
    localStorage.removeItem(`${id}_unlock`);
    localStorage.removeItem(`${id}_date`);
  }

  private resetDiario(id: string): void {
    const hoy = new Date().toLocaleDateString();
    const date = localStorage.getItem(`${id}_date`);

    if (date !== hoy) {
      this.reset(id);
      localStorage.setItem(`${id}_date`, hoy);
    }
  }

  obtenerUsuarioAutenticado(route: ActivatedRoute): Observable<string | null> {
    return route.paramMap.pipe(
      switchMap(params => {
        const numero = params.get('numero_cliente');

        if (numero) {
          return of(numero);
        }

        return this.clientS.getAuthenticatedUser().pipe(
          switchMap(user => {
            const cliente = user?.cliente;

            if (!cliente) {
              toast.error('No se encontró información del cliente');
              return of(null);
            }

            return of(cliente);
          })
        );
      })
    );
  }

  obtenerServicioActivo(): string | null {
    return (
      localStorage.getItem('servicio_activo')
    );
  }

  eliminarServicioActivo(): void {
    localStorage.removeItem('servicio_activo');
  }
}
