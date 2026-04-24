import { Component, signal, HostListener, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Footer } from './shared/footer/footer';
import { Header } from './shared/header/header';
import { ReactiveFormsModule } from '@angular/forms';
import { NavComponent } from './shared/nav/nav';
import { filter } from 'rxjs/operators';
import { NgIf, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf, NgClass, NavComponent, Footer, Header, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnDestroy {
  protected readonly title = signal('Marcos');

  showSidebar = true;
  showheader   = true;
  showFooter   = true;

  /** Controla si el bottom nav está oculto */
  bottomNavOculto = false;

  private posicionScrollAnterior = 0;
  private readonly UMBRAL_SCROLL  = 8;  // px mínimos para reaccionar
  private rutaSub!: Subscription;

  rutasSinNav = [
    '/iniciar-sesion',
    '/crear-cuenta',
    '/recuperar-password',
    '/response-password',
    '/edit-perfil',
    '/edit-password',
    '/email-verificado',
    '/servicios',
    '/formulario',
    '/404',
    '/'
  ];

  rutasSinFooter = [
    '/dashboard',
    '/notificaciones',
    '/perfil',
    '/formas-de-pago',
    '/estadoCuenta',
    '/edit-perfil',
    '/visitas',
    '/faq'
  ];

  constructor(private router: Router) {
    this.actualizarVistas(window.location.pathname);

    this.rutaSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects ?? event.url;
        this.actualizarVistas(url);
        // Mostrar el nav al cambiar de ruta
        this.bottomNavOculto = false;
        this.posicionScrollAnterior = 0;
      });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.showSidebar) return;

    const posicionActual = window.scrollY;
    const diferencia     = posicionActual - this.posicionScrollAnterior;

    if (Math.abs(diferencia) < this.UMBRAL_SCROLL) return;

    this.bottomNavOculto        = diferencia > 0;
    this.posicionScrollAnterior = posicionActual;
  }

  ngOnDestroy(): void {
    this.rutaSub?.unsubscribe();
  }

  private actualizarVistas(url: string): void {
    if (!url) return;
    const urlLimpia  = url.split('?')[0];
    this.showSidebar = !this.rutasSinNav.includes(urlLimpia);
    this.showheader  = !this.rutasSinNav.includes(urlLimpia);
    this.showFooter  = !this.rutasSinFooter.some(r => urlLimpia.startsWith(r));
  }
}
