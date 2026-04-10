import { Component, EventEmitter, Output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LoginS } from '../../services/auth/login';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './nav.html',
  styleUrl: './nav.css'
})
export class NavComponent {
  servicios: any[] = [];
  clienteNumero: string = '';
  constructor(private auth: LoginS, private router: Router) {
    this.clienteNumero = localStorage.getItem('servicio_activo') || '';
  }

  @Output() linkClick = new EventEmitter<void>();


  logout() {
    this.auth.logoutAndRedirect();
  }

  goDashboard(){
    this.auth.goNavigate('/dashboard')
  }

  goNotification(){
    this.auth.goNavigate('/notificaciones')
  }
 
  goEstadoCuenta(){
    this.auth.goNavigate('/estadoCuenta')
  }
 
  goPerfil(){
    this.auth.goNavigate('/perfil')
  }

}
 