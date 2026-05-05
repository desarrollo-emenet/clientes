import { Injectable } from '@angular/core';
import { ClientService } from './clientService';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { toast } from 'ngx-sonner';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private clientS: ClientService) { }

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
}
