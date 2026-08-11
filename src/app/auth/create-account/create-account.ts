import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginS } from '../../services/auth/login';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../../services/utility/http.service';
@Component({
  selector: 'app-create-account',
  imports: [ReactiveFormsModule, NgIf, NgxSonnerToaster],
  templateUrl: './create-account.html',
  styleUrl: './create-account.css'
})

export class CreateAccount {
  createForm: FormGroup;
  loading!: boolean;
  isFlipping!: boolean;
  constructor(private fb: FormBuilder, private router: Router, private api: LoginS,
    protected http: HttpService
  ) {
    this.createForm = this.fb.group({
      numero_cliente: ['', [Validators.required, Validators.maxLength(6), Validators.pattern('^[0-9]+$')]],
    });
  }
  protected async register() {
    if (this.loading) return;
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.createForm.patchValue({
      numero_cliente: this.createForm.value.numero_cliente.trim()
    });

    try{
      this.loading = true;
      await firstValueFrom(this.api.register(this.createForm.value));
      this.router.navigate(['/iniciar-sesion'], {state: { success: true },});
    }catch(error){
      this.http.errorHttp(error as HttpErrorResponse, 'Error al registrar la cuenta');
    }finally{
      this.loading = false;
    }
  }
  get numero_cliente() { return this.createForm.controls['numero_cliente']; }
}
