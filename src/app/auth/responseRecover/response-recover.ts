import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { LoginS } from '../../services/auth/login';
import { toast, NgxSonnerToaster } from 'ngx-sonner';

@Component({ 
  selector: 'app-response-recover',
  imports: [ReactiveFormsModule, NgIf, NgxSonnerToaster],
  templateUrl: './response-recover.html',
  styleUrl: './response-recover.css'
})
export class ResponseRecover {
  recoverForm!: FormGroup;
  showPassword = false;
  loading = false;
  isFlipping = false;
  error = '';
  token: string | null = null;

  constructor(private route: ActivatedRoute, private fb: FormBuilder, private router: Router, private api: LoginS) {

  }

  ngOnInit(): void {
    this.recoverForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required, Validators.minLength(8)]],
    }, { validators: this.passwordMatchValidator });

    this.route.queryParamMap.subscribe(q => this.token = q.get('token'));
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
}
