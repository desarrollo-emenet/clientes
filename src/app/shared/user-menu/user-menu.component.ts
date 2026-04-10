import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { LoginS } from '../../services/auth/login';
import { ClientService } from '../../services/user/clientService';

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

  constructor(
    private router: Router,
    private loginS: LoginS,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.loadUser();
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.closeDropdownOnClickOutside);
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
            nombre: res.cliente?.cliente?.nombre || 'Usuario',
            numeroCliente: res.numero_cliente || clienteNumero,
            email: res.cliente?.cliente?.email || 'Sin email',
            roles: res.cliente?.cliente?.roles || []
          };
          this.avatarUrl = '';
        },
        error: (err) => {
          console.error('Error loading client details:', err);
          this.user = {
            nombre: 'Usuario',
            numeroCliente: clienteNumero,
            email: 'Sin email'
          };
          this.avatarUrl = '';
        }
      });
    } else {
      // Fallback if no servicio_activo
      this.user = {
        nombre: 'Usuario',
        numeroCliente: '',
        email: 'Sin email'
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
    this.router.navigate([route]);
  }

  handleLogout(): void {
    this.isDropdownOpen = false;
    this.loginS.logoutAndRedirect();
  }

  getInitials(): string {
    if (this.user?.name) {
      return this.user.name.charAt(0).toUpperCase();
    }
    if (this.user?.username) {
      return this.user.username.charAt(0).toUpperCase();
    }
    return 'U';
  }

  isAdmin(): boolean {
    return this.user?.roles?.includes('admin');
  }
}
