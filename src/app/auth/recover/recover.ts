import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginS } from '../../services/auth/login';
import { toast, NgxSonnerToaster } from 'ngx-sonner';


@Component({
  selector: 'app-recover',
  imports: [ReactiveFormsModule, NgIf, NgxSonnerToaster],
  templateUrl: './recover.html',
  styleUrl: './recover.css'
})
export class Recover implements OnInit {
  recoverForm!: FormGroup;
  loading = false;
  isFlipping = false;
  error = '';
  constructor(private fb: FormBuilder, private router: Router, private api: LoginS) {
    this.recoverForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    })
  }

  ngOnInit() {
  }

  get email() {
    return this.recoverForm.controls['email'];
  }

  recover() {
    if (this.recoverForm.invalid) { this.recoverForm.markAllAsTouched(); return; }

    this.loading = true;
    const raw = this.recoverForm.value;

    const payload: any = {
      email: raw.email
    };

    this.api.sendPasswordReset(payload as any).subscribe({
      next: (res) => {
        this.loading = false;
        toast.success('Correo de recuperación enviado correctamente');
        console.log(res);
      },
      error: (e) => {
        this.loading = false;
        toast.error('Error al enviar el correo');
      }
    });  
  }

  goToUrl(url: string) {
    this.isFlipping = true;
    setTimeout(() => {
      this.router.navigateByUrl(url);
    }, 550); // Tiempo óptimo para evitar trabas en el DOM
  }
}
