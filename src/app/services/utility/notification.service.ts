import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface BannerData {
  title: string;
  body: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private bannerVisible = new BehaviorSubject<boolean>(false);
  bannerVisible$ = this.bannerVisible.asObservable();

  // Almacena la información de la notificación actual
  private currentNotification = new BehaviorSubject<BannerData | null>(null);
  currentNotification$ = this.currentNotification.asObservable();

  mostrar(title: string, body: string, data: any) {
    this.currentNotification.next({ title, body, data });
    this.bannerVisible.next(true);

    setTimeout(() => {
      this.ocultar();
    }, 6000);
  }

  ocultar() {
    this.bannerVisible.next(false);
  }
}

