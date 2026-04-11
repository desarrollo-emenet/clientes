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
    document.removeEventListener('click', this.closeDropdownOnClickOutside);
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
    if ((route === '/perfil' || route === '/notificaciones') && this.user?.numeroCliente) {
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
}
