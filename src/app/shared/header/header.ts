import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { NavComponent } from '../nav/nav';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { firstValueFrom, Subscription } from 'rxjs';
import { ClientService } from '../../services/user/clientService';
import { UserService } from '../../services/user/user-service';
import { ObservableService } from '../../services/utility/observable.service';
import { CalculoService } from '../../services/utility/calculo.service';

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
export class Header implements OnInit {
  notifications: Noti[] = [];
  showNavButtons: boolean= true;
  isNotifOpen!: boolean;
  private ultimoNumeroCliente: string | null = null;
  private cargandoNotificaciones!: boolean;

  constructor(private clientS: ClientService, private user: UserService,
    private ObservableService: ObservableService, private calculo: CalculoService,
  ) {}

  ngOnInit(): void {
    this.verificarRuta(window.location.pathname);
    this.ObservableService.notificacion$.subscribe(notify => this.notifications = notify);
  }

  private verificarRuta(url: string): void {
    const urlLimpia = url.split('?')[0];
    this.showNavButtons = urlLimpia !== '/servicios';
  }

  protected toggleNotificaciones(): void {
    this.isNotifOpen = !this.isNotifOpen;
    if (this.isNotifOpen) {
      void this.loadNotificationData();
    }
  }

  private async loadNotificationData(): Promise<void> {
    const clienteActivo = this.user.obtenerServicioActivo();
    if (!clienteActivo) {
      this.notifications = [];
      this.ultimoNumeroCliente = null;
      return;
    }
    if (clienteActivo === this.ultimoNumeroCliente || this.cargandoNotificaciones) return;
    try {
      this.cargandoNotificaciones = true;
      const { cliente } = await firstValueFrom(this.clientS.getClientePorNumero(clienteActivo));
      this.notifications = this.calculo.construirNotificaciones(cliente);
      this.ultimoNumeroCliente = clienteActivo;
    } catch {
    } finally {
      this.cargandoNotificaciones = false;
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
}
