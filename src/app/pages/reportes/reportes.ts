import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '../../services/utility/http.service';
import { ClientService } from '../../services/user/clientService';
import { CalculoService } from '../../services/utility/calculo.service';
import { ObservableService } from '../../services/utility/observable.service';
import { UserService } from '../../services/user/user-service';
import { Preloader } from '../../shared/preloader/preloader';
import { NgIf } from '@angular/common';
import { infoCliente } from '../../models/info-cliente';
import { toast } from 'ngx-sonner';
import { CompressService } from '../../services/utility/compress.service';
import { FormGroup } from '@angular/forms';
import { LoginS } from '../../services/auth/login';


@Component({
  selector: 'app-reportes',
  imports: [RouterLink, Preloader, NgIf],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes {

  infoCliente!: infoCliente;
  loading = false;
  processingFile = false;
  isDragging = false;

  reporteForm!: FormGroup;


  archivoSeleccionado: File | null = null;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024;

  private readonly TIPOS_PERMITIDOS = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];

  constructor(
    private user: UserService,
    private clientS: ClientService,
    private calculo: CalculoService,
    protected http: HttpService,
    private ObservableService: ObservableService,
    private compress: CompressService,
    protected auth: LoginS
  ) { }


  async ngOnInit(): Promise<void> {
    const numeroCliente = this.user.obtenerServicioActivo();
    if (!numeroCliente) {
      console.error('No se encontró el número de cliente activo.');
      return;
    }
    await this.loadClientData(numeroCliente);
  }

  protected async loadClientData(numeroCliente: string): Promise<void> {
    this.loading = true;
    try {
      const { cliente, servicios } = await firstValueFrom(this.clientS.getClientePorNumeroActualizado(numeroCliente));
      this.infoCliente = cliente;
      this.establecerProblemaInicial(cliente);
      this.ObservableService.actualizarObs(cliente, this.calculo.construirNotificaciones(cliente), servicios);
      console.log('Datos del cliente cargados correctamente:', cliente, servicios);
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    } finally {
      this.loading = false;
    }
  }


  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;

  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

  }

  onFileChange(event: any) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) { this.processFile(file); }
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const file = event.dataTransfer?.files?.[0];
    if (!file) { return; }
    this.processFile(file);
  }

  private async processFile(file: File): Promise<void> {

    if (!this.TIPOS_PERMITIDOS.includes(file.type)) {
      toast.error('Tipo de archivo no permitido.');
      return;
    }
    this.processingFile = true;


    try {
      let compressedFile = file;

      if (file.type.startsWith('image/')) {
        compressedFile = await this.compress.compressImage(file);
      }

      if (compressedFile.size > this.MAX_FILE_SIZE) {
        toast.error('El archivo no debe superar los 2 MB');
        return;
      }

      this.archivoSeleccionado = compressedFile;
      this.selectedFile = compressedFile;

      if (compressedFile.type.startsWith('image/')) {
        this.imagePreview = await this.generatePreview(compressedFile);
      } else {
        this.imagePreview = 'assets/img/pdf.webp';
      }

    } catch (error) {
      console.error('Error al procesar archivo:', error);
      toast.error('No fue posible procesar el archivo.');
    } finally {
      this.processingFile = false;
    }

    /*const comprobanteControl = this.reporteForm.get('comprobante');

    comprobanteControl?.setValue(compressedFile);
    comprobanteControl?.markAsDirty();
    comprobanteControl?.markAsTouched();
    comprobanteControl?.updateValueAndValidity();*/
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
    this.selectedFile = null;
    this.imagePreview = null;
    this.processingFile = false;
  }



  problemaSeleccionado: string = '';

  descripcion = '';

  readonly problemas = [
    {
      id: 'internet_lento',
      nombre: 'Internet lento',
      descripcion: 'Mi conexión es más lenta de lo normal.',
      icono: 'fa-gauge-high'
    },
    {
      id: 'wifi',
      nombre: 'Problemas con WiFi',
      descripcion: 'Tengo problemas para conectarme a mi red inalámbrica.',
      icono: 'fa-router'
    },
    {
      id: 'sin_internet',
      nombre: 'Sin internet',
      descripcion: 'No tengo conexión a internet.',
      icono: 'fa-wifi'
    },
    {
      id: 'conexion',
      nombre: 'Problema de conexión',
      descripcion: 'Mi conexión se interrumpe constantemente.',
      icono: 'fa-plug'
    },
    {
      id: 'equipos',
      nombre: 'Problemas con equipos',
      descripcion: 'Tengo problemas con mi módem o dispositivos.',
      icono: 'fa-computer'
    },
    {
      id: 'otro',
      nombre: 'Otro problema',
      descripcion: 'Tengo una situación diferente.',
      icono: 'fa-circle-question'
    }
  ];

  seleccionarProblema(id: string): void {
    this.problemaSeleccionado = id;
  }


  
private establecerProblemaInicial(cliente: infoCliente): void {
  const clasificacion = cliente.clasificacion?.toUpperCase();
  const estado = cliente.infoRed?.estado?.toLowerCase();
  const estadoFibra = cliente.infoRed?.estadoFibra?.toLowerCase();

  if (clasificacion === 'INA') {
    this.problemaSeleccionado = 'internet_lento';
    return;
  }

  if (estado !== 'activo') {
    this.problemaSeleccionado = '';
    return;
  }

  switch (estadoFibra) {
    case 'waiting':
      this.problemaSeleccionado = 'sin_internet';
      break;

    case 'bound':
      this.problemaSeleccionado = 'internet_lento';
      break;

    default:
      this.problemaSeleccionado = 'otro';
      break;
  }
}

actualizarDescripcion(event: Event): void {
  this.descripcion = (event.target as HTMLTextAreaElement).value;
}


get servicioSuspendido(): boolean {
  return this.infoCliente?.infoRed.estado?.toLowerCase() === 'suspendido';
}

get puedeReportar(): boolean {
  if (!this.infoCliente || this.servicioSuspendido) {
    return false;
  }

  const clasificacion = this.infoCliente.clasificacion.toUpperCase();
  const estado = this.infoCliente.infoRed.estado?.toLowerCase();

  if (clasificacion === 'INA') {
    return true;
  }

  return estado === 'activo';
}

}
