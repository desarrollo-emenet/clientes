import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ObservableService {
  private clienteSubject = new BehaviorSubject<{ [key: string]: string[] }>({});
  cliente$ = this.clienteSubject.asObservable();
  actualizarObs(informacion: { [key: string]: string[] }, notify: any) {
    this.clienteSubject.next(informacion);
    this.nitificationSubject.next(notify);
  }

  private nitificationSubject = new BehaviorSubject<any>({});
  notificacion$ = this.nitificationSubject.asObservable();
  // actualizarNotificacion(notify: any) {
  //   this.nitificationSubject.next(notify);
  // }
}
