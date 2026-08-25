import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ClientService } from '../../services/user/clientService';
import { NgxSonnerToaster, toast } from "ngx-sonner";
import { firstValueFrom } from 'rxjs';
import { UserService } from '../../services/user/user-service';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../../services/utility/http.service';
import { ContactoService } from '../../services/utility/contacto.service';
import { CalculoService } from '../../services/utility/calculo.service';
import { ObservableService } from '../../services/utility/observable.service';
import { infoCliente } from '../../models/info-cliente';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, NgxSonnerToaster, CurrencyPipe, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  mostrarMensaje!: boolean;
  infoCliente!: infoCliente;
  loading!: boolean;
  servicios: any = { internet: [] };
  totalMensual: number = 0;

  constructor(
    private clientS: ClientService,
    private http: HttpService,
    private user: UserService,
    protected contactoService: ContactoService,
    protected calculo: CalculoService,
    private ObservableService: ObservableService,
  ) { }

  ngOnInit(): void {
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
      this.ObservableService.actualizarObs(cliente, this.calculo.construirNotificaciones(cliente), servicios)
      this.totalMensual = this.calculo.calcularTotalMensual(servicios)
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

  protected getSaludo(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {return 'Buenos días';}
    if (hour >= 12 && hour < 19) {return 'Buenas tardes';}
    return 'Buenas noches';
  }
}
