import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ObservableService {

  private clienteSubject = new BehaviorSubject<any>(null);
  cliente$ = this.clienteSubject.asObservable();

  private nitificationSubject = new BehaviorSubject<any>({});
  notificacion$ = this.nitificationSubject.asObservable();

  private serviciosSubject = new BehaviorSubject<any>({});
  servicios$ = this.serviciosSubject.asObservable();


  actualizarObs(informacion: any, notify: any, servicios: any): void {
    const clienteActual = this.clienteSubject.value ?? {};

    this.clienteSubject.next({
      ...clienteActual, ...informacion,
      avatarUrl: informacion?.avatarUrl ?? clienteActual.avatarUrl ?? null
    });

    this.nitificationSubject.next(notify);
    this.serviciosSubject.next(servicios);
  }

  actualizarAvatar(nuevoAvatar: string): void {
    const clienteActual = this.clienteSubject.value ?? {};
    this.clienteSubject.next({ ...clienteActual, avatarUrl: nuevoAvatar });
  }
}
