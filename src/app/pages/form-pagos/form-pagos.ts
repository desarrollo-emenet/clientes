import { NgClass, NgIf, NgForOf, DatePipe, CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSonnerToaster, toast } from "ngx-sonner";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom, forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { HttpService } from '../../services/utility/http.service';
import { ClientService } from '../../services/user/clientService';
import { UserService } from '../../services/user/user-service';

import { Pagination } from '../../services/utility/pagination.service';
import { Pago, FiltroPago, ESTADOS_PAGO, FILTROS_PAGO, MENSAJES_FILTRO_PAGO } from './pagos';
import { ContactoService } from '../../services/utility/contacto.service';
import { ObservableService } from '../../services/utility/observable.service';
import { CalculoService } from '../../services/utility/calculo.service';
import { CompressService } from '../../services/utility/compress.service';


@Component({
  selector: 'app-form-pagos',
  imports: [NgxSonnerToaster,
    CommonModule,
    DatePipe,
    NgClass,
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
  loading1 = false;

  archivoSeleccionado!: File;
  selectedFile: File | null = null;

  pagosForm!: FormGroup;
  data: any;
  maxDate = new Date();
  pagos: Pago[] = [];
  baja = false;

  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024;

  activeSection: string = 'formulario';
  pagosAbierto: string | null = null;
  formularioAbierto: string | null = null;

  imagePreview: string | ArrayBuffer | null = null;

  filtroEstado = 'todos';

  readonly filtros: FiltroPago[] = FILTROS_PAGO;
  readonly pagination = new Pagination<Pago>();
  private readonly estados = ESTADOS_PAGO;
  private readonly mensajesFiltro = MENSAJES_FILTRO_PAGO;

  private readonly TIPOS_PERMITIDOS = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];

  constructor(
    private fb: FormBuilder,
    private contactoS: ContactoService,
    private clientS: ClientService,
    private user: UserService,
    private http: HttpService,
    private ObservableService: ObservableService,
    private calculo: CalculoService, private compress: CompressService) { }



  ngOnInit(): void {
    this.crearFormulario();
    const numeroCliente = this.user.obtenerServicioActivo();
    if (!numeroCliente) { return; }
    this.cargarDatos(numeroCliente);
  }

  private crearFormulario(): void {
    this.pagosForm = this.fb.nonNullable.group({
      fechaPago: [null, [Validators.required]],
      numOperacion: [null, [Validators.required, Validators.maxLength(30)]],
      telefono: [null, [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      clave: [null, [Validators.required]],
      comprobante: [null, [Validators.required]],
      monto: [null, [Validators.required, Validators.pattern(/^\d{1,5}$/)]],
    })
  }

  get f() {
    return this.pagosForm.controls;
  }

  private async cargarDatos(numeroCliente: string): Promise<void> {
    try {
      this.loading = true;
      const { cliente, pagos } = await firstValueFrom(
        forkJoin({
          cliente: this.clientS.getClientePorNumero(numeroCliente),
          pagos: this.clientS.resBanco(numeroCliente)
        })
      );
      this.ObservableService.actualizarObs(cliente.cliente, this.calculo.construirNotificaciones(cliente.cliente), cliente.servicios);
      this.data = cliente.cliente;
      this.pagos = pagos.pagos;

      this.cargarTelefono();
      this.actualizarPaginacion();
      this.verificarEstadoCliente();

    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    } finally {
      this.loading = false;
    }
  }

  private verificarEstadoCliente(): void {
    this.baja = this.data.clasificacion === 'BAJA';
    if (this.baja) { this.pagosForm.disable(); }
    else { this.pagosForm.enable(); }
  }

  private cargarTelefono(): void {
    const telefono =
      this.data.telefono
        ?.replace(/\s/g, '')
        .substring(0, 10) ?? '';
    this.pagosForm.patchValue({ telefono });
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

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileChange(event: any) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) { this.processFile(file); }
  }

  onDrop(event: DragEvent) {
    event.preventDefault(); event.stopPropagation();
    const file = event.dataTransfer?.files?.[0];
    if (file) { this.processFile(file); }
  }

  private async processFile(file: File) {

    if (!this.TIPOS_PERMITIDOS.includes(file.type)) {
      toast.error('Tipo de archivo no permitido.');
      return;
    }
    const compressedFile = await this.compress.compressImage(file);

    if (compressedFile.size > this.MAX_FILE_SIZE) {
      toast.error('El archivo no debe superar los 2 MB');
      return;
    }

    this.archivoSeleccionado = compressedFile;
    this.selectedFile = compressedFile;

    if (compressedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result;
      reader.readAsDataURL(compressedFile);
    } else {
      this.imagePreview = 'assets/img/pdf.webp';
    }

    this.pagosForm.patchValue({
      comprobante: compressedFile
    });
    this.pagosForm.get('comprobante')?.updateValueAndValidity();
  }

  protected async enviarPago(): Promise<void> {

    /*Object.keys(this.pagosForm.controls).forEach(key => {
      const controlErrors = this.pagosForm.get(key)?.errors;

      if (controlErrors) {
        console.log('Campo:', key, 'Errores:', controlErrors);
      }
    });*/

    if (this.pagosForm.invalid) { this.pagosForm.markAllAsDirty(); return; }
    this.loading1 = true;
    this.limpiarErroresBackend();

    try {
      await firstValueFrom(this.clientS.pagosBanco(this.crearFormData()));
      toast.success('Datos enviados');
      this.pagosForm.reset();
    } catch (error) {
      const httpError = error as HttpErrorResponse;
      this.http.errorHttp(httpError, 'Error al enviar los datos');
    } finally {
      this.loading1 = false;
    }

  }


  private crearFormData(): FormData {
    const raw = this.pagosForm.getRawValue();
    const formData = new FormData();
    const cliente = this.data.cliente ?? '';
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
        //console.log(control);
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


  //evitar recarga de elementos repetidos
  trackByPago(index: number, pago: any): number {
    return pago.id;
  }

  getEstadoConfig(estado: string) {
    return this.estados[estado] ?? {
      texto: 'Desconocido',
      clase: 'desconocido',
      icono: 'fa-circle-question'
    };
  }

  contarEstado(estado: string): number {
    if (estado === 'todos') {
      return this.pagos.length;
    }
    const estadosRegistrados = ['2', '3'];
    return this.pagos.filter(p => estado === 'registrado'
      ? estadosRegistrados.includes(p.estado)
      : p.estado === estado).length;
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

  get mensajeFiltro(): string {
    return this.mensajesFiltro[this.filtroEstado] ?? 'No se encontraron pagos.';
  }

  cambiarFiltro(estado: string): void {
    this.filtroEstado = estado;
    this.actualizarPaginacion();
  }

  private actualizarPaginacion(): void {
    this.pagination.setItems(this.pagosFiltrados);
  }

  //paginacion
  get pagosPaginados(): Pago[] {
    return this.pagination.paginatedItems;
  }

  soloNumeros(event: Event, controlName: string, maxLength: number): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value.replace(/\D/g, '').slice(0, maxLength);
    input.value = valor;
    this.pagosForm.get(controlName)?.setValue(valor, { emitEvent: false });
  }

  contactarSoporte(): void {
    this.contactoS.contactSupport(
      '5217131334557',
      'Hola, mi servicio se encuentra dado de baja y quisiera recibir información para reactivarlo.'
    );
  }
}
