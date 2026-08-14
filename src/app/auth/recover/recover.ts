import { Component } from '@angular/core';
import { DecimalPipe, NgIf } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginS } from '../../services/auth/login';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { HttpService } from '../../services/utility/http.service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../services/user/user-service';


@Component({
  selector: 'app-recover',
  imports: [ReactiveFormsModule, NgIf, NgxSonnerToaster, DecimalPipe],
  templateUrl: './recover.html',
  styleUrl: './recover.css'
})
export class Recover {
  recoverForm: FormGroup;
  loading!: boolean;
  isFlipping!: boolean;
  countdown = 0;
  protected Math = Math;
  private timerInterval: any;


  constructor(private fb: FormBuilder,
    private api: LoginS,
    public http: HttpService,
    private rateLimit: UserService
  ) {
    this.recoverForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]]
    })
  }

  get email() {
    return this.recoverForm.controls['email'];
  }

  ngOnInit(): void {

    const id = 'recover_password';
    const faltante = this.rateLimit.getFaltante(id);

    if (faltante > 0) {
      this.countdown = faltante;
      this.startCountdown();
    }
  }

  protected async recover(): Promise<void> {
    if (this.recoverForm.invalid) return this.recoverForm.markAllAsTouched();
    if (this.loading) return;

    const id = 'recover_password';
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


    try {
      this.loading = true;

      const { message } = await firstValueFrom(this.api.sendPasswordReset(this.recoverForm.value));
      toast.success(message);
    } catch (e) {
      this.http.errorHttp(e as HttpErrorResponse, "Error al enviar el correo")
    } finally {
      this.loading = false;
    }
  }


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
