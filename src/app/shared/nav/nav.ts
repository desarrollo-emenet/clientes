import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LoginS } from '../../services/auth/login';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.html',
  styleUrl: './nav.css'
})
export class NavComponent {
  constructor(private auth: LoginS, private router: Router) {}


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
 