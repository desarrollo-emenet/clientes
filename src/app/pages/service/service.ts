import { NgFor, NgIf, NgClass, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { ClientService } from '../../services/user/clientService';
import { firstValueFrom, Subscription } from 'rxjs';
import { Header } from '../../shared/header/header';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../../services/utility/http.service';
import { UserService } from '../../services/user/user-service';

@Component({
  selector: 'app-service',
  imports: [ReactiveFormsModule, NgIf, NgFor, NgxSonnerToaster, NgClass, FormsModule, Header, DecimalPipe],
  templateUrl: './service.html',
  styleUrl: './service.css'
})
export class Service implements OnInit, OnDestroy {
  serviceForm!: FormGroup;
  loading = false;
  adding = false;
  mostrarConfirmacion = false;
  codigo: string = '';
  tiempoRestante: number = 0;
  intervalo: any = null;
  numeroClienteTemp: string = '';
  vistaActual: 'tarjetas' | 'lista' = 'tarjetas';
  showBannerModal: boolean = false;
  showAddServiceModal: boolean = false;
  showDeleteModal: boolean = false;
  idParaEliminar: number | null = null;

  countdown = 0;
  protected Math = Math;
  private timerInterval: any;

  //servicios es un array de cualquier tipo
  servicios: any[] = [];
  //cliente es un objeto con clave numerica (referencia a service->id) y valor de cualquier tipo
  cliente: { [key: number]: any } = {};
  data: any = null;
  private subs: Subscription[] = [];

  private readonly MAPA_CLASIFICACIONES: Record<
    string,
    { texto: string; clase: string }
  > = {
      ifo: { texto: 'Fibra Óptica', clase: 'status-badge--success' },
      ina: { texto: 'Inalambrico', clase: 'status-badge--info' },
      baja: { texto: 'Baja', clase: 'status-badge--danger' }
    };

  obtenerDetalleClasificacion(clasificacion: string) {
    const clave = clasificacion?.toLowerCase() || '';
    return (
      this.MAPA_CLASIFICACIONES[clave] || {
        texto: clasificacion || 'Desconocido',
        clase: 'status-badge--neutral'
      }
    );
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return '—';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) {
      return partes[0].substring(0, 2).toUpperCase();
    }
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }


  constructor(private fb: FormBuilder, private router: Router, private api: ClientService, protected http: HttpService, private rateLimit: UserService) {
    this.serviceForm = this.fb.group({
      numero_cliente: ['', [Validators.required, Validators.maxLength(6), Validators.pattern('^[0-9]+$')]],
    });
  }

  ngOnInit() {
    this.load();
    this.showBannerModal = true;

    const id = 'add_service';
    const faltante = this.rateLimit.getFaltante(id);

    if (faltante > 0) {
      this.countdown = faltante;
      this.startCountdown();
    }
  }

  cerrarModal() {
    this.showBannerModal = false;
  }

  cerrarAddServiceModal() {
    this.showAddServiceModal = false;
    this.mostrarConfirmacion = false;
    this.codigo = '';
    this.numeroClienteTemp = '';
    this.serviceForm.controls['numero_cliente'].reset();
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }

  @HostListener('document:keydown.escape')
  manejarTeclaEscape(): void {
    if (this.showBannerModal) {
      this.cerrarModal();
      return;
    }
    if (this.showAddServiceModal) {
      this.cerrarAddServiceModal();
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    clearInterval(this.timerInterval);

  }

  protected async load() {
    if (this.loading) return;

    try {
      this.loading = true;
      const data = await firstValueFrom(this.api.getService());
      this.servicios = Array.isArray(data) ? data : (data?.servicios ?? []);
      this.cliente = data?.cliente ?? [];
    } catch (e) {
      console.error('Error cargando servicios', e);
      toast.error('No se pudo obtener servicios');
    } finally {
      this.loading = false;
    }
  }

  get numero_cliente() {
    return this.serviceForm.controls['numero_cliente'];
  }

  protected async service() {

    if (this.adding) return;
    if (this.serviceForm.invalid) { this.serviceForm.markAllAsTouched(); return; }
    const numeroCliente = this.serviceForm.value.numero_cliente?.trim();

    this.serviceForm.patchValue({
      numero_cliente: numeroCliente
    })

    const id = 'add_service';
    if (!this.rateLimit.enviarCorreo(id)) {

      const intentos = this.rateLimit.getIntentos(id);
      const faltante = this.rateLimit.getFaltante(id);
      if (intentos >= 3 && faltante === 0) {
        toast.warning('Has alcanzado el límite de 3 intentos. Intenta nuevamente mañana.');
        return;
      }
      this.countdown = faltante;
      this.startCountdown();
      return;
    }

    this.countdown = this.rateLimit.registrarIntentos(id);
    this.startCountdown();

    try {
      this.adding = true;

      await firstValueFrom(this.api.addService(this.serviceForm.value));
      this.numeroClienteTemp = numeroCliente;

      this.mostrarConfirmacion = true;
      this.iniciarContador(600);
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al registrar la cuenta');
    } finally {
      this.adding = false;
    }

  }

  private startCountdown(): void {
    clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        clearInterval(this.timerInterval);
        this.countdown = 0;
      }
    }, 1000);
  }

  protected async confirmarCodigo() {
    if (!this.codigo || this.codigo.length < 6) {
      toast.error('Codigo de verificacion invalido');
      return;
    }
    const payload = {
      numero_cliente: this.numeroClienteTemp,
      codigo: this.codigo
    };

    try {
      await firstValueFrom(this.api.confirmarServicio(payload));
      toast.success('Servicio agregado correctamente');
      this.mostrarConfirmacion = false;
      this.codigo = '';
      this.numeroClienteTemp = '';
      this.serviceForm.controls['numero_cliente'].reset();
      this.cerrarAddServiceModal();
      this.load();
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al confirmar el servicio');
    }
  }

  iniciarContador(segundos: number) {
    this.tiempoRestante = segundos;

    if (this.intervalo) {
      clearInterval(this.intervalo);
    }

    this.intervalo = setInterval(() => {
      if (this.tiempoRestante > 0) {
        this.tiempoRestante--;
      } else {
        clearInterval(this.intervalo);
      }
    }, 1000);
  }

  get tiempoFormateado(): string {
    const min = Math.floor(this.tiempoRestante / 60);
    const sec = this.tiempoRestante % 60;

    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  }

  abrirConfirmacionEliminar(id: number) {
    this.idParaEliminar = id;
    this.showDeleteModal = true;
  }

  cerrarConfirmacionEliminar() {
    this.showDeleteModal = false;
    this.idParaEliminar = null;
  }

  protected async confirmarEliminar() {
    if (this.idParaEliminar === null) return;
    const id = this.idParaEliminar;
    this.cerrarConfirmacionEliminar();

    try {
      await firstValueFrom(this.api.deleteService(id));
      toast.success('Servicio eliminado');
      this.load();
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al eliminar el servicio');
    }
  }

  verDetalles(numero: string) {
    this.router.navigate(['/dashboard', numero]);
  }
}
