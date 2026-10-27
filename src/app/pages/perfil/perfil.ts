import { Component } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { ObservableService } from '../../services/utility/observable.service';
import { UserService } from '../../services/user/user-service';
import { firstValueFrom } from 'rxjs';
import { Avatar } from 'primeng/avatar';
import { Router, RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';
import { ClientService } from '../../services/user/clientService';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../../services/utility/http.service';
import { infoCliente } from '../../models/info-cliente';
import { FormsModule } from '@angular/forms';
import { LoginS } from '../../services/auth/login';


@Component({
  selector: 'app-perfil',
  imports: [NgIf, Avatar, RouterLink, NgFor, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil {

  clienteAv: { nombre: string; cliente: string; avatarUrl: string | null; } = {
    nombre: '',
    cliente: '',
    avatarUrl: null
  };

  fechaRegistro: Date | string | null = null;

  avatarOptions: string[] = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
  ];

  mostrarSelectorAvatar = false;
  guardandoAvatar = false;
  showModal = false;
  loading!: boolean;
  userInfo: any;
  infoCliente: infoCliente | null = null;
  passwordEliminar = '';
  mostrarPasswordEliminar = false;
  errorEliminar = '';



  constructor(
    private observableService: ObservableService,
    private user: UserService,
    private clientS: ClientService,
    private loginS: LoginS,
    protected http: HttpService,
    protected router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    this.observableService.cliente$.subscribe(info => {
      if (!info) return;

      this.clienteAv = {
        nombre: info.nombre || '',
        cliente: String(
          info.cliente || this.user.obtenerServicioActivo() || ''
        ),
        avatarUrl: info.avatarUrl || null
      };
    });
    this.loadClientData(this.user.obtenerServicioActivo() ?? '');
  }

  protected async loadClientData(numeroCliente: string): Promise<void> {
    if (!numeroCliente?.trim()) {
      console.warn('No hay un número de cliente para consultar.');
      return;
    }
    try {
      const res = await firstValueFrom(this.clientS.getClientePorNumero(numeroCliente));
      this.infoCliente = res?.cliente ?? null;
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    }
  }


  toggleSelectorAvatar(): void {
    if (this.guardandoAvatar) return;
    this.mostrarSelectorAvatar = !this.mostrarSelectorAvatar;
  }

  async cambiarAvatar(url: string): Promise<void> {
    if (this.guardandoAvatar) return;

    if (this.clienteAv.avatarUrl === url) {
      this.mostrarSelectorAvatar = false;
      return;
    }

    this.guardandoAvatar = true;

    try {
      await firstValueFrom(this.clientS.updateAvatar({ avatar_url: url }));
      this.observableService.actualizarAvatar(url);
      this.clienteAv = { ...this.clienteAv, avatarUrl: url };
      this.mostrarSelectorAvatar = false;
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al actualizar el avatar');
    } finally {
      this.guardandoAvatar = false;
    }
  }


  copiarAlPortapapeles(texto: string): void {
    if (!texto) return;

    navigator.clipboard.writeText(texto)
      .then(() => {
        toast.success('Copiado al portapapeles');
      })
      .catch(() => {
        toast.error('No se pudo copiar');
      });
  }




  abrirConfirmacionRegistro(): void {
    this.passwordEliminar = '';
    this.errorEliminar = '';
    this.mostrarPasswordEliminar = false;
    this.showModal = true;
  }

  cerrarModal(): void {
    if (this.loading) return;

    this.showModal = false;
    this.passwordEliminar = '';
    this.errorEliminar = '';
    this.mostrarPasswordEliminar = false;
  }

  async confirmarEliminarCuenta(): Promise<void> {
    this.errorEliminar = '';
    if (!this.passwordEliminar.trim()) {
      this.errorEliminar = 'Ingresa tu contraseña para continuar.';
      return;
    }
    this.loading = true;

    try {
      const respuesta = await firstValueFrom(
        this.loginS.deleteAccount(this.passwordEliminar)
      );
      toast.success(respuesta.message || 'Cuenta eliminada correctamente.');
      this.showModal = false;
      this.passwordEliminar = '';
      await firstValueFrom(this.loginS.logout());
      this.loginS.clearToken();
      await this.router.navigate(['/iniciar-sesion']);
    } catch (error) {
      this.http.errorHttp(
        error as HttpErrorResponse,
        'No se pudo eliminar la cuenta'
      );
    } finally {
      this.loading = false;
    }
  }
  

}
