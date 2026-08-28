import { NgClass, NgIf, NgForOf, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { UserService } from '../../services/user/user-service';
import { ClientService } from '../../services/user/clientService';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../../services/utility/http.service';
import { EstadoConfig, Visitas, estado_visitas, filtros_visitas } from './serviceVisit';
import { Pagination } from '../../services/utility/pagination.service';


@Component({
  selector: 'app-visits',
  imports: [NgClass, NgIf, NgForOf, DatePipe],
  templateUrl: './visits.html',
  styleUrl: './visits.css'
})
export class Visits {

  loading = false;
  visitas: Visitas[] = [];
  visitaSeleccionada: Visitas | null = null;

  filtroEstado = -1;

  readonly filtros = filtros_visitas;
  private readonly estados = estado_visitas;
  readonly pagination = new Pagination<Visitas>();

  constructor(
    private user: UserService,
    private clientS: ClientService,
   protected http: HttpService) { }

  async ngOnInit(): Promise<void> {
    const numeroCliente = this.user.obtenerServicioActivo();
    if (!numeroCliente) return;
    await this.obtenerVisitas(numeroCliente);
  }

  protected async obtenerVisitas(numeroCliente: string): Promise<void> {
    try {
      const { visitas } = await firstValueFrom(this.clientS.visitas(numeroCliente));
      this. visitas = visitas ?? [];
      this.actualizarPaginacion();
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al obtener visitas')      
    }
  }

  getEstadoConfig(estado: number): EstadoConfig {
    return this.estados[estado] ?? {
      texto: 'Desconocido',
      clase: 'desconocido',
      icono: 'fa-circle-question'
    };
  }

  getTecnicoAsignado(visita: any): string {
  const tecnicos: Record<number, string | undefined> = {
    0: visita.usarioAgendado,
    2: visita.usarioProceso,
    3: visita.usarioAtencion
  };  
  return tecnicos[visita.estado] || 'Sin asignar';
}

  abrirDetalle(visita: Visitas): void {
    this.visitaSeleccionada = visita;
  }

  trackByVisitas(index: number, visita: Visitas): number {
    return visita.id;
  }

  cambiarFiltro(estado: number): void {
    this.filtroEstado = estado;
    this.pagination.reset();
    this.actualizarPaginacion();
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

  private actualizarPaginacion(): void {
    this.pagination.setItems(
      this.visitasFiltradas
    );
  }

  get visitasPaginadas(): Visitas[] {
    return this.pagination.paginatedItems;
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
