import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSonnerToaster } from "ngx-sonner";
import { ClientService } from '../../services/user/clientService';


@Component({
  selector: 'app-form-pagos',
  imports: [NgxSonnerToaster, NgIf, ReactiveFormsModule, ],
  templateUrl: './form-pagos.html',
  styleUrl: './form-pagos.css'
})
export class FormPagos {

  date: Date | undefined;
  loading = false;
  showPassword = false;
  pagosForm!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private api: ClientService) {
    this.pagosForm = this.fb.group({
      cliente: ['', [Validators.required, Validators.maxLength(6)]],
      usuario: ['', [Validators.required, Validators.maxLength(100)]],
      fechaPago: ['', [Validators.required]],
      numOperacion: ['', [Validators.required, Validators.maxLength(100)]],
      telefono: ['', [Validators.required, Validators.maxLength(20)]],
      clave: ['', [Validators.required, Validators.maxLength(100)]],
      comprobante: [null, [Validators.required]],
      mensualidad: ['', [Validators.required, Validators.maxLength(20)]],
      monto: ['', [Validators.required, Validators.maxLength(20)]],

    })
  }

  get cliente() {
    return this.pagosForm.controls['cliente'];
  }
  get usuario() {
    return this.pagosForm.controls['usuario'];
  }
  get fechaPago() {
    return this.pagosForm.controls['fechaPago'];
  }
  get numOperacion() {
    return this.pagosForm.controls['numOperacion'];
  }
  get telefono() {
    return this.pagosForm.controls['telefono'];
  }
  get clave() {
    return this.pagosForm.controls['clave'];
  }
  get comprobante() {
    return this.pagosForm.controls['comprobante'];
  }
  get mensualidad() {
    return this.pagosForm.controls['mensualidad'];
  }
  get monto() {
    return this.pagosForm.controls['monto'];
  }


  enviarPago() {
  }

}
