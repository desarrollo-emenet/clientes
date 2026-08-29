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

@Component({
  selector: 'app-user-menu',
  imports: [CommonModule, RouterLink],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css'
})
export class UserMenuComponent implements OnInit {
  isDropdownOpen!: boolean;
  avatarUrl!: string;
  isServiceRoute!: boolean;

  constructor(
    private router: Router,
    private loginS: LoginS,
    private clientS: ClientService,
    private userServ: UserService,
    private ObservableService: ObservableService,
    protected http: HttpService
  ) { }

  cliente: any;
  user:any;
  async ngOnInit(): Promise<void> {
    this.checkCurrentRoute();
    this.ObservableService.cliente$.subscribe(info => this.cliente = info)
    this.user = await firstValueFrom(this.clientS.getAuthenticatedUser());
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

  protected async handleLogout(): Promise<void> {
    this.isDropdownOpen = false;
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
    const dropdownElement = document.querySelector('.user-dropdown');
    const triggerElement = document.querySelector('.user-dropdown-trigger');

    if (dropdownElement && triggerElement) {
      if (!dropdownElement.contains(target) && !triggerElement.contains(target)) {
        this.isDropdownOpen = false;
      }
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
    if (!this.isDropdownOpen) {
      return;
    }
    const target = event.target as HTMLElement | null;
    const dropdownElement = document.querySelector('.user-dropdown');
    const triggerElement = document.querySelector('.user-dropdown-trigger');
    if (!target || !dropdownElement || !triggerElement) {
      this.isDropdownOpen = false;
      return;
    }
    if (!dropdownElement.contains(target) && !triggerElement.contains(target)) {
      this.isDropdownOpen = false;
    }
  }

}

