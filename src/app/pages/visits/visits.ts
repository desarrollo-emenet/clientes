import { NgClass, NgIf, NgForOf, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { UserService } from '../../services/user/user-service';
import { toast } from 'ngx-sonner';
import { ActivatedRoute, Router } from '@angular/router';
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
  filtroEstado = -1;

  elementosPorPagina = 2;
  paginaActual = 1;

  filtros = [
  { value: -1, label: 'Todas' },
  { value: 0, label: 'Agendadas' },
  { value: 1, label: 'Pendientes' },
  { value: 3, label: 'En atención' },
  { value: 2, label: 'Finalizadas' }
  ];

  private readonly estadoConfig: Record<string, {
    texto: string;
    clase: string;
    icono: string;
  }> = {
      '0': {
        texto: 'Agendado',
        clase: 'agendado',
        icono: 'fa-calendar-check'
      },
      '1': {
        texto: 'Pendiente',
        clase: 'pendiente',
        icono: 'fa-clock'
      },
      '2': {
        texto: 'Finalizado',
        clase: 'finalizado',
        icono: 'fa-check'
      },
      '3': {
        texto: 'En atención',
        clase: 'proceso',
        icono: 'fa-screwdriver-wrench'
      }
    };


  constructor(
    private user: UserService,
    private route: ActivatedRoute,
    private clientS: ClientService,
    private router: Router) { }

  ngOnInit(): void {
    this.user.obtenerUsuarioAutenticado(this.route).subscribe({
      next: (numeroCliente) => {
        if (!numeroCliente) return;
        this.loadClientData(numeroCliente);
      },
      error: (e) => {
        console.error('Error al obtener usuario autenticado', e);
        toast.error('Error al obtener información del usuario');
      }
    });
  }

  loadClientData(numeroCliente: string): void {
    this.loading = true;
    //this.data = null;

    this.clientS.getClientePorNumero(numeroCliente).subscribe({
      next: res => {
        this.data = res,
          this.loading = false;
        this.respuestaVisitas();

      },
      error: (e) => this.manejoError(e)
    });
  }

  respuestaVisitas() {
    const cliente = this.data?.numero_cliente;
    if (!cliente) {
      console.error('No existe número de cliente');
      return;
    }
    //this.loading = true;
    this.clientS.visitas(cliente).subscribe({
      next: ({ visitas }) => {
        this.visitas = visitas ?? [];
        //this.loading = false;
      },
      error: (err) => {
        //this.loading = false;
        console.error(err);
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


  

  getEstadoConfig(estado: number) {
    return this.estadoConfig[estado] ?? {
      texto: 'Desconocido',
      clase: 'desconocido',
      icono: 'fa-circle-question'
    };
  }


  trackByVisitas(index: number, visita: any): number {
    return visita.id;
  }

  visitaSeleccionada: Visitas | null = null;

  abrirDetalle(visita: any) {
    this.visitaSeleccionada = visita;
  }


// Filtros

get visitasFiltradas(): Visitas[] {
  if (this.filtroEstado === -1) {
    return this.visitas;
  }
  return this.visitas.filter(
    visita => visita.estado === this.filtroEstado
  );
}

cambiarFiltro(estado: number): void {
  this.filtroEstado = estado
  this.paginaActual = 1;
}

contarEstado(estado: number): number {
  if (estado === -1) {
    return this.visitas.length;
  }
  return this.visitas.filter(
    visita => visita.estado === estado
  ).length;
}

// paginacion

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
    Math.ceil(this.visitasFiltradas.length / this.elementosPorPagina)
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
