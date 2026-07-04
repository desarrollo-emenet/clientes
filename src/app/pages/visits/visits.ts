import { NgClass, NgIf, NgForOf, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { UserService } from '../../services/user/user-service';
import { toast } from 'ngx-sonner';
import { Router } from '@angular/router';
import { ClientService } from '../../services/user/clientService';

interface Visitas {
  id: number;
  problema: string;
  detalle: string;
  diagnostico: string;
  solucion: string;
  estado: number;
  created_at: string;
  agendaFecha: string;
  atencionFecha: string;
  usuarioAgendado: string;
  usuarioProceso: string;
  usarioAtencion: string;
}

interface EstadoConfig {
  texto: string;
  clase: string;
  icono: string;
}


@Component({
  selector: 'app-visits',
  imports: [NgClass, NgIf, NgForOf, DatePipe],
  templateUrl: './visits.html',
  styleUrl: './visits.css'
})
export class Visits {

  loading = false;
  data: any;
  visitas: Visitas[] = [];
  visitaSeleccionada: Visitas | null = null;

  filtroEstado = -1;
  elementosPorPagina = 10;
  paginaActual = 1;

  readonly filtros = [
    { value: -1, label: 'Todas' },
    { value: 0, label: 'Agendadas' },
    { value: 1, label: 'Pendientes' },
    { value: 2, label: 'En atención' },
    { value: 3, label: 'Finalizadas' }
  ];

  private readonly estados: Record<number, EstadoConfig> = {

    0: {
      texto: 'Agendado',
      clase: 'agendado',
      icono: 'fa-calendar-check'
    },
    1: {
      texto: 'Pendiente',
      clase: 'pendiente',
      icono: 'fa-clock'
    },
    2: {
      texto: 'En atención',
      clase: 'proceso',
      icono: 'fa-screwdriver-wrench'
    },
    3: {
      texto: 'Finalizado',
      clase: 'finalizado',
      icono: 'fa-check'
    }
  };




  constructor(
    private user: UserService,
    private clientS: ClientService,
    private router: Router) { }

  ngOnInit(): void {
    const numeroCliente = this.user.obtenerServicioActivo();
    if (!numeroCliente) return;
    this.loadClientData(numeroCliente);
  }

  loadClientData(numeroCliente : string): void {
    this.loading = true;    
    this.clientS.getClientePorNumero(numeroCliente).subscribe({
      next: cliente => {
        this.obtenerVisitas(cliente.numero_cliente);
      },
      error: (e) => this.manejoError(e)
    });
  }

  private obtenerVisitas(cliente: string): void {
    this.clientS.visitas(cliente).subscribe({
      next: ({ visitas }) => {
        this.visitas = visitas ?? [];
        this.loading = false;
      },
      error: e => this.manejoError(e)
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

  getEstadoConfig(estado: number) {
    return this.estados[estado] ?? {
      texto: 'Desconocido',
      clase: 'desconocido',
      icono: 'fa-circle-question'
    };
  }

  abrirDetalle(visita: Visitas): void {
    this.visitaSeleccionada = visita;
  }


  trackByVisitas(index: number, visita: Visitas): number {
    return visita.id;
  }


  cambiarFiltro(estado: number): void {
    this.filtroEstado = estado;
    this.paginaActual = 1;
  }

  contarEstado(estado: number): number {
    return estado === -1
      ? this.visitas.length
      : this.visitas.filter(v => v.estado === estado).length;
  }

  get visitasFiltradas(): Visitas[] {
    if (this.filtroEstado === -1) {
      return this.visitas;
    }
    return this.visitas.filter(v => v.estado === this.filtroEstado);
  }

  get visitasPaginadas(): Visitas[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.visitasFiltradas.slice(
      inicio,
      inicio + this.elementosPorPagina
    );
  }

  get totalPaginas(): number {
    return Math.max(
      1,
      Math.ceil(
        this.visitasFiltradas.length /
        this.elementosPorPagina
      )
    );

  }

  get paginas(): number[] {
    return Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }
    this.paginaActual = pagina;
  }

  get mensajeFiltro(): string {
    const mensajes: Record<number, string> = {
      0: 'No existen visitas agendadas.',
      1: 'No existen visitas pendientes.',
      2: 'No existen visitas en atención.',
      3: 'No existen visitas finalizadas.'
    };

    return mensajes[this.filtroEstado] ??
      'No existen visitas registradas.';
  }

}
