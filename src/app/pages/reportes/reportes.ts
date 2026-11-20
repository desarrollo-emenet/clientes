import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { firstValueFrom } from 'rxjs';
import { CompressService } from '../../services/utility/compress.service';
import { LoginS } from '../../services/auth/login';
import { HttpService } from '../../services/utility/http.service';
import { ClientService } from '../../services/user/clientService';
import { CalculoService } from '../../services/utility/calculo.service';
import { ObservableService } from '../../services/utility/observable.service';
import { UserService } from '../../services/user/user-service';
import { Preloader } from '../../shared/preloader/preloader';
import { infoCliente } from '../../models/info-cliente';
import { toast } from 'ngx-sonner';


@Component({
  selector: 'app-reportes',
  imports: [RouterLink, Preloader, NgIf, ReactiveFormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes {

  infoCliente!: infoCliente;
  reportForm!: FormGroup;

  loading = false;
  processingFile = false;
  isDragging = false;
  loadingReporte = false;

  archivoSeleccionado: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024;

  private readonly TIPOS_PERMITIDOS = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];

  readonly problemas = [
    { id: 'internet_lento', nombre: 'Internet lento', icono: 'fa-gauge-high' },
    { id: 'wifi', nombre: 'Problemas con WiFi', icono: 'fa-router' },
    { id: 'sin_internet', nombre: 'Sin internet', icono: 'fa-wifi' },
    { id: 'conexion', nombre: 'Problema de conexión', icono: 'fa-plug' },
    { id: 'equipos', nombre: 'Problemas con equipos', icono: 'fa-computer' },
    { id: 'otro', nombre: 'Otro problema', icono: 'fa-circle-question' }
  ];

  constructor(
    private fb: FormBuilder,
    private user: UserService,
    private clientS: ClientService,
    private calculo: CalculoService,
    protected http: HttpService,
    private ObservableService: ObservableService,
    private compress: CompressService,
    protected auth: LoginS
  ) { }


  async ngOnInit(): Promise<void> {
    this.crearFormulario();
    const numeroCliente = this.user.obtenerServicioActivo();
    if (!numeroCliente) {
      console.error('No se encontró el número de cliente activo.');
      return;
    }
    await this.loadClientData(numeroCliente);
  }

  private crearFormulario(): void {
    this.reportForm = this.fb.group({
      cliente: ['', Validators.required],
      problema: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
      evidencia: [null as File | null]
    });
  }

  get f() { return this.reportForm.controls; }


  protected async loadClientData(numeroCliente: string): Promise<void> {
    this.loading = true;
    try {
      const { cliente, servicios } = await firstValueFrom(this.clientS.getClientePorNumeroActualizado(numeroCliente));
      this.infoCliente = cliente;
      this.reportForm.patchValue({
        cliente: cliente.cliente,
        problema: this.obtenerProblemaInicial(cliente)
      });
      this.ObservableService.actualizarObs(cliente, this.calculo.construirNotificaciones(cliente), servicios);
      //console.log('Datos del cliente cargados correctamente:', cliente, servicios);
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    } finally {
      this.loading = false;
    }
  }

  get servicioSuspendido(): boolean {
    return this.infoCliente?.infoRed.estado?.toLowerCase() === 'suspendido';
  }

  get puedeReportar(): boolean {
    if (!this.infoCliente || this.servicioSuspendido) { return false; }
    const clasificacion = this.infoCliente.clasificacion.toUpperCase();
    const estado = this.infoCliente.infoRed.estado?.toLowerCase();
    return clasificacion === 'INA' || estado === 'activo';
  }

  seleccionarProblema(id: string): void {
    const control = this.f['problema'];
    control.setValue(id);
    control.markAsTouched();
  }

  private obtenerProblemaInicial(cliente: infoCliente): string {

    const clasificacion = cliente.clasificacion?.toUpperCase();
    const estado = cliente.infoRed?.estado?.toLowerCase();
    const estadoFibra = cliente.infoRed?.estadoFibra?.toLowerCase();
    if (clasificacion === 'INA') { return 'internet_lento'; }
    if (estado !== 'activo') { return ''; }

    switch (estadoFibra) {
      case 'waiting':
        return 'sin_internet';
      case 'bound':
        return 'internet_lento';
      default:
        return 'otro';
    }
  }

  private async processFile(file: File): Promise<void> {
    if (this.processingFile) { return; }

    if (!this.TIPOS_PERMITIDOS.includes(file.type)) {
      toast.error('Tipo de archivo no permitido.');
      return;
    }
    this.processingFile = true;

    try {
      const archivo = file.type.startsWith('image/')
        ? await this.compress.compressImage(file)
        : file;

      if (archivo.size > this.MAX_FILE_SIZE) {
        toast.error('El archivo no debe superar los 2 MB.');
        return;
      }

      this.archivoSeleccionado = archivo;
      //this.selectedFile = archivo;

      this.imagePreview = archivo.type.startsWith('image/')
        ? await this.generatePreview(archivo)
        : 'assets/img/pdf.webp';

      const evidenciaControl = this.reportForm.get('evidencia');

      evidenciaControl?.setValue(archivo);
      evidenciaControl?.markAsDirty();
      evidenciaControl?.markAsTouched();
      evidenciaControl?.updateValueAndValidity();

    } catch (error) {
      console.error('Error al procesar archivo:', error);
      toast.error('No fue posible procesar el archivo.');
    } finally {
      this.processingFile = false;
    }
  }

  private generatePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);

      reader.readAsDataURL(file);
    });
  }

  eliminarArchivo(): void {
    this.archivoSeleccionado = null;
    this.imagePreview = null;
    this.f['evidencia']?.reset(null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) { this.processFile(file); }
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (!file) { return; }
    this.processFile(file);
  }

  enviarReporte(): void {
    if (!this.puedeReportar) {
      toast.error('No puedes enviar un reporte en este momento.');
      return;
    }

    if (this.processingFile) {
      toast.warning('Espera a que termine de procesarse el archivo.');
      return;
    }
    if (this.reportForm.invalid) { this.reportForm.markAllAsDirty(); this.reportForm.markAllAsDirty(); return; }

    this.loadingReporte = true;

    try {
      const formData = this.crearFormData();

      console.log('Datos enviados:');
      formData.forEach((value, key) => { console.log(key, value); });
      //api al back
      this.limpiarFormulario();
    } catch (error) {
      console.error('Error al enviar el reporte:', error);
    } finally {
      this.loadingReporte = false;
    }
  }

  private crearFormData(): FormData {
    const raw = this.reportForm.getRawValue();
    const formData = new FormData();
    //const cliente = this.infoCliente?.cliente ?? '';

    //const formData = new FormData();
    formData.append('cliente', raw.cliente);
    formData.append('problema', raw.problema);
    formData.append('descripcion', raw.descripcion);
    if (this.archivoSeleccionado) {
      formData.append('evidencia', this.archivoSeleccionado);
    }
    return formData;
  }

  private limpiarArchivo(): void {
    this.archivoSeleccionado = null;
    this.imagePreview = null;
    this.processingFile = false;
    this.isDragging = false;
  }

  limpiarFormulario(): void {
    this.reportForm.reset({
      cliente: this.infoCliente?.cliente ?? '',
      problema: this.infoCliente
        ? this.obtenerProblemaInicial(this.infoCliente)
        : '',
      descripcion: '',
      evidencia: null
    });

    this.limpiarArchivo();
  }

  cancelarReporte(): void {
    this.reportForm.reset({
      cliente: this.infoCliente?.cliente ?? '',
      problema: this.infoCliente
        ? this.obtenerProblemaInicial(this.infoCliente)
        : '',
      descripcion: '',
      evidencia: null
    });

    this.limpiarArchivo();
  }


  /*  debugFormulario(): void {
    console.log('Estado general:', this.reportForm.status);
    console.log('Formulario válido:', this.reportForm.valid);
    console.log('Valores:', this.reportForm.value);
  
    Object.entries(this.reportForm.controls).forEach(([nombre, control]) => {
      console.log(`${nombre}:`, {
        value: control.value,
        status: control.status,
        errors: control.errors,
        touched: control.touched,
        dirty: control.dirty
      });
    });*/
}

