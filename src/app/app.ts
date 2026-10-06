import { Component, signal, HostListener, OnDestroy, NgZone } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Header } from './shared/header/header';
import { NotificationService } from './services/utility/notification.service';
import { ReactiveFormsModule } from '@angular/forms';
import { NavComponent } from './shared/nav/nav';
import { filter } from 'rxjs/operators';
import { NgIf, NgClass, AsyncPipe  } from '@angular/common';
import { Subscription } from 'rxjs';
import { App as CapacitorApp, } from '@capacitor/app';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications'
import { Platform } from '@angular/cdk/platform';
import { PluginListenerHandle } from '@capacitor/core';
import { LoginS } from './services/auth/login';
import { NgxSonnerToaster } from 'ngx-sonner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf, NgClass, NavComponent, Header, ReactiveFormsModule, AsyncPipe, NgxSonnerToaster ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnDestroy {
  //protected readonly title = signal('Marcos');

  

  private backButtonListener?: PluginListenerHandle;
  
  bannerVisible$;
  notification$;

  showSidebar = true;
  showheader = true;
  showFooter = true;

  /** Controla si el bottom nav está oculto */
  bottomNavOculto = false;

  private posicionScrollAnterior = 0;
  private readonly UMBRAL_SCROLL = 8;  // px mínimos para reaccionar
  private rutaSub!: Subscription;

  rutasSinNav = [
    '/iniciar-sesion',
    '/crear-cuenta',
    '/recuperar-password',
    '/response-password',
    '/email-verificado',
    '/servicios',
    '/formulario',
    '/ver-ticket',
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
    '/faq',
    '/formulario-pagos',
    '/adicionales',
    "/iniciar-sesion",
    "/crear-cuenta",
    "/recuperar-password"

  ];

  constructor(private router: Router, private platform: Platform, private ngZone: NgZone, private auth: LoginS, private bannerService: NotificationService) {

    this.bannerVisible$ = this.bannerService.bannerVisible$;
    this.notification$ = this.bannerService.currentNotification$;

    if (this.platform.ANDROID) { this.initPush(); }

    this.actualizarVistas(window.location.pathname);

    this.rutaSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects ?? event.url;
        this.actualizarVistas(url);
        this.bottomNavOculto = false;
        this.posicionScrollAnterior = 0;
      });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.showSidebar) return;

    const posicionActual = window.scrollY;
    const diferencia = posicionActual - this.posicionScrollAnterior;

    if (Math.abs(diferencia) < this.UMBRAL_SCROLL) return;

    this.bottomNavOculto = diferencia > 0;
    this.posicionScrollAnterior = posicionActual;
  }

  ngOnDestroy(): void {
    this.rutaSub?.unsubscribe();
    this.backButtonListener?.remove();
  }

  async ngOnInit(): Promise<void> {
    if (!this.platform.ANDROID) return;
    this.backButtonListener = await CapacitorApp.addListener('backButton',
      ({ canGoBack }) => {
        if (canGoBack) { window.history.back(); return; }
        CapacitorApp.exitApp();
      }
    );
  }

  private actualizarVistas(url: string): void {
    if (!url) return;
    const urlLimpia = url.split('?')[0];
    this.showSidebar = !this.rutasSinNav.includes(urlLimpia);
    this.showheader = !this.rutasSinNav.includes(urlLimpia);
    this.showFooter = !this.rutasSinFooter.some(r => urlLimpia.startsWith(r));
  }

  initPush(): void {
    //console.log('Iniciando Push Notifications...');

    PushNotifications.requestPermissions().then((result) => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      } else {
        console.error('Permiso de notificaciones denegado');
      }
    });

    PushNotifications.addListener('registration', (token: Token) => {
      console.log('token enviado al servidor: ' + token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error: ' + error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received: ' + JSON.stringify(notification));

      this.ngZone.run(() => {
        this.bannerService.mostrar(notification.title || '', notification.body || '', notification.data);
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed: ' + JSON.stringify(action));
      this.procesarRedireccion(action.notification.data);
    });

    
  }


   clickBanner() {
    this.notification$.subscribe(notif => {
      if (notif && notif.data) {
        this.procesarRedireccion(notif.data);
      }
    }).unsubscribe(); // Nos desuscribimos de inmediato para evitar bucles
    this.bannerService.ocultar();
  }

  cerrarBanner(event: Event) {
    event.stopPropagation(); // Evita que se dispare el click del banner completo
    this.bannerService.ocultar();
  }

  procesarRedireccion(data: any) {
    if (data && data.tipo) {
      this.ngZone.run(() => {
        switch (data.tipo) {
          case 'pago':
            this.router.navigate(['/formas-de-pago']);
            break;
          case 'estado_cuenta':
            this.router.navigate(['/estado-cuenta']);
            break;
          default:
            this.router.navigate(['/inicio']);
            break;
        }
      });
    }
  }


}

