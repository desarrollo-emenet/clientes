import { Component } from '@angular/core';
import { DatePipe, DecimalPipe, NgIf } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginS } from '../../services/auth/login';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../../services/utility/http.service';
import { UserService } from '../../services/user/user-service';
@Component({
  selector: 'app-create-account',
  imports: [ReactiveFormsModule, NgIf, NgxSonnerToaster, DecimalPipe],
  templateUrl: './create-account.html',
  styleUrl: './create-account.css'
})

export class CreateAccount {

  createForm: FormGroup;
  loading!: boolean;
  isFlipping!: boolean;
  countdown = 0;
  protected Math = Math;
  private timerInterval: any;

  constructor(private fb: FormBuilder, private router: Router, private api: LoginS,
    protected http: HttpService,
    private rateLimit: UserService
  ) {
    this.createForm = this.fb.group({
      numero_cliente: ['', [Validators.required, Validators.maxLength(6), Validators.pattern('^[0-9]+$')]],
    });
  }


  ngOnInit(): void {
    const id = 'create_account';
    const faltante = this.rateLimit.getFaltante(id);

    if (faltante > 0) {
      this.countdown = faltante;
      this.startCountdown();
    }
  }

  protected async register() {
    if (this.loading) return;
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.createForm.patchValue({
      numero_cliente: this.createForm.value.numero_cliente.trim()
    });

    const id = 'create_account';
    if (!this.rateLimit.enviarCorreo(id)) {

      const intentos = this.rateLimit.getIntentos(id);
      const faltante = this.rateLimit.getFaltante(id);
      if (intentos >= 3 && faltante === 0) {
        toast.warning('Has alcanzado el límite de 3 intentos. Intenta nuevamente mañana.');
        return;
      }
      this.countdown = faltante;
      this.startCountdown();
      return;
    }

    this.countdown = this.rateLimit.registrarIntentos(id);
    this.startCountdown();

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


    private startCountdown(): void {
    clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        clearInterval(this.timerInterval);
        this.countdown = 0;
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }
}
