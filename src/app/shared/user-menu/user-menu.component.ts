import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginS } from '../../services/auth/login';
import { UserService } from '../../services/user/user-service';
import { ObservableService } from '../../services/utility/observable.service';
import { HttpService } from '../../services/utility/http.service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { toast } from 'ngx-sonner';
import { ClientService } from '../../services/user/clientService';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-user-menu',
  imports: [CommonModule, RouterLink, AvatarModule,],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css'
})
export class UserMenuComponent implements OnInit {
  isDropdownOpen: boolean = false;
  avatarUrl!: string;
  isServiceRoute!: boolean;
  cliente: any = { nombre: '', cliente: '', avatarUrl: '' };
  user: any;

  avatarOptions: string[] = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
  ];

  constructor(
    private router: Router,
    private loginS: LoginS,
    private clientS: ClientService,
    private userServ: UserService,
    private ObservableService: ObservableService,
    protected http: HttpService
  ) { }


  async ngOnInit(): Promise<void> {
    this.checkCurrentRoute();
    this.ObservableService.cliente$.subscribe(info => {
      if (!info) { return }
      this.cliente = { ...info, avatarUrl: info.avatarUrl ?? this.avatarOptions[0] };
    })
    this.user = await firstValueFrom(this.clientS.getAuthenticatedUser());
    if (this.user?.avatar_url) {
      this.ObservableService.actualizarAvatar(this.user.avatar_url);
    }
  }

  checkCurrentRoute(): void {
    this.isServiceRoute = this.router.url === '/servicios';
  }

  navigateTo(route: string): void {
    this.isDropdownOpen = false;
    if ((route === '/visitas' || route === '/formas-de-pago' || route === '/formulario-pagos') && this.cliente.cliente) {
      this.router.navigate([route, this.cliente.cliente]);
    } else if (route === '/servicios') {
      this.router.navigate([route]);
      this.userServ.eliminarServicioActivo();
    } else {
      this.router.navigate([route]);
    }
  }

  protected async changeAvatar(url: string, event: Event) {

    event.stopPropagation();
    try {
      await firstValueFrom(this.clientS.updateAvatar({ avatar_url: url }));
      this.ObservableService.actualizarAvatar(url);
      //toast.success('Avatar actualizado correctamente');
    } catch (e) {
      const error = e as HttpErrorResponse;
      this.http.errorHttp(error, 'Error al actualizar el avatar');
    }
  }

  protected async handleLogout(): Promise<void> {
    this.isDropdownOpen = false;
    const fcmToken = localStorage.getItem('fcm_token');

    if (fcmToken) {
      try {
        await firstValueFrom(this.clientS.eliminarTokenNoti(fcmToken));
      } catch (error) {
        console.error('No se pudo desvincular el token FCM:', error);
      }
    }

    try {
      await firstValueFrom(this.loginS.logout());
      this.loginS.clearToken();
      this.router.navigate(['/iniciar-sesion']);
    } catch (e) {
      const error = e as HttpErrorResponse;
      this.loginS.clearToken();
      this.router.navigate(['/iniciar-sesion']);
      if (error?.status !== 401) {
        toast.error('Error en logout. Por favor, inicie sesión de nuevo.');
      }
    }
  }



  @HostListener('document:click', ['$event'])
  closeDropdownOnClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const containerElement = document.querySelector('.user-menu-container');
    if (containerElement && !containerElement.contains(target)) {
      this.isDropdownOpen = false;
    }
  }

  @HostListener('window:scroll', ['$event'])
  closeDropdownOnScroll(_event: Event): void {
    if (this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  @HostListener('window:wheel', ['$event'])
  closeDropdownOnWheel(_event: WheelEvent): void {
    if (this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  @HostListener('window:touchmove', ['$event'])
  closeDropdownOnTouchMove(_event: TouchEvent): void {
    if (this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  @HostListener('document:touchstart', ['$event'])
  closeDropdownOnTouchStartOutside(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    const containerElement = document.querySelector('.user-menu-container');
    if (containerElement && !containerElement.contains(target)) {
      this.isDropdownOpen = false;
    }
  }
}

