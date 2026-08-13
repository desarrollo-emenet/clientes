import { Component, HostListener, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginS } from '../../services/auth/login';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../../services/utility/http.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink, NgxSonnerToaster],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class Login implements OnInit {
  mostrarAyuda!: boolean;
  loginForm: FormGroup;
  loading!: boolean;
  showPassword!: boolean;
  isFlipping!: boolean;
  messaggeSuccess!: boolean;

  constructor(private fb: FormBuilder, private router: Router, private api: LoginS,
    protected http: HttpService) {
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

  ngOnInit() {
    if(this.messaggeSuccess) toast.success('Cuenta creada. Revisa tu correo para validar tu cuenta');
    const sesion = this.api.getToken();
    const servicio = localStorage.getItem('servicio_activo');
    this.router.navigate(sesion && servicio ? ['/dashboard', servicio] : ['/servicios']);    
  }

  protected async login(): Promise<void> {
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      toast.error("Completa los campos requeridos.");
      return;
    }

    try{
      this.loading = true;
      const { token, numero_cliente } = await firstValueFrom(this.api.login(this.loginForm.value));
      if (token) sessionStorage.setItem('authToken', token);
      toast.success('Sesión iniciada correctamente');
      this.router.navigate(['/dashboard', numero_cliente]);
    }catch(error){
      this.http.errorHttp(error as HttpErrorResponse, 'Error al iniciar sesión');
    }finally{
      this.loading = false;
    }
  }

  get usuario() {
    return this.loginForm.controls['cliente'];
  }
  get password() {
    return this.loginForm.controls['password'];
  }
}
