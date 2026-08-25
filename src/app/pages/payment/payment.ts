import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ClipboardModule } from 'ngx-clipboard';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { ClientService } from '../../services/user/clientService';
import { firstValueFrom } from 'rxjs';
import { PaymentService } from '../../services/pagoralia/paymentService';
import { UserService } from '../../services/user/user-service';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../../services/utility/http.service';
import { FormService } from '../../services/pagoralia/form.service';
import { ObservableService } from '../../services/utility/observable.service';
import { CalculoService } from '../../services/utility/calculo.service';
import { ContactoService } from '../../services/utility/contacto.service';
import { Preloader } from '../../shared/preloader/preloader';

@Component({
  selector: 'app-payment',
  imports: [ClipboardModule, NgxSonnerToaster, NgIf, FormsModule, Preloader],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class Payment {
  mensajeCopiado: boolean = false;
  loading!: boolean;
  loadingPago!: boolean;

  infoCliente: any;
  servicios: any;

  constructor(
    private clientS: ClientService,
    protected contactoService: ContactoService,
    private user: UserService,
    private ObservableService: ObservableService,
    private paymentService: PaymentService,
    private calculo: CalculoService,
    protected http: HttpService, private formPago: FormService) { }

  ngOnInit(): void {
    const clienteActivo = this.user.obtenerServicioActivo();
    this.ObservableService.cliente$.subscribe(info => this.infoCliente = info)
    this.ObservableService.servicios$.subscribe(info => this.servicios = info)
    if(!this.infoCliente.cliente) this.loadClientData(clienteActivo ?? '');
  }

  protected async loadClientData(numeroCliente: string): Promise<void> {
    this.loading = true;
    try {
      const { cliente, servicios } = await firstValueFrom(this.clientS.getClientePorNumero(numeroCliente));
      this.ObservableService.actualizarObs(cliente, this.calculo.construirNotificaciones(cliente), servicios);
      this.infoCliente = cliente;
      this.servicios = servicios;
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    } finally {
      this.loading = false;
    }
  }

  protected async generarPago(): Promise<void>{
    const formPago = this.formPago.generarDatos(this.infoCliente, this.servicios);
    if (!formPago.valid) return console.log("no se pudo generar la orden");
    try {
      this.loadingPago = true;
      const {data} = await firstValueFrom(this.paymentService.crearOrdenPagoralia(formPago.value));
      window.open(data.redirect_url, '_blank');
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al procesar los datos');
    } finally {
      this.loadingPago = false;
    }
  }

  copy(dato: string) {
    navigator.clipboard.writeText(dato)
      .then(() => {
        this.mensajeCopiado = true;
        toast.success("Datos copiados");
      })
      .catch(err => {
        toast.error('Error al copiar');
      });
  }
}
