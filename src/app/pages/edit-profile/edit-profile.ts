import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../../services/user/clientService';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { LoginS } from '../../services/auth/login';

@Component({
  selector: 'app-edit-profile',
  imports: [ReactiveFormsModule, NgIf, NgxSonnerToaster],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfile {
  updateForm!: FormGroup;
  showPassword = false;
  loading = false;


  constructor(private fb: FormBuilder, private router: Router, private clientS: ClientService, private auth: LoginS) {
  }

  ngOnInit(): void {
    this.updateForm = this.fb.group({
      //email: ['', [Validators.required, Validators.email]],
      old_password: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required, Validators.minLength(8)]],
    }, { validators: this.passwordMatchValidator });
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
            }else if (e?.status === 422) {
              toast.error('Datos inválidos. Revisa el formulario.');
            }else if (e?.status === 403) {
              toast.error('Contraseña actual incorrecta');
            }else {
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
}
