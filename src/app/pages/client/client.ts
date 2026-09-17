import { Component, OnInit, HostListener } from '@angular/core';
import { CurrencyPipe, NgClass, CommonModule } from '@angular/common';
import { ClientService } from '../../services/user/clientService';
import { RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';
import { PaymentService } from '../../services/pagoralia/paymentService';
import { UserService } from '../../services/user/user-service';
import { HttpErrorResponse } from '@angular/common/http'
import { DomSanitizer } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '../../services/utility/http.service';
import { Preloader } from '../../shared/preloader/preloader';
import { CalculoService } from '../../services/utility/calculo.service';
import { ObservableService } from '../../services/utility/observable.service';
import { infoCliente } from '../../models/info-cliente';
import { FormService } from '../../services/pagoralia/form.service';

import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

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
    protected FormPago: FormService,
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
      this.observable.actualizarObs(cliente, this.calculo.construirNotificaciones(cliente), servicios)
      this.contratados = this.calculo.serviciosContratados(servicios, cliente);
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    } finally {
      this.loading = false;
    }
  }

  protected async informePdf() {
    const numeroCliente = this.user.obtenerServicioActivo();
    if (!numeroCliente) return;

    this.loading = true

    try {
      const urlPdf = await firstValueFrom(this.clientS.obtenerLink(numeroCliente));

      if (urlPdf.url) {
        const blob = await firstValueFrom(this.clientS.informePdf(urlPdf.url));

        const nombreArchivo = `informe_${numeroCliente}.pdf`;

        if (Capacitor.isNativePlatform()) {
          await new Promise<void>((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(blob);

            fileReader.onloadend = async () => {
              try {
                const base64data = fileReader.result as string;
                const base64Limpio = base64data.split(',')[1];

                const archivoGuardado = await Filesystem.writeFile({
                  path: nombreArchivo,
                  data: base64Limpio,
                  directory: Directory.Cache,
                });

                await FileOpener.openFile({
                  path: archivoGuardado.uri,
                  mimeType: 'application/pdf'
                });
                resolve();
              } catch (err) {
                console.error('Error interno en el puente nativo:', err);
                reject(err);
              }
            };
            fileReader.onerror = (error) => reject(error);
          });

        } else {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = nombreArchivo;
          document.body.appendChild(a);
          a.click();

          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      }
      else {
        toast.error('Error al descargar el informe');
      }
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al procesar los datos');
    } finally {
      this.loading = false;
    }
  }

  protected async generarPago(): Promise<void> {
    const formPago = this.FormPago.generarDatos(this.infoCliente, this.servicios);
    if (!formPago.valid) return console.log("no se pudo generar la orden");
    try {
      this.loadingPago = true;
      const { data } = await firstValueFrom(this.paymentService.crearOrdenPagoralia(formPago.value));
      window.open(data.redirect_url, '_blank');
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al procesar los datos');
    } finally {
      this.loadingPago = false;
    }
  }


  protected async obtenerTickets(venta: string): Promise<void> {
    this.loading = true;
    try {
      const response = await firstValueFrom(this.clientS.obtenerLinkTicket(venta));
      //console.log('Res:', response);
      if (response.url) {
        const blob = await firstValueFrom(this.clientS.ticket(response.url));
        //console.log('Blob:', blob);
        const nombreTicket = `ticket_${venta}.pdf`;

        if (Capacitor.isNativePlatform()) {

          await new Promise<void>((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(blob);

            fileReader.onloadend = async () => {
              try {
                const base64data = fileReader.result as string;
                const base64Limpio = base64data.split(',')[1];

                const archivoGuardado = await Filesystem.writeFile({
                  path: nombreTicket,
                  data: base64Limpio,
                  directory: Directory.Cache,
                });

                await FileOpener.openFile({
                  path: archivoGuardado.uri,
                  mimeType: 'application/pdf'
                });

                resolve();
              } catch (err) {
                //console.error('Error al guardar o abrir ticket:', err);
                toast.error('Error al guardar o abrir el ticket');
                reject(err);
              }
            };

            fileReader.onerror = (error) => reject(error);
          });

        } else {
          this.urlNueva = this.sanitizer.bypassSecurityTrustResourceUrl(response.url);
        }
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
