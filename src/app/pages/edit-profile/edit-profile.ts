import { NgIf, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../../services/user/clientService';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { LoginS } from '../../services/auth/login';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-profile',
  imports: [ReactiveFormsModule, NgIf, NgxSonnerToaster, NgClass],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfile {
  updateForm!: FormGroup;
  showOldPassword = false;
  showPassword = false;
  loading = false;

  passwordStrength = 0;
  private passwordSub!: Subscription;


  constructor(private fb: FormBuilder, private router: Router, private clientS: ClientService, private auth: LoginS) {
  }

  ngOnInit(): void {
    this.updateForm = this.fb.group({
      //email: ['', [Validators.required, Validators.email]],
      old_password: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required, Validators.minLength(8)]],
    }, { validators: this.passwordMatchValidator });

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

  //get email() { return this.updateForm.controls['email']!; }
  get old_password() { return this.updateForm.controls['old_password']!; }
  get password() { return this.updateForm.controls['password']!; }
  get passwordConfirmation() { return this.updateForm.controls['password_confirmation']; }


  update() {
    if (this.updateForm.invalid) { this.updateForm.markAllAsTouched(); return; }

    this.loading = true;

    const raw = this.updateForm.value;

    const payload: any = {
      old_password: raw.old_password,
      password: raw.password,
      password_confirmation: raw.password_confirmation
    };


    this.clientS.getAuthenticatedUser().subscribe({
      next: user => {
        const id = user.id;
        this.clientS.updateUser(id, payload as any).subscribe({
          next: () => {
            this.loading = false;
            toast.success('Perfil actualizado');
            this.updateForm.get('password')?.reset();

            setTimeout(() => {
              this.auth.goNavigate('/perfil');
            }, 1500);

          },
          error: (e) => {
            this.loading = false;
            //console.error('Error en servicio', e);
            if (e?.status === 0) {
              toast.error('No se pudo conectar al servidor');
            } else if (e?.status === 422) {
              toast.error('Datos inválidos. Revisa el formulario.');
            } else if (e?.status === 403) {
              toast.error('Contraseña actual incorrecta');
            } else {
              toast.error(e?.error?.message ?? 'No se pudo actualizar');
            }
          },
        });
      },
      error: err => {
        this.loading = false;
        toast.error('No se pudo obtener el usuario', err);
      }
    });
  }

  cancel() {
    this.auth.goNavigate('/perfil')
  }


  viewPassword() {
    this.showPassword = !this.showPassword;
  }
  viewOldPassword() {
    this.showOldPassword = !this.showOldPassword;
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
