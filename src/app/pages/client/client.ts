import { Component, OnInit, HostListener } from '@angular/core';
import { CurrencyPipe, NgClass, CommonModule } from '@angular/common';
import { ClientService } from '../../services/user/clientService';
import { RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';
import jsPDF from 'jspdf';
import { PaymentService } from '../../services/pagoralia/paymentService';
import { UserService } from '../../services/user/user-service';
import { HttpErrorResponse } from '@angular/common/http'
import { DomSanitizer } from '@angular/platform-browser';
import { firstValueFrom, map, Observable } from 'rxjs';
import { HttpService } from '../../services/utility/http.service';
import { Preloader } from '../../shared/preloader/preloader';
import { CalculoService } from '../../services/utility/calculo.service';
import { DocPdfService } from '../../services/utility/doc-pdf.service';
import { ObservableService } from '../../services/utility/observable.service';
import { infoCliente } from '../../models/info-cliente';

@Component({
  selector: 'app-client',
  imports: [CurrencyPipe, CommonModule, RouterLink, NgClass, Preloader],
  templateUrl: './client.html',
  styleUrl: './client.css'
})

export class Client implements OnInit {
  infoCliente!: infoCliente;
  servicios: any;
  loading!: boolean;


  loadingPago = false;
  showPagoModal = false;
  ticket: any;
  urlNueva!: any;
  contratados: any;



  constructor(
    private clientS: ClientService,
    private user: UserService,
    private paymentService: PaymentService,
    private http: HttpService,
    protected calculo: CalculoService,
    private sanitizer: DomSanitizer,
    public doc: DocPdfService,
    private observable: ObservableService) { }

  ngOnInit(): void {
    this.loadClientData(this.user.obtenerServicioActivo() ?? '');
  }

  protected async loadClientData(numeroCliente: string): Promise<void> {
    try {
      this.loading = true;
      const { cliente, servicios } = await firstValueFrom(this.clientS.getClientePorNumero(numeroCliente));
      this.infoCliente = cliente;
      this.servicios = servicios;
      this.observable.actualizarObs(cliente, this.calculo.construirNotificaciones(cliente))
      this.contratados = this.calculo.serviciosContratados(servicios, cliente);
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    } finally {
      this.loading = false;
    }
  }

  protected async pagar(): Promise<void> {
    const numeroCliente = this.infoCliente.cliente;
    if (!numeroCliente) return;
    try {
      this.loadingPago = true;
      const res = await firstValueFrom(this.paymentService.crearOrdenPagoralia(numeroCliente));
      if (res.status && res.redirectUrl) {
        window.open(res.redirectUrl, '_blank');
      } else {
        toast.error('No se pudo generar la orden');
      }
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al procesar los datos');
    } finally {
      this.loadingPago = false;
    }
  }

  protected async obtenerTickets(venta: string): Promise<void> {
    this.loading = true;
    try {
      const response = await firstValueFrom(this.clientS.ticket(venta));
      if (response.url) {
        this.urlNueva = this.sanitizer.bypassSecurityTrustResourceUrl(response.url);
      } else {
        toast.error('Error al descargar el ticket');
      }
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al obtener el ticket');
      toast.error('Error al descargar el ticket');
    } finally {
      this.loading = false;
    }
  }

  protected sinAdeudo(): boolean {
    const deudaNumerica = Number(this.infoCliente?.deuda);
    return !isNaN(deudaNumerica) && deudaNumerica === 0 && this.infoCliente?.clasificacion !== 'BAJA';
  }

  descargarTicket(venta: string): void {
    this.obtenerTickets(venta);
  }

  protected cerrarPagoModal() {
    this.showPagoModal = false;
  }

  @HostListener('document:keydown.escape')
  protected manejarTeclaEscape(): void {
    if (this.showPagoModal) {
      this.cerrarPagoModal();
    }
  }

}
