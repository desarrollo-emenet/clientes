import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { NavComponent } from '../nav/nav';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { ClientService } from '../../services/user/clientService';
import { UserService } from '../../services/user/user-service';

interface Noti {
  title: string;
  text: string;
  time: string;
  unread: boolean;
}

@Component({
  selector: 'app-header',
  imports: [UserMenuComponent, NavComponent, NgIf, NgFor, NgClass],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy {

  showNavButtons = true;
  private rutaSub!: Subscription;

  isNotifOpen = false;
  notifications: Noti[] = [];

  constructor(private router: Router, private clientS: ClientService, private user: UserService) {}

  ngOnInit(): void {
    this.verificarRuta(window.location.pathname);
    void this.loadNotificationData();

    this.rutaSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.verificarRuta(event.urlAfterRedirects || event.url);
        void this.loadNotificationData();
      });
  }

  ngOnDestroy(): void {
    this.rutaSub?.unsubscribe();
  }

  private verificarRuta(url: string): void {
    const urlLimpia = url.split('?')[0];
    this.showNavButtons = urlLimpia !== '/servicios';
  }

  toggleNotificaciones(): void {
    this.isNotifOpen = !this.isNotifOpen;
    if (this.isNotifOpen) {
      void this.loadNotificationData();
    }
  }

  @HostListener('document:click', ['$event'])
  closeNotifOnClickOutside(event: MouseEvent): void {
    if (!this.isNotifOpen) return;
    const target = event.target as HTMLElement;
    const panel = document.querySelector('.notif-panel');
    const trigger = document.querySelector('.notif-btn');
    if (panel && trigger && !panel.contains(target) && !trigger.contains(target)) {
      this.isNotifOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  closeNotifOnEscape(): void {
    this.isNotifOpen = false;
  }

  @HostListener('window:scroll', [])
  closeNotifOnScroll(): void {
    if (this.isNotifOpen) {
      this.isNotifOpen = false;
    }
  }

  private async loadNotificationData(): Promise<void> {
    // Implementación para cargar datos de notificaciones
    this.notifications = [];

    //notificacion adeudo pendiente
    const numeroCliente = this.user.obtenerServicioActivo();
    if (!numeroCliente) return;

    try {
      const data: any = await this.clientS.getClientePorNumero(numeroCliente).toPromise();
      //console.log(data);
      if (!data) return;
      if (data.cliente?.cliente?.clasificacion === 'BAJA') return;

      const today = new Date();
      const day = today.getDate();
      //notificacion fechas de pago

      if (day >= 1 && day <= 5) {
        this.notifications.push({
          title: 'Recordatorio de pago',
          text: 'Recuerda que tus fecha de pago son del 1 al 5 de cada mes. Evita cortes en tu servicio realizando tu pago a tiempo.',
          time: 'Hoy',
          unread: true
        });
      }

       //notificacion adeudo pendiente
      if (Number(data.cliente?.cliente?.deuda) > 0) {
        this.notifications.push({
          title: 'Adeudo pendiente',
          text: `Tienes un adeudo pendiente de $${data.cliente?.cliente?.deuda}. Por favor realiza tu pago para evitar cortes en tu servicio.`,
          time: 'Hoy',
          unread: true
        });
      }
    } catch (error) {
      //console.error('Error al obtener datos del cliente para notificaciones', error);
    }
  }

  goNotificaciones(): void {
    this.isNotifOpen = false;
    const numeroCliente = this.user.obtenerServicioActivo();
    if (numeroCliente) {
      this.router.navigate(['/notificaciones', numeroCliente]);
      return;
    }

    this.router.navigate(['/notificaciones']);
  }
}
