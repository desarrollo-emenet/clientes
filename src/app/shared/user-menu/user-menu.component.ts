import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { LoginS } from '../../services/auth/login';
import { ClientService } from '../../services/user/clientService';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-user-menu',
  imports: [NgIf],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css'
})
export class UserMenuComponent implements OnInit, OnDestroy {
  isDropdownOpen = false;
  user: any = null;
  theme: 'light' | 'dark' = 'light';
  avatarUrl: string = '';
  isServiceRoute = false;

  constructor(
    private router: Router,
    private loginS: LoginS,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.loadUser();
    this.checkCurrentRoute();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkCurrentRoute();
    });
  }

  ngOnDestroy(): void {
    // HostListeners are automatically cleaned up by Angular
  }

  checkCurrentRoute(): void {
    this.isServiceRoute = this.router.url === '/servicios';
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

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  loadUser(): void {
    // Use servicio_activo from localStorage since /api/user endpoint doesn't exist
    const clienteNumero = localStorage.getItem('servicio_activo');
    
    if (clienteNumero) {
      this.clientService.getClientePorNumero(clienteNumero).subscribe({
        next: (res) => {
          this.user = {
            nombre: res.cliente?.cliente?.nombre || 'Cliente',
            numeroCliente: res.numero_cliente || clienteNumero,
            email: res.cliente?.cliente?.email || 'No. Cliente',
            roles: res.cliente?.cliente?.roles || []
          };
          this.avatarUrl = '';
        },
        error: (err) => {
          console.error('Error loading client details:', err);
          this.user = {
            nombre: 'Cliente',
            numeroCliente: clienteNumero,
            email: 'No. Cliente'
          };
          this.avatarUrl = '';
        }
      });
    } else {
      // Fallback if no servicio_activo
      this.user = {
        nombre: 'Cliente',
        numeroCliente: '',
        email: 'No. Cliente'
      };
      this.avatarUrl = '';
    }
  }

  loadTheme(): void {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    this.theme = savedTheme || 'light';
    this.applyTheme();
  }

  toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.theme);
    this.applyTheme();
    this.isDropdownOpen = false;
  }

  applyTheme(): void {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(this.theme);
  }

  navigateTo(route: string): void {
    this.isDropdownOpen = false;
    if ((route === '/perfil' || route === '/notificaciones' || route === '/formas-de-pago') && this.user?.numeroCliente) {
      this.router.navigate([route, this.user.numeroCliente]);
    } else {
      this.router.navigate([route]);
    }
  }

  handleLogout(): void {
    this.isDropdownOpen = false;
    this.loginS.logoutAndRedirect();
  }

  getInitials(): string {
    const fullName = this.user?.nombre || this.user?.name || this.user?.username || '';
    if (!fullName) {
      return 'U';
    }

    // Split by spaces and filter out empty strings
    const names = fullName.trim().split(/\s+/).filter((n: string) => n.length > 0);
    if (names.length === 0) {
      return 'U';
    }

    // Get first letter of first name
    let initials = names[0].charAt(0).toUpperCase();

    // If there are more names, add first letter of last name (last word)
    if (names.length > 1) {
      initials += names[names.length - 1].charAt(0).toUpperCase();
    }

    return initials;
  }

  isAdmin(): boolean {
    return this.user?.roles?.includes('admin');
  }

  getFirstName(): string {
    const fullName = this.user?.nombre || this.user?.name || this.user?.username || '';
    if (!fullName) return 'Cliente';
    const names = fullName.trim().split(/\s+/).filter((n: string) => n.length > 0);
    if (names.length === 0) return 'Cliente';
    if (names.length === 1) return names[0];
    // Return all names except the last one (apellido)
    return names.slice(0, -1).join(' ');
  }

  getLastName(): string {
    const fullName = this.user?.nombre || this.user?.name || this.user?.username || '';
    if (!fullName) return '';
    const names = fullName.trim().split(/\s+/).filter((n: string) => n.length > 0);
    if (names.length <= 1) return '';
    // Return only the last name
    return names[names.length - 1];
  }
}
