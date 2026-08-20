import { Component, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
import {  RouterLink } from '@angular/router';
import { CurrencyPipe, NgIf, DOCUMENT } from '@angular/common';
import { ClientService } from '../../services/user/clientService';
import { NgxSonnerToaster, toast } from "ngx-sonner";
import { firstValueFrom } from 'rxjs';
import { UserService } from '../../services/user/user-service';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../../services/utility/http.service';
import { ContactoService } from '../../services/utility/contacto.service';
import { CalculoService } from '../../services/utility/calculo.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, NgIf, NgxSonnerToaster, CurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  mostrarMensaje!: boolean;
  infoCliente: any;
  loading!: boolean;
  servicios: any;

  constructor(
    private clientS: ClientService,
    private http: HttpService,
    private user: UserService,
    protected contactoService: ContactoService,
    protected calculo: CalculoService,
    // private renderer: Renderer2,
    // @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void {
    // this.initViewportListeners();
    const numeroCliente = this.user.obtenerServicioActivo();
    if (!numeroCliente) return;
    this.loadClientData(numeroCliente);
  }

  protected async loadClientData(numeroCliente: string): Promise<void> {
    try {
      this.loading = true;
      const { cliente, servicios } = await firstValueFrom(this.clientS.getClientePorNumero(numeroCliente));
      this.infoCliente = cliente;
      this.servicios = servicios;
      if (this.infoCliente.clasificacion === 'BAJA') this.mostrarMensaje = true;
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    }finally{
      this.loading = false;
    }
  }

  protected irAContratar() {
    window.open('https://emenet.mx/planes', '_blank');
  }

  protected copiarAlPortapapeles(texto: string): void {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      toast.dismiss();
      toast.success('Copiado al portapapeles');
    }).catch(() => {
      toast.dismiss();
      toast.error('No se pudo copiar');
    });
  }

  getSaludo(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {return 'Buenos días';}
    if (hour >= 12 && hour < 19) {return 'Buenas tardes';}
    return 'Buenas noches';
  }

  getMesPagoReciente(): string {
    const estadoCuenta = this.servicios.estadoCuenta;
    if (estadoCuenta && estadoCuenta.length > 0) {
      return estadoCuenta[estadoCuenta.length - 1].mensualidad;
    }
    return 'N/A';
  }

  // private viewportListeners: (() => void)[] = [];
  // ngOnDestroy(): void {
  //   this.viewportListeners.forEach(removeListener => removeListener());
  // }

  // private setAppVh(): void {
  //   try {
  //     const visualViewport = (window as any).visualViewport;
  //     const viewportHeight = visualViewport?.height || window.innerHeight;
  //     const vh = Number(viewportHeight) * 0.01;
  //     this.renderer.setStyle(this.document.documentElement, '--app-vh', `${vh}px`);
  //   } catch (_) {
  //     // Silently fail
  //   }
  // }

  // private initViewportListeners(): void {
  //   this.setAppVh();

  //   // VisualViewport listeners (móviles modernos)
  //   try {
  //     const visualViewport = (window as any).visualViewport;
  //     if (visualViewport) {
  //       const resizeListener = this.renderer.listen(visualViewport, 'resize', () => this.setAppVh());
  //       const scrollListener = this.renderer.listen(visualViewport, 'scroll', () => this.setAppVh());
  //       this.viewportListeners.push(resizeListener, scrollListener);
  //     }
  //   } catch (_) {
  //     // Silently fail
  //   }

  //   // Window listeners (fallback y desktop)
  //   const windowResizeListener = this.renderer.listen(window, 'resize', () => this.setAppVh());
  //   const orientationListener = this.renderer.listen(window, 'orientationchange', () => this.setAppVh());
  //   this.viewportListeners.push(windowResizeListener, orientationListener);
  // }
}
