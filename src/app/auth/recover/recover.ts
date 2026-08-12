import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginS } from '../../services/auth/login';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { HttpService } from '../../services/utility/http.service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';


@Component({
  selector: 'app-recover',
  imports: [ReactiveFormsModule, NgIf, NgxSonnerToaster],
  templateUrl: './recover.html',
  styleUrl: './recover.css'
})
export class Recover {
  recoverForm: FormGroup;
  loading!: boolean;
  isFlipping!: boolean;

  constructor(private fb: FormBuilder,
    private api: LoginS,
    public http: HttpService
  ) {
    this.recoverForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]]
    })
  }

  get email() {
    return this.recoverForm.controls['email'];
  }

  protected async recover(): Promise<void>{
    if (this.recoverForm.invalid)  return this.recoverForm.markAllAsTouched();
    try{
      this.loading = true;
      const { message } = await firstValueFrom(this.api.sendPasswordReset(this.recoverForm.value));
      toast.success(message);
    }catch(e){
      this.http.errorHttp(e as HttpErrorResponse, "Error al enviar el correo")
    }finally{
      this.loading = false;
    }
  }
}
