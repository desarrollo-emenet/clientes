import { Injectable } from '@angular/core';

interface Noti {
  title: string;
  text: string;
  time: string;
  unread: boolean;
}
@Injectable({
  providedIn: 'root',
})
export class CalculoService {
  public calcularTotalMensual(servicios: any): number {
    if (!servicios) return 0;
    const calcular = (servicio: any): number => {
      if (!servicio) return 0;

      const precio = Number(servicio.precio) || 0;
      const cantidad = Number(servicio.canServicios ?? 1);
      return precio * cantidad;
    };
    return (
      calcular(servicios.internet) +
      calcular(servicios.camaras) +
      calcular(servicios.telefono) +
      calcular(servicios.cuentasTv)
    );
  }

  public construirNotificaciones(cliente: any): Noti[] {
    const lista: Noti[] = [];
    if (!cliente || cliente.clasificacion === 'BAJA') return lista;
    const dia = new Date().getDate();
    if (dia >= 1 && dia <= 5) {
      lista.push({
        title: 'Recordatorio de pago',
        text: 'Recuerda que tus fecha de pago son del 1 al 5 de ' +
          'cada mes. Evita cortes en tu servicio realizando tu ' +
          'pago a tiempo.',
        time: 'Hoy',
        unread: true
      });
    }
    if (Number(cliente.deuda) > 0) {
      lista.push({
        title: 'Adeudo pendiente',
        text: `Tienes un adeudo pendiente de $${cliente.deuda}. ` +
          'Por favor realiza tu pago para evitar cortes en tu ' +
          'servicio.',
        time: 'Hoy',
        unread: true
      });
    }
    return lista;
  }
}
