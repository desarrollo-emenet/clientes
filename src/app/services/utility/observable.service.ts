import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ObservableService {

  /*private clienteSubject = new BehaviorSubject<{ [key: string]: string[] }>({});

  cliente$ = this.clienteSubject.asObservable();
  
  actualizarObs(informacion: { [key: string]: string[] }, notify: any, servicios: any) {
    this.clienteSubject.next(informacion);
    this.nitificationSubject.next(notify);
    this.serviciosSubject.next(servicios);
  }

  private nitificationSubject = new BehaviorSubject<any>({});
  notificacion$ = this.nitificationSubject.asObservable();

  private serviciosSubject = new BehaviorSubject<any>({});
  servicios$ = this.serviciosSubject.asObservable();

  actualizarAvatar(nuevoAvatar: any) {
    this.clienteSubject.next(nuevoAvatar);
  }*/

  private clienteSubject = new BehaviorSubject<any>(null);
  cliente$ = this.clienteSubject.asObservable();

  private nitificationSubject = new BehaviorSubject<any>({});
  notificacion$ = this.nitificationSubject.asObservable();

  private serviciosSubject = new BehaviorSubject<any>({});
  servicios$ = this.serviciosSubject.asObservable();


  actualizarObs(informacion: any, notify: any, servicios: any ): void {
    this.clienteSubject.next({ ...informacion, avatarUrl: informacion?.avatarUrl || null });

    this.nitificationSubject.next(notify);
    this.serviciosSubject.next(servicios);
  }

   actualizarAvatar(nuevoAvatar: string): void {

    const clienteActual = this.clienteSubject.value;
    if (!clienteActual) { return; }
    this.clienteSubject.next({ ...clienteActual, avatarUrl: nuevoAvatar });
  }
}
