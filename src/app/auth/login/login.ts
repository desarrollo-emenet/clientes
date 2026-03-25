import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginS } from '../../services/auth/login';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink, NgxSonnerToaster],
  templateUrl: './login.html',
  styleUrl: './login.css'
})


export class Login {
  //uso de formularios reactivos
  loginForm!: FormGroup;
  error: string | null = null;
  loading = false;
  showPassword = false;
  isFlipping = false;

  constructor(private fb: FormBuilder, private router: Router, private api: LoginS) {
    this.loginForm = this.fb.group({
      usuario:['', [Validators.required, Validators.maxLength(6)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    })
  }

  get usuario() {
    return this.loginForm.controls['usuario'];
  }

  get password() {
    return this.loginForm.controls['password'];
  }



  login() {
    //console.log('loginForm.value', this.loginForm.value);

      if (this.usuario.invalid || this.password.invalid) {
    this.loginForm.markAllAsTouched();
    toast.error("Completar los camposo requeridos");
    return;
  }

    this.loading = true;
    const { usuario, password } = this.loginForm.value;


    const payload = { cliente: usuario, password };

    this.api.login(payload as any).subscribe({
      next: (res) => {
        this.loading = false;
        const token = res?.token;
        if (token) {
          localStorage.setItem('authToken', token);
        }

        sessionStorage.setItem('authToken', res.token); 

        //navegamos al dashboard
        toast.success('Sesión iniciada correctamente');
        this.router.navigateByUrl('/servicios');
      },
      error: (e) => {
        this.loading = false;

        if (e?.status === 0) {
          toast.error('No se pudo conectar al servidor');
        } else if (e?.status === 401) {
          toast.error('Credenciales inválidas');
        } else if (e?.status === 404) {
          toast.error('Usuario no encontrado');
        }  else if (e?.status === 403) {
          toast.error('Correo no verificado');
        } else {
          toast.error('Error al iniciar sesión');
        }
      }
    });
  }


  viewPassword() {
    this.showPassword = !this.showPassword;
  }

  goToUrl(url: string) {
    this.isFlipping = true;
    setTimeout(() => {
      this.router.navigateByUrl(url);
    }, 550); // Tiempo óptimo para evitar trabas en el DOM
  }
}
