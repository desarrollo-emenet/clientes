import { NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CalculoService } from '../../services/utility/calculo.service';
import { ObservableService } from '../../services/utility/observable.service';
import { HttpService } from '../../services/utility/http.service';
import { ClientService } from '../../services/user/clientService';
import { UserService } from '../../services/user/user-service';

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_PASO = 0.05;

@Component({
  selector: 'app-faq',
  imports: [NgClass],
  templateUrl: './faq.html',
  styleUrl: './faq.css'
})
export class FAQ {

  activeSection: string = 'ayuda';
  activeView: string = 'puertos';
  modalAbierto: boolean = false;
  imagenModal: string = '';
  nivelZoom: number = 1;
  anchoNatural: number = 0;
  altoNatural: number = 0;
  helpAbierto: string | null = null;
  faqAbierto: string | null = null;
  itemAbierto: string | null = null;

  showSection(id: string): void {
    this.activeSection = id;
    this.helpAbierto = null;
    this.faqAbierto = null;
    this.itemAbierto = null;
  }

  constructor(
      private user: UserService,
      private clientS: ClientService, private calculo: CalculoService,
     protected http: HttpService, private ObservableService: ObservableService) { }

  async ngOnInit(): Promise<void> {
    const numeroCliente = this.user.obtenerServicioActivo();
    this.ObservableService.cliente$.subscribe((info: any) => {
      if(!info.cliente) this.loadClientData(numeroCliente ?? '');
    });
  }

  protected async loadClientData(numeroCliente: string): Promise<void> {
    try {
      const { cliente, servicios } = await firstValueFrom(this.clientS.getClientePorNumero(numeroCliente));
      this.ObservableService.actualizarObs(cliente, this.calculo.construirNotificaciones(cliente), servicios);
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    } finally {
    }
  }

  showView(id: string): void {
    this.activeView = id;
  }

  toggleHelp(id: string): void {
    this.helpAbierto = this.helpAbierto === id ? null : id;
  }

  toggleFaq(id: string): void {
    this.faqAbierto = this.faqAbierto === id ? null : id;
    this.itemAbierto = null;
  }

  toggleItem(id: string): void {
    this.itemAbierto = this.itemAbierto === id ? null : id;
  }

  abrirModal(src: string): void {
    this.imagenModal = src;
    this.nivelZoom = 1;
    this.anchoNatural = 0;
    this.altoNatural = 0;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.imagenModal = '';
    this.nivelZoom = 1;
  }

  acercar(): void {
    this.nivelZoom = Math.min(
      this.nivelZoom + ZOOM_PASO, ZOOM_MAX
    );
  }

  alejar(): void {
    this.nivelZoom = Math.max(
      this.nivelZoom - ZOOM_PASO, ZOOM_MIN
    );
  }

  get nivelZoomPorcentaje(): number {
    return Math.round(this.nivelZoom * 100);
  }

  capturarDimensiones(evento: Event): void {
    const img = evento.target as HTMLImageElement;
    const rect = img.getBoundingClientRect();
    this.anchoNatural = rect.width;
    this.altoNatural = rect.height;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalAbierto) this.cerrarModal();
  }
}
