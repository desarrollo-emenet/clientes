import { NgIf, NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService } from '../../services/user/clientService';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { LoginS } from '../../services/auth/login';
import { firstValueFrom, Subscription, switchMap } from 'rxjs';
import { PasswordService } from '../../services/utility/password.service';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../../services/utility/http.service';
import { ObservableService } from '../../services/utility/observable.service';
import { CalculoService } from '../../services/utility/calculo.service';
import { UserService } from '../../services/user/user-service';

@Component({
  selector: 'app-edit-profile',
  imports: [ReactiveFormsModule, NgIf, NgxSonnerToaster, NgClass],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfile {
  updateForm!: FormGroup;
  showOldPassword!: boolean;
  showPassword!: boolean;
  loading!: boolean;
  infoCliente: any;
  passwordStrength = 0;
  private passwordSub!: Subscription;

  constructor(
    private fb: FormBuilder,
    private clientS: ClientService,
    private auth: LoginS,
    protected http: HttpService,
    private calculo: CalculoService,
    protected passwordService: PasswordService,
    private ObservableService: ObservableService,
    private user: UserService
  ) {
    this.updateForm = this.fb.group({
      email: [null, [Validators.email]],
      old_password: [null, [Validators.required, Validators.minLength(8)]],
      password: [null, [Validators.minLength(8)]],
      password_confirmation: [null, [Validators.minLength(8)]],
    }, { validators: this.passwordService.matchValidator });
  }

  ngOnInit(): void {
    const clienteActivo = this.user.obtenerServicioActivo();
    this.passwordSub = this.password.valueChanges.subscribe((val) => {
      this.passwordStrength = this.passwordService.calculateStrength(val);
    });
    this.ObservableService.cliente$.subscribe(info => this.infoCliente = info)
    if(!this.infoCliente.cliente) this.loadClientData(clienteActivo ?? '');
  }

  protected async loadClientData(numeroCliente: string): Promise<void> {
    try {
      const { cliente, servicios } = await firstValueFrom(this.clientS.getClientePorNumero(numeroCliente));
      this.ObservableService.actualizarObs(cliente, this.calculo.construirNotificaciones(cliente), servicios);
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    } finally {
    }
  }

  protected async update(): Promise<void> {
    const cambiarEmail = !!this.email.value;
    const cambiarPassword = !!this.password.value;
    if (!cambiarEmail && !cambiarPassword) {
      this.updateForm.markAllAsTouched();
      return;
    }
    if (this.updateForm.invalid) { this.updateForm.markAllAsTouched(); return; }
    try {
      this.loading = true;
      const user = await firstValueFrom(this.clientS.getAuthenticatedUser());
      const response = await firstValueFrom(this.clientS.updateUser(user.id, this.updateForm.value));
      this.onUpdateSuccess(response);
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, "Error al actualizar los datos.")
    } finally {
      this.loading = false;
    }
  }

  private onUpdateSuccess(response:any): void {
    toast.success(response.mensaje);
    this.updateForm.reset();
    setTimeout(() => {
      //this.auth.logout()
      this.auth.goNavigate('/dashboard');
    }, 3500);
  }

  ngOnDestroy(): void {
    if (this.passwordSub) {
      this.passwordSub.unsubscribe();
    }
  }

  get email() { return this.updateForm.controls['email']; }
  get old_password() { return this.updateForm.controls['old_password']!; }
  get password() { return this.updateForm.controls['password']!; }
  get passwordConfirmation() { return this.updateForm.controls['password_confirmation']; }

  protected cancel() {
    this.auth.goNavigate('/dashboard');
  }
}
