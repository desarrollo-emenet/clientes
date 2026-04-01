import { NgFor, NgIf, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { ClientService } from '../../services/user/clientService';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-service',
  imports: [ReactiveFormsModule, NgIf, NgFor, NgxSonnerToaster, NgClass, FormsModule],
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
  showBannerModal: boolean = false;

  //servicios es un array de cualquier tipo
  servicios: any[] = [];
  //cliente es un objeto con clave numerica (referencia a service->id) y valor de cualquier tipo
  cliente: { [key: number]: any } = {};
  data: any = null;
  private subs: Subscription[] = [];

  constructor(private fb: FormBuilder, private router: Router, private api: ClientService) {
    this.serviceForm = this.fb.group({
      numero_cliente: ['', [Validators.required, Validators.maxLength(6), Validators.pattern('^[0-9]+$')]],
    });
  }

  ngOnInit() {
    this.load();
    this.showBannerModal = true;
  }

  cerrarModal() {
    this.showBannerModal = false;
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  load() {
    this.loading = true;
    const s = this.api.getService().subscribe({
      next: (data) => {
        this.servicios = Array.isArray(data) ? data : (data?.servicios ?? []);
        this.cliente = data?.cliente ?? [];

        this.loading = false;
        //console.log(data);
      },
      error: (e) => {
        this.loading = false;
        console.error('Error cargando servicios', e);
        toast.error('No se pudo obtener servicios');
      }
    });
    this.subs.push(s);
  }

  get numero_cliente() {
    return this.serviceForm.controls['numero_cliente'];
  }

  service() {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      toast.error('Completar los campos requeridos');
      return;
    }

    const raw = this.serviceForm.value;

    //normalizar numero de cliente
    const codigoNormalizado = raw.numero_cliente.trim();
    const payload = {
      numero_cliente: codigoNormalizado,
    };


    this.adding = true;

    const s = this.api.addService(payload).subscribe({
      next: (res) => {
        toast.success('Se envio un correo de verificacion, revisa tu bandeja de entrada');
        //this.serviceForm.reset();
        this.adding = false;
        //this.load();
        this.numeroClienteTemp = payload.numero_cliente;
        this.mostrarConfirmacion = true;
        this.iniciarContador(600);
      },
      error: (e) => {
        this.adding = false;
        //console.error('Error al agregar servicio', e);
        if (e?.status === 0) {
          toast.error('No se pudo conectar al servidor');
        } else if (e?.status === 404) {
          toast.error('Servicio no encontrado');
        } else if (e?.status === 409) {
          toast.error('Servicio ya existente');
        } else if (e?.status === 422) {
          toast.error('Número de cliente inválido');
        } else if (e?.status === 401) {
          toast.error('No autorizado');
          this.router.navigateByUrl('/iniciar-sesion');
        } else if (e?.status === 403) {
          toast.error('Este cliente esta clasificado como baja de servicio');
        } else {
          toast.error('Error inesperado');
        }
      }
    });

    this.subs.push(s);
  }

  confirmarCodigo() {
    if (!this.codigo || this.codigo.length < 6) {
      toast.error('Codigo de verificacion invalido');
      return;
    }
    const payload = {
      numero_cliente: this.numeroClienteTemp,
      codigo: this.codigo
    };

    const s = this.api.confirmarServicio(payload).subscribe({
      next: (res) => {
        toast.success('Servicio agregado correctamente');
        this.mostrarConfirmacion = false;
        this.codigo = '';
        this.numeroClienteTemp = '';
        this.load();
      },
      error: (e) => {
        if (e?.status === 422) {
          toast.error('Codigo de verificacion invalido o expirado');
        } if (e?.status === 400) {
          toast.error('Codigo incorrecto');
        }
        else if (e?.status === 401) {
          toast.error('No autorizado');
          this.router.navigateByUrl('/iniciar-sesion');
        } else {
          toast.error('Error inesperado');
        }
      }
    });
    this.subs.push(s);
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

  //toast con mensaje de eliminar
  eliminarServicio(id: number) {
    toast.warning('¿Eliminar servicio?', {
      description: 'Esta accion no se puede deshacer',
      action: {
        label: 'Eliminar',
        onClick: () => this.eliminar(id),
      },
      cancel: {
        label: 'Cancelar',
      },
    });
  }

  eliminar(id: number) {
    //if (!confirm('¿Eliminar servicio?')) return;
    const s = this.api.deleteService(id).subscribe({
      next: () => {
        toast.success('Eliminado');
        this.load();
      },
      error: (e) => {
        if (e?.status === 409) {
          toast.error('Debes tener minimo un servicio');
        } else {
          toast.error('No se pudo eliminar');
        }
      }
    });
    this.subs.push(s);
  }

  verDetalles(numero: string) {
    this.router.navigate(['/dashboard', numero]);
  }
}
