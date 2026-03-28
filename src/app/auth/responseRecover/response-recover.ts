import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';
import { LoginS } from '../../services/auth/login';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-response-recover',
  imports: [ReactiveFormsModule, NgIf, NgClass, NgxSonnerToaster],
  templateUrl: './response-recover.html',
  styleUrl: './response-recover.css'
})
export class ResponseRecover implements OnInit, OnDestroy {
  recoverForm!: FormGroup;
  showPassword = false;
  loading = false;
  isFlipping = false;
  error = '';
  token: string | null = null;
  
  passwordStrength = 0;
  private passwordSub!: Subscription;

  constructor(private route: ActivatedRoute, private fb: FormBuilder, private router: Router, private api: LoginS) {

  }

  ngOnInit(): void {
    this.recoverForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required, Validators.minLength(8)]],
    }, { validators: this.passwordMatchValidator });

    this.route.queryParamMap.subscribe(q => this.token = q.get('token'));

    this.passwordSub = this.password.valueChanges.subscribe(val => {
      this.calculatePasswordStrength(val);
    });
  }

  ngOnDestroy(): void {
    if (this.passwordSub) {
      this.passwordSub.unsubscribe();
    }
  }

  passwordMatchValidator(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;
    if (pass && confirm && pass !== confirm) {
      return { passwordMissMatch: true };
    }
    return null;
  }

  get password() {
    return this.recoverForm.controls['password'];
  }

  get passwordConfirmation() {
    return this.recoverForm.controls['password_confirmation'];
  }

  recoverPassword() {
    if (this.recoverForm.invalid) { this.recoverForm.markAllAsTouched(); return; }
    if (!this.token) { this.error = 'Token no encontrado en la URL'; return; }

    this.loading = true;
    const raw = this.recoverForm.value;

    const payload: any = {
      token: this.token,
      password: raw.password,
      password_confirmation: raw.password_confirmation
    };

    this.api.sendPasswordUpdate(payload as any).subscribe({
      next: (res) => {
        this.loading = false;
        toast.success('Contraseña actualizada correctamente');
        this.goToUrl('/iniciar-sesion');
      },
      error: (e) => {
        this.loading = false;
        toast.error('No se pudo actualizar la contraseña')
      }
    });
  }

  viewPassword() {
    this.showPassword = !this.showPassword;
  }

  cancel() {
    this.goToUrl('/iniciar-sesion');
  }

  goToUrl(url: string) {
    this.isFlipping = true;
    setTimeout(() => {
      this.router.navigateByUrl(url);
    }, 550);
  }

  calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 0;
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/\d/.test(password)) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    this.passwordStrength = strength;
  }

  get strengthText(): string {
    if (!this.password.value) return 'Seguridad de la contraseña';
    switch (this.passwordStrength) {
      case 0:
      case 1: return 'Débil';
      case 2: return 'Moderada';
      case 3: return 'Buena';
      case 4: return 'Fuerte';
      default: return 'Muy débil';
    }
  }

  get strengthColor(): string {
    switch (this.passwordStrength) {
      case 1: return 'strength-weak';
      case 2: return 'strength-medium';
      case 3: return 'strength-good';
      case 4: return 'strength-strong';
      default: return 'strength-none';
    }
  }
}