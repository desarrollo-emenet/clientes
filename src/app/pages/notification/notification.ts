import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { toast } from 'ngx-sonner';
import { ClientService } from '../../services/user/clientService';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

interface Noti {
  title: string;
  text: string;
  time: string;
  unread: boolean;
}

@Component({
  selector: 'app-notification',
  imports: [NgClass, NgIf, NgFor],
  templateUrl: './notification.html',
  styleUrl: './notification.css'
})

export class Notification implements OnInit, OnDestroy{

  private subs: Subscription[] = [];
  notifications: Noti[] = [];


  constructor(private clientS: ClientService, private route: ActivatedRoute, private router: Router) { }


  ngOnInit(): void {
    const sub = this.route.paramMap.subscribe(params => {
      const numero = params.get('numero_cliente');

      if (numero) {
        this.loadNotificationData(numero);
      } else {
        const userSub = this.clientS.getAuthenticatedUser().subscribe({
          next: user => {
            const cliente = user?.cliente;
            if (!cliente) {
              toast.error('No se encontro infomarcion')
              return;
            }
            this.loadNotificationData(cliente);
          },
          error: err => {
            console.error('Error obteniendo usuario autenticado', err);
            toast.error('Error al obtener los datos del usuario');
          }
        });
        this.subs.push(userSub);
      }
    });
    this.subs.push(sub);

  }

  ngOnDestroy(): void {
  this.subs.forEach(s => s.unsubscribe());
}


  async loadNotificationData(numeroCliente: string) {
    // Implementación para cargar datos de notificaciones
    this.notifications = [];

    //notificacion adeudo pendiente
    try {
      const data: any = await this.clientS.getClientePorNumero(numeroCliente).toPromise();
      //console.log(data);
      if (!data) return;

      if(data.cliente?.cliente?.clasificacion === 'BAJA'){
        return;
      }

      const today = new Date();
      const day = today.getDate();

      //notificacion fechas de pago

      if (day >= 1 && day <= 5) {
        this.notifications.push({
          title: 'Recordatorio de pago',
          text: 'Recuerda que tus fecha de pago son del 1 al 5 de cada mes. Evita cortes en tu servicio realizando tu pago a tiempo.',
          time: 'Hoy',
          unread: true
        });
      }

      //notificacion adeudo pendiente
      if(Number(data.cliente?.cliente?.deuda) > 0){
        this.notifications.push({
          title: 'Adeudo pendiente',
          text: `Tienes un adeudo pendiente de $${data.cliente?.cliente?.deuda}. Por favor realiza tu pago para evitar cortes en tu servicio.`,
          time: 'Hoy',
          unread: true
        });
      }

    } catch (error) {
      console.error('Error al obtener datos del cliente para notificaciones', error);
    }

  }

}
