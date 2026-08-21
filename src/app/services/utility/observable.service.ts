import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ObservableService {
  private clienteSubject = new BehaviorSubject<{ [key: string]: string[] }>({});
  cliente$ = this.clienteSubject.asObservable();
  actualizarCliente(informacion: { [key: string]: string[] }) {
    this.clienteSubject.next(informacion);
  }

  private nitificationSubject = new BehaviorSubject<any>({});
  notificacion$ = this.nitificationSubject.asObservable();
  actualizarNotificacion(notify: any) {
    this.nitificationSubject.next(notify);
  }
}
