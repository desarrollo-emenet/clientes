import { NgClass, NgIf, NgForOf } from '@angular/common';
import { Component } from '@angular/core';
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
import { forkJoin } from 'rxjs';
import { LoginS } from '../../services/auth/login';

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

  filtroEstado = 'todos';
  elementosPorPagina = 2;
  paginaActual = 1;

  filtros = [
    { value: 'todos', label: 'Todas' },
    { value: '1', label: 'Pendientes' },
    { value: 'registrado', label: 'Registrado' },
    { value: '4', label: 'Rechazado' }


  ];

  private readonly TIPOS_PERMITIDOS = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];

  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024;

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
    //this.data = null;

    this.clientS.getClientePorNumero(numeroCliente).subscribe({
      next: res => {
        this.data = res,
          this.loading = false;

        //console.log('Datos del cliente cargados', this.data);
        const telefono =
          this.data?.cliente?.cliente?.telefono
            ?.replace(/\s/g, '')
            .substring(0, 10) ?? '';

        this.pagosForm.patchValue({ telefono });
        this.respuestaPago();

      },
      error: (e) => this.manejoError(e)
    });
  }


  pagos: Pago[] = [];

  respuestaPago() {
    const cliente = this.data?.numero_cliente;
    if (!cliente) {
      console.error('No existe número de cliente');
      return;
    }
    //this.loading = true;
    this.clientS.resBanco(cliente).subscribe({
      next: ({ pagos }) => {
        this.pagos = pagos ?? [];
        console.log('Respuesta:', pagos);

        //this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
      }
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
        this.loading = false;
        console.log(e);
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

  //evitar recarga de elementos repetidos 
  trackByPago(index: number, pago: any): number {
    return pago.id;
  }



  // Filtros

  get pagosFiltradas(): Pago[] {
    if (this.filtroEstado === 'todos') {
      return this.pagos;
    }
    if (this.filtroEstado === 'registrado') {
      return this.pagos.filter(v =>
        v.estado === '2' || v.estado === '3');
    }
    return this.pagos.filter(
      pagos => pagos.estado === this.filtroEstado
    );
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
      return this.pagos.filter(v =>
        v.estado === '2' || v.estado === '3').length;
    }
    return this.pagos.filter(
      pagos => pagos.estado === estado
    ).length;
  }

  get mensajeFiltro(): string {

  switch (this.filtroEstado) {

    case '1':
      return 'No hay pagos pendientes.';

    case 'registrado':
      return 'No hay pagos registrados.';

    case '4':
      return 'No hay pagos registrados.';

    default:
      return 'No se encontraron pagos.';

  }

}

  // paginacion

  get pagosPaginados(): Pago[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.pagosFiltradas.slice(
      inicio,
      inicio + this.elementosPorPagina
    );
  }

  get totalPaginas(): number {
    return Math.max(
      1,
      Math.ceil(this.pagosFiltradas.length / this.elementosPorPagina)
    );
  }

  get paginas(): number[] {
    return Array.from(
      { length: this.totalPaginas },
      (_, index) => index + 1
    );
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }
    this.paginaActual = pagina;
  }

}
