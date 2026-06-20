import { NgClass, NgIf, NgForOf } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSonnerToaster, toast } from "ngx-sonner";
import { ClientService } from '../../services/user/clientService';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../services/user/user-service';
import { Subscription } from 'rxjs';
import { LoginS } from '../../services/auth/login';

@Component({
  selector: 'app-form-pagos',
  imports: [NgxSonnerToaster,
    NgIf,
    NgClass,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatIconModule, NgForOf],
  templateUrl: './form-pagos.html',
  styleUrl: './form-pagos.css'
})
export class FormPagos {

  loading = false;
  archivoSeleccionado!: File;
  pagosForm!: FormGroup;
  data: any;
  maxDate = new Date();
  private subs: Subscription[] = [];

  activeSection: string = 'pagos';
  pagosAbierto: string | null = null;
  formularioAbierto: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private loginS: LoginS,
    private clientS: ClientService,
    private user: UserService,
    private route: ActivatedRoute) {

    this.pagosForm = this.fb.group({
      //cliente: ['', [Validators.required, Validators.maxLength(10)]],
      fechaPago: ['', [Validators.required]],
      numOperacion: ['', [Validators.required, Validators.maxLength(100)]],
      telefono: ['', [Validators.required, Validators.maxLength(10), Validators.pattern('^[0-9]+$')]],
      clave: ['', [Validators.required]],
      comprobante: [null, [Validators.required]],
      monto: ['', [Validators.required, Validators.maxLength(5), Validators.pattern('^[0-9]+$')]],

    })
  }

  showSection(id: string): void {
    this.activeSection = id;
    this.pagosAbierto = null;
    this.formularioAbierto = null;
  }

  togglePagos(id: string): void {
    this.pagosAbierto = this.pagosAbierto === id ? null : id;
  }

  toggleFormulario(id: string): void {
    this.formularioAbierto = this.formularioAbierto === id ? null : id;
  }

  goNavigate(ruta: string) {
    this.loginS.goNavigate(ruta);
  }

  get telefono() {
    return this.pagosForm.controls['telefono'];
  }

  get clave() {
    return this.pagosForm.controls['clave'];
  }
  get fechaPago() {
    return this.pagosForm.controls['fechaPago'];
  }
  get numOperacion() {
    return this.pagosForm.controls['numOperacion'];
  }

  get comprobante() {
    return this.pagosForm.controls['comprobante'];
  }
  get monto() {
    return this.pagosForm.controls['monto'];
  }


  onFileChange(event: any) {
    const file = event.target.files[0]; //obtener archivo seleccionado
    if (!file) {
      return;
    }

    const tipoPermitido = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!tipoPermitido.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Por favor, selecciona un archivo de imagen o PDF.');
      this.pagosForm.get('comprobante')?.setValue(null);

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 2 MB');
      this.pagosForm.get('comprobante')?.setValue(null);
      return;
    }
    this.archivoSeleccionado = file;
  }

  ngOnInit(): void {
    const sub = this.user.obtenerUsuarioAutenticado(this.route)
      .subscribe({
        next: (numeroCliente) => {
          if (!numeroCliente) return;
          this.loadClientData(numeroCliente);
        },
        error: (e) => {
          //console.error('Error al obtener usuario autenticado', e);
          toast.error('Error al obtener información del usuario');
        }
      });
    this.subs.push(sub);
  }

  loadClientData(numeroCliente: string) {
    this.loading = true;
    this.data = null;

    const sub = this.clientS.getClientePorNumero(numeroCliente).subscribe({
      next: res => {
        this.data = res,
          this.loading = false;
        //console.log('Datos del cliente cargados', this.data);
        const telefonoOriginal = this.data?.cliente?.cliente?.telefono ?? '';
        //quitar espacio y solo tomar 10 digitos
        const telefono = telefonoOriginal.replace(/\s/g, '').substring(0, 10);
        this.pagosForm.patchValue({ telefono: telefono });
      },
      error: (e) => {
        this.loading = false;
        console.error('Error en servicio', e);
        if (e?.status === 0) {
          toast.error('No se pudo conectar al servidor');
        } else if (e?.status === 404) {
          toast.error('Servicio no encontrado');
        } else if (e?.status === 401) {
          toast.error('No autorizado');
          this.router.navigateByUrl('/iniciar-sesion');
        } else if (e?.status === 403) {
          toast.error('No autorizado para eliminar este servicio');
        } else {
          toast.error('Error inesperado');
        }
      }

    })

  }

  enviarPago() {
    //enviar datos recolectados por formulario a backend
    if (this.pagosForm.invalid) {
      this.pagosForm.markAllAsTouched();
      toast.error("Completar los campos requeridos");
      console.log('datos del formulario no validos', this.pagosForm.value);
      return
    }


    this.loading = true;

    //console.log("dataaaa", this.data);
    const cliente = this.data?.numero_cliente ?? '';
    //const telefono = this.data?.cliente?.cliente?.telefono ?? '';
    const raw = this.pagosForm.value;
    const fecha = new Date(raw.fechaPago);

    const formData = new FormData();
    formData.append('cliente', cliente);
    formData.append('clave', raw.clave);
    formData.append('fechaPago', fecha.toISOString().split('T')[0]);
    formData.append('numOperacion', raw.numOperacion);
    formData.append('telefono', raw.telefono);
    formData.append('monto', raw.monto);
    formData.append('comprobante', this.archivoSeleccionado);

    console.log('cliente', formData.get('cliente'));
    console.log('telefono', formData.get('telefono'));
    console.log('clave', formData.get('clave'));
    console.log('fechaPago', formData.get('fechaPago'));
    console.log('numOperacion', formData.get('numOperacion'));
    console.log('monto', formData.get('monto'));
    console.log('comprobante', formData.get('comprobante'));


    this.clientS.pagosBanco(formData as any).subscribe({
      next: () => {
        this.loading = false;
        toast.success('datos enviados')
        this.pagosForm.reset()
      },
      error: (e) => {
        this.loading = false;
        console.log(e);
        toast.error('No se pudo enviar')
        console.error('Error en servicio', e);
      }
    });
  }

  pagoSeleccionado: any = null;

  abrirDetalle(pago: any): void {
    this.pagoSeleccionado = pago;
  }

  cerrarDetalle(): void {
    this.pagoSeleccionado = null;
  }
  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    if (this.pagoSeleccionado) {
      this.cerrarDetalle();
    }
  }

  pagos = [
    {
      asunto: 'Pago mensual Internet',
      referencia: 'PAY-202605-001',
      fecha: '13 Junio 2026',
      monto: 300,
      estatus: 'validado', // validado | pendiente | declinado
      observacion: '',
      comprobante: 'assets/img/comprobante.jpg'
    },
    {
      asunto: 'Pago mensual Internet',
      referencia: 'PAY-202605-001',
      fecha: '13 Mayo 2026',
      monto: 300,
      estatus: 'declinado', // validado | pendiente | declinado
      observacion: 'El comprobante no coincide con el monto',
      comprobante: 'assets/img/comprobante.jpg'
    },
    {
      asunto: 'Pago mensual Internet',
      referencia: 'PAY-202605-001',
      fecha: '13 Abril 2026',
      monto: 300,
      estatus: 'pendiente', // validado | pendiente | declinado
      observacion: 'El comprobante no coincide con el monto',
      comprobante: 'assets/img/comprobante.jpg'
    }
  ];

}
