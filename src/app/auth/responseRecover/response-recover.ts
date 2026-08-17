import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';
import { LoginS } from '../../services/auth/login';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { Subscription } from 'rxjs';
import { HttpService } from '../../services/utility/http.service';
import { PasswordService } from '../../services/utility/password.service';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-response-recover',
  imports: [ReactiveFormsModule, NgIf, NgClass, NgxSonnerToaster],
  templateUrl: './response-recover.html',
  styleUrl: './response-recover.css',
})
export class ResponseRecover implements OnInit, OnDestroy {
  recoverForm: FormGroup;
  showPassword!: boolean;
  loading!: boolean;
  isFlipping!: boolean;
  token: string | null = null;
  passwordStrength = 0;
  private passwordSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private api: LoginS,
    protected http: HttpService,
    protected passwordService: PasswordService,
  ) {
    this.route.queryParamMap.subscribe(q => this.token = q.get('token'));
    this.recoverForm = this.fb.group({
      password: [null, [Validators.required, Validators.minLength(8)]],
      password_confirmation: [null, [Validators.required, Validators.minLength(8)]],
      token: [this.token, [Validators.required]]
    },{ validators: this.passwordService.matchValidator });
  }

  ngOnInit(): void {
    this.passwordSub = this.password.valueChanges.subscribe((val) => {
       this.passwordStrength = this.passwordService.calculateStrength(val);
    });
  }

  ngOnDestroy(): void {
    if (this.passwordSub) this.passwordSub.unsubscribe();
  }
  protected async recoverPassword(): Promise<void> {
    if (this.recoverForm.invalid) return this.recoverForm.markAllAsTouched();
    if (!this.token) {
      toast.dismiss();
      toast.error('Token no encontrado en la URL')
      return;
    }
    try{
      const { message } = await firstValueFrom(this.api.sendPasswordUpdate(this.recoverForm.value));
      toast.success(message);
      this.isFlipping = this.http.goToUrl('/iniciar-sesion');
    }catch(e){
      this.http.errorHttp(e as HttpErrorResponse, "Error al actualizar la contraseña.")
    }finally{
      this.loading = false;
    }
  }

  get password() {
    return this.recoverForm.controls['password'];
  }

  get passwordConfirmation() {
    return this.recoverForm.controls['password_confirmation'];
  }
}
