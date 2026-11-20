import { Component, HostListener, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginS } from '../../services/auth/login';
import { toast } from 'ngx-sonner';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../../services/utility/http.service';
import { PushNotifications } from '@capacitor/push-notifications';
import { ClientService } from '../../services/user/clientService';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class Login implements OnInit {
  loginForm: FormGroup;
  loading!: boolean;
  showPassword!: boolean;
  isFlipping!: boolean;
  messaggeSuccess!: boolean;

  //app movil
  mostrarModalApp: boolean = false;
  urlAppMovil: string = '';
  private readonly APP_MODAL_KEY = 'emenet_app_modal_dismissed';
  private readonly PACKAGE_ID = 'com.miemenet.app';
  private readonly ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.miemenet.app';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private api: LoginS,
    protected http: HttpService,
    private clientS: ClientService
  ) {
    this.loginForm = this.fb.group({
      cliente: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    })

    const stateNav = this.router.getCurrentNavigation();
    if (stateNav?.extras.state) {
      const state = stateNav.extras.state;
      this.messaggeSuccess = state ? true : false;
      window.history.replaceState({}, document.title);
    }
  }
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.mostrarModalApp) {
      this.cerrarModalApp();
    } else if (this.mostrarAyuda) {
      this.cerrarAyuda();
    }
  }

  ngOnInit() {
    if (this.messaggeSuccess) toast.success('Cuenta creada. Revisa tu correo para validar tu cuenta');
    const sesion = this.api.getToken();
    const servicio = localStorage.getItem('servicio_activo');
    this.router.navigate(sesion && servicio ? ['/dashboard', servicio] : ['/servicios']);
    this.inicializarModalApp();
  }

  protected async login(): Promise<void> {
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      toast.error("Completa los campos requeridos.");
      return;
    }

    try {
      this.loading = true;
      const { token, numero_cliente } = await firstValueFrom(this.api.login(this.loginForm.value));
      if (token) localStorage.setItem('authToken', token);

      const fcm_token = localStorage.getItem('fcm_token');

      if (token && fcm_token) {
        try {
          await firstValueFrom(this.clientS.enviarTokenNoti(fcm_token, 'android'));
        } catch (error) {
          this.http.errorHttp(error as HttpErrorResponse, 'Error al sincronizar token');
        }
      }

      toast.success('Sesión iniciada correctamente');
      this.router.navigate(['/dashboard', numero_cliente]);
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al iniciar sesión');
    } finally {
      this.loading = false;
    }
  }

  get usuario() {
    return this.loginForm.controls['cliente'];
  }
  get password() {
    return this.loginForm.controls['password'];
  }

  mostrarAyuda = false;
  tutorialAbierto = false;


  abrirTutorial(): void {
    this.tutorialAbierto = true;
  }

  cerrarTutorial(): void {
    this.tutorialAbierto = false;
  }

  cerrarAyuda(): void {
    this.mostrarAyuda = false;
    this.tutorialAbierto = false;
  }

  verTutorialCompleto(): void {
    const elemento = document.querySelector(
      '.tutorial-view__video'
    ) as HTMLElement | null;

    if (!elemento) return;

    if (!document.fullscreenElement) {
      elemento.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }


  inicializarModalApp(): void {
    if (typeof window === 'undefined') return;

    if (Capacitor.isNativePlatform()) {
      return;
    }

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const esAndroid = /android/i.test(userAgent);
    //const esIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    //const esMovil = esAndroid || esIOS || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    const yaCerrado = sessionStorage.getItem(this.APP_MODAL_KEY);

    if (esAndroid && !yaCerrado) {
      setTimeout(() => {
        this.mostrarModalApp = true;
      }, 600);
    }
  }

  cerrarModalApp(): void {
    this.mostrarModalApp = false;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.APP_MODAL_KEY, 'true');
    }
  }

  cerrarModalAppPorFondo(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('overlayModalApp')) {
      this.cerrarModalApp();
    }
  }

  abrirODescargarApp(): void {
    if (typeof window === 'undefined') return;

    const fallbackUrl = encodeURIComponent(this.ANDROID_APP_URL);
    const intentUrl = `intent://abrir#Intent;scheme=miemenet;package=${this.PACKAGE_ID};S.browser_fallback_url=${fallbackUrl};end`;

    window.location.href = intentUrl;

  }

}
