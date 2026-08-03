import { NgClass, NgIf, NgForOf, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../../services/user/clientService';
import { UserService } from '../../services/user/user-service';

import { NgxSonnerToaster, toast } from "ngx-sonner";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

interface Pago {
  id: number;
  numOperacion: string;
  clave: string;
  mensualidad: string;
  cantidad: string;
  estado: string;
  observacion: string | null;
  created_at: string;
}

interface EstadoConfig {
  texto: string;
  clase: string;
  icono: string;
}

@Component({
  selector: 'app-form-pagos',
  imports: [NgxSonnerToaster,
    NgIf,
    DatePipe,
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
  pagos: Pago[] = [];


  filtroEstado = 'todos';
  elementosPorPagina = 10;
  paginaActual = 1;

  readonly filtros = [
    { value: 'todos', label: 'Todas' },
    { value: '1', label: 'Pendientes' },
    { value: 'registrado', label: 'Registrado' },
    { value: '4', label: 'Rechazado' }
  ];


  private readonly estados: Record<string, EstadoConfig> = {

    '1': {
      texto: 'Pendiente',
      clase: 'pendiente',
      icono: 'fa-clock'
    },
    '2': {
      texto: 'Validado',
      clase: 'validado',
      icono: 'fa-check'
    },
    '3': {
      texto: 'Validado',
      clase: 'validado',
      icono: 'fa-check'
    },
    '4': {
      texto: 'Recahzado',
      clase: 'rechazado',
      icono: 'fa-xmark'
    }
  };

  private readonly TIPOS_PERMITIDOS = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];

  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024;

  activeSection: string = 'formulario';
  pagosAbierto: string | null = null;
  formularioAbierto: string | null = null;

  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private clientS: ClientService,
    private user: UserService) { }


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

  get f() {
    return this.pagosForm.controls;
  }

  ngOnInit(): void {
    this.crearFormulario();
    const numeroCliente = this.user.obtenerServicioActivo();
    if (!numeroCliente) {
      return;
    }
    this.cargarDatos(numeroCliente);
  }

  private crearFormulario(): void {
    this.pagosForm = this.fb.nonNullable.group({
      fechaPago: ['', [Validators.required]],
      numOperacion: ['', [Validators.required, Validators.maxLength(30)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      clave: ['', [Validators.required]],
      comprobante: [null, [Validators.required]],
      monto: ['', [Validators.required, Validators.pattern(/^\d{1,5}$/)]],

    })
  }


  private cargarDatos(numeroCliente: string) {
    this.loading = true;
    forkJoin({
      cliente: this.clientS.getClientePorNumero(numeroCliente),
      pagos: this.clientS.resBanco(numeroCliente)
    }).subscribe({
      next: ({ cliente, pagos }) => {
        this.data = cliente;
        this.pagos = pagos.pagos;
        this.cargarTelefono();
        this.loading = false;
      },
      error: (e) => {
        this.manejoError(e);
      }
    });
  }

  private cargarTelefono(): void {
    const telefono =
      this.data?.cliente?.cliente?.telefono
        ?.replace(/\s/g, '')
        .substring(0, 10) ?? '';
    this.pagosForm.patchValue({
      telefono
    });
  }

  private processFile(file: File) {

    if (!this.TIPOS_PERMITIDOS.includes(file.type)) {
      toast.error('Tipo de archivo no permitido.');
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      toast.error('El archivo no debe superar los 2 MB');
      return;
    }

    this.archivoSeleccionado = file;
    this.selectedFile = file;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
    } else {
      this.imagePreview = 'assets/img/pdf.webp';
    }

    this.pagosForm.patchValue({
      comprobante: file
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) this.processFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }



  enviarPago() {
   /* Object.keys(this.pagosForm.controls).forEach(key => {
      const controlErrors = this.pagosForm.get(key)?.errors;

      if (controlErrors) {
        console.log('Campo:', key, 'Errores:', controlErrors);
      }
    });*/


    if (this.pagosForm.invalid) {
      this.pagosForm.markAllAsTouched();
      toast.error("Completar los campos requeridos");
      return
    }
    this.loading = true;

    this.limpiarErroresBackend();

    this.clientS.pagosBanco(this.crearFormData()).subscribe({
      next: () => {
        toast.success('Datos enviados');
        this.pagosForm.reset();
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        if (e.status === 422) {
              console.log(e.error.errors);

          this.asignarErrores(e.error.errors);
        }
        toast.error('Ocurrió un error.');
      }
    });
  }


  private crearFormData(): FormData {
    const raw = this.pagosForm.getRawValue();
    const formData = new FormData();
    const cliente = this.data?.numero_cliente ?? '';
    const fecha = new Date(raw.fechaPago);

    //const formData = new FormData();
    formData.append('cliente', cliente);
    formData.append('clave', raw.clave);
    formData.append('fechaPago', fecha.toISOString().split('T')[0]);
    formData.append('numOperacion', raw.numOperacion);
    formData.append('telefono', raw.telefono);
    formData.append('monto', raw.monto);
    formData.append('comprobante', this.archivoSeleccionado);

    return formData;
  }


  private asignarErrores(errors: any): void {
    Object.keys(errors).forEach(campo => {

      const control = this.pagosForm.get(campo);
      if (control) {
        console.log(control);
        control.setErrors({
          backend: errors[campo][0]
        });
        control.markAsTouched();
      }
    });
  }

  private limpiarErroresBackend(): void {
  Object.keys(this.pagosForm.controls).forEach(key => {
    const control = this.pagosForm.get(key);
    if (control && control.hasError('backend')) {
      const errors = { ...control.errors };
      delete errors['backend'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  });
}



  private manejoError(e: any): void {
    this.loading = false;
    switch (e?.status) {
      case 0:
        toast.error('No se pudo conectar al servidor');
        break;

      case 401:
        toast.error('No autorizado');
        this.router.navigateByUrl('/iniciar-sesion');
        break;

      case 404:
        toast.error('Servicio no encontrado');
        break;

      case 500:
        toast.error('No se pudo conectar al servidor');
        break;

      default:
        toast.error('Error inesperado');
    }
    console.error(e);
  }

  getEstadoConfig(estado: string) {
    return this.estados[estado] ?? {
      texto: 'Desconocido',
      clase: 'desconocido',
      icono: 'fa-circle-question'
    };
  }

  //evitar recarga de elementos repetidos 
  trackByPago(index: number, pago: any): number {
    return pago.id;
  }

  //filtro
  private coincideFiltro(pago: Pago): boolean {
    switch (this.filtroEstado) {
      case 'todos':
        return true;
      case 'registrado':
        return ['2', '3'].includes(pago.estado);
      default:
        return pago.estado === this.filtroEstado;
    }
  }

  get pagosFiltrados(): Pago[] {
    return this.pagos.filter(pago => this.coincideFiltro(pago));
  }

  cambiarFiltro(estado: string): void {
    this.filtroEstado = estado;
    this.paginaActual = 1;
  }

  contarEstado(estado: string): number {
    if (estado === 'todos') {
      return this.pagos.length;
    }
    if (estado === 'registrado') {
      return this.pagos.filter(p => ['2', '3'].includes(p.estado)).length;
    }
    return this.pagos.filter(p => p.estado === estado).length;
  }

  get mensajeFiltro(): string {

    const mensajes: Record<string, string> = {
      '1': 'No hay pagos pendientes.',
      'registrado': 'No hay pagos registrados.',
      '4': 'No hay pagos declinados.',
      'todos': 'No se encontraron pagos.'
    };

    return mensajes[this.filtroEstado] ?? 'No se encontraron pagos.';
  }

  //paginacion
  get pagosPaginados(): Pago[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.pagosFiltrados.slice(
      inicio,
      inicio + this.elementosPorPagina
    );
  }

  get totalPaginas(): number {
    return Math.max(
      1,
      Math.ceil(this.pagosFiltrados.length / this.elementosPorPagina)
    );
  }

  get paginas(): number[] {
    return Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

soloNumeros(event: Event, controlName: string, maxLength: number): void {
  const input = event.target as HTMLInputElement;

  const valor = input.value
    .replace(/\D/g, '')      
    .slice(0, maxLength);    

  input.value = valor;

  this.pagosForm.get(controlName)?.setValue(valor, { emitEvent: false });
}


}
