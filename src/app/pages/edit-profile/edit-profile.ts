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
      password: ['', [Validators.minLength(8)]]
    });

    this.loadUserData();
  }

  //get email() { return this.updateForm.controls['email']!; }
  get password() { return this.updateForm.controls['password']!; }

  loadUserData() {

    this.clientS.getAuthenticatedUser().subscribe({
      next: user => {
        this.updateForm.patchValue({
          email: user.email ?? ''
        });
        //console.log(user);
      },
      error: (err) => {
        console.error('Error al cargar datos del usuario', err);
      }
    });
  }



  update() {
    if (this.updateForm.invalid) { this.updateForm.markAllAsTouched(); return; }

    this.loading = true;
    const raw = this.updateForm.value;

    const payload: any = {
      email: raw.email,
    };

    if(raw.password && raw.password.length >= 8) {
      payload.password = raw.password;
    }


    this.clientS.getAuthenticatedUser().subscribe({
      next: user => {
        const id = user.id;
        this.clientS.updateUser(id, payload as any).subscribe({
          next: () => {
            this.loading = false;
            toast.success('Perfil actualizado');
            this.updateForm.get('password')?.reset();
            
            this.loadUserData();
            setTimeout(() => {
              this.auth.goNavigate('/perfil');
            }, 1500);

          },
          error: (e) => {
            this.loading = false;
            toast.error('Error update:', e);
            toast.error = e?.error?.message ?? 'No se pudo actualiza';
          }
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
