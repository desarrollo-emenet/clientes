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


  constructor(private fb: FormBuilder,
    private clientS: ClientService,
    private auth: LoginS,
    protected http: HttpService,
    protected passwordService: PasswordService) {
    this.updateForm = this.fb.group({
      old_password: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required, Validators.minLength(8)]],
    }, { validators: this.passwordService.matchValidator });
  }

  ngOnInit(): void {
    this.passwordSub = this.password.valueChanges.subscribe((val) => {
      this.passwordStrength = this.passwordService.calculateStrength(val);
    });
  }

  ngOnDestroy(): void {
    if (this.passwordSub) {
      this.passwordSub.unsubscribe();
    }
  }


  get old_password() { return this.updateForm.controls['old_password']!; }
  get password() { return this.updateForm.controls['password']!; }
  get passwordConfirmation() { return this.updateForm.controls['password_confirmation']; }


  protected async update(): Promise<void> {
    if (this.updateForm.invalid) { this.updateForm.markAllAsTouched(); return; }
    this.loading = true;

    try {
      const raw = this.updateForm.getRawValue();
      const payload = {
        old_password: raw.old_password,
        password: raw.password,
        password_confirmation: raw.password_confirmation
      };

      const user = await firstValueFrom(this.clientS.getAuthenticatedUser());
      await firstValueFrom(this.clientS.updateUser(user.id, payload));

      this.onUpdateSuccess();

    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, "Error al actualizar la contraseña.")
      //this.handleUpdateError(error);
    }finally{
      this.loading = false;
    }

  }


  private onUpdateSuccess(): void {
    this.loading = false;
    toast.success('Perfil actualizado');
    this.updateForm.reset();
    setTimeout(() => {
      this.auth.goNavigate('/dashboard');
    }, 1500);
  }

  cancel() {
    this.auth.goNavigate('/dashboard');
  }

  viewPassword() {
    this.showPassword = !this.showPassword;
  }
  viewOldPassword() {
    this.showOldPassword = !this.showOldPassword;
  }

}
