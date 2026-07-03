import { NgClass, NgIf, NgForOf, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private clientS: ClientService,
    private user: UserService,
    private route: ActivatedRoute) {

    this.pagosForm = this.fb.nonNullable.group({
      fechaPago: ['', [Validators.required]],
      numOperacion: ['', [Validators.required, Validators.maxLength(35)]],
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

  get f() {
    return this.pagosForm.controls;
  }

  ngOnInit() {

    this.user.obtenerUsuarioAutenticado(this.route).subscribe({
      next: numeroCliente => {
        if (!numeroCliente) return;
        forkJoin({
          cliente: this.clientS.getClientePorNumero(numeroCliente),
          pagos: this.clientS.resBanco(numeroCliente)
        }).subscribe({
          next: ({ cliente, pagos }) => {
            this.data = cliente;
            this.pagos = pagos.pagos;
            const telefono =
              this.data?.cliente?.cliente?.telefono
                ?.replace(/\s/g, '')
                .substring(0, 10) ?? '';
            this.pagosForm.patchValue({ telefono });
          }
        });
      }
    });
  }


  onFileChange(event: any) {
    const file = event.target.files[0]; //obtener archivo seleccionado
    if (!file) {
      return;
    }

    if (!this.TIPOS_PERMITIDOS.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Por favor, selecciona un archivo de imagen o PDF.');
      this.pagosForm.get('comprobante')?.setValue(null);

      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      toast.error('El archivo no debe superar los 2 MB');
      this.pagosForm.get('comprobante')?.setValue(null);
      return;
    }
    this.archivoSeleccionado = file;
  }

  loadClientData(numeroCliente: string): void {
    this.loading = true;

    this.clientS.getClientePorNumero(numeroCliente).subscribe({
      next: res => {
        this.data = res,
          this.loading = false;
        const telefono =
          this.data?.cliente?.cliente?.telefono
            ?.replace(/\s/g, '')
            .substring(0, 10) ?? '';

        this.pagosForm.patchValue({ telefono });
        this.respuestaPago(this.data?.cliente?.cliente?.numero_cliente);

      },
      error: (e) => this.manejoError(e)
    });
  }


  private respuestaPago(cliente: string) {
    this.clientS.resBanco(cliente).subscribe({
      next: ({ pagos }) => {
        this.pagos = pagos ?? [];
      },
      error: e => this.manejoError(e)
    });
  }

  enviarPago() {
    //enviar datos recolectados por formulario a backend
    if (this.pagosForm.invalid) {
      this.pagosForm.markAllAsTouched();
      toast.error("Completar los campos requeridos");
      return
    }

    this.loading = true;

    //console.log("dataaaa", this.data);
    const cliente = this.data?.numero_cliente ?? '';
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

    this.clientS.pagosBanco(formData as any).subscribe({
      next: () => {
        toast.success('datos enviados')
        this.pagosForm.reset()
        this.loading = false;

      },
      error: (e) => {
        this.manejoError(e);
        toast.error('No se pudo enviar')
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

      case 403:
        toast.error('No autorizado');
        break;

      case 404:
        toast.error('Servicio no encontrado');
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
}
