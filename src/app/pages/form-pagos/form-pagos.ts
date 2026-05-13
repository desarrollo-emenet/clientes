import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSonnerToaster, toast } from "ngx-sonner";
import { ClientService } from '../../services/user/clientService';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-form-pagos',
  imports: [NgxSonnerToaster,
    NgIf,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatIconModule],
  templateUrl: './form-pagos.html',
  styleUrl: './form-pagos.css'
})
export class FormPagos {

  loading = false;
  archivoSeleccionado!: File;
  pagosForm!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private clientS: ClientService) {
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

  onFileChange(event: any) {
  this.archivoSeleccionado = event.target.files[0];
}


  enviarPago() {
    //enviar datos recolectados por formulario a backend
    if (this.pagosForm.invalid) {
      this.pagosForm.markAllAsTouched();
      toast.error("Completar los campos requeridos");
      return
    }
    this.loading = true;
    const raw = this.pagosForm.value;
    const fecha = new Date(raw.fechaPago);


    const formData = new FormData();
    formData.append('cliente', raw.cliente);
    formData.append('nombre', raw.usuario);
    formData.append('fechaPago', fecha.toISOString().split('T')[0]);
    formData.append('numOperacion', raw.numOperacion);
    formData.append('telefono', raw.telefono);
    formData.append('clave', raw.clave);
    formData.append('mensualidad', raw.mensualidad);
    formData.append('monto', raw.monto);

formData.append('comprobante', this.archivoSeleccionado);
    

    this.clientS.pagosBanco(formData as any).subscribe({
      next: () => {
        console.log(formData);
        this.loading = false;
        toast.success('datos enviados')
        this.pagosForm.reset()
      },
      error: (e) => {
        this.loading = false;
        console.log(e);
        toast.error('No se pudo enviar')
      }
    });
  }

}
