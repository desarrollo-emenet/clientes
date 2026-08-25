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

  public getMesPagoReciente(servicios: any): string {
    const estadoCuenta = servicios.estadoCuenta;
    if (estadoCuenta && estadoCuenta.length > 0) {
      return estadoCuenta[estadoCuenta.length - 1].mensualidad;
    }
    return 'N/A';
  }
  public getMesImporteReciente(servicios: any): number {
    const estadoCuenta = servicios.estadoCuenta;
    if (estadoCuenta && estadoCuenta.length > 0) {
      return estadoCuenta[estadoCuenta.length - 1].importe;
    }
    return 0;
  }

  public serviciosContratados(servicios: any, infoCliente: any){
    return Object.entries(servicios).filter(([key]) => key !== 'estadoCuenta')
    .map(([key, value]: [string, any]) => {
      switch(key){
        case "internet":
          return {
            iconColor: "svc-icon--blue",
            icon: "fa-wifi",
            nombre: "Internet",
            plan: infoCliente.nombrePlan,
            badge: "badge-blue",
            info: (infoCliente.velocidad || 0) + ' Mbps',
            textPrecio: "Precio mensual",
            colorPrecio: "svc-price--blue",
            precio: value.precio || 0
          }
        case "camaras":
           return {
            iconColor: "svc-icon--green",
            icon: "fa-camera",
            nombre: "Cámaras",
            plan: "Plan contratado",
            badge: "badge-green",
            info: (value.canServicios || 0) + " servicio(s)",
            textPrecio: "Precio por cámara",
            colorPrecio: "svc-price--green",
            precio: value.precio || 0
          }
        case "telefono":
           return {
            iconColor: "svc-icon--violet",
            icon: "fa-phone",
            nombre: "Telefonía",
            plan: "Plan contratado",
            badge: "badge-violet",
            info: (value.canServicios || 0) + " servicio(s)",
            textPrecio: "Precio por línea telefónica",
            colorPrecio: "svc-price--violet",
            precio: value.precio || 0
          }
        case "cuentasTv":
           return {
            iconColor: "svc-icon--orange",
            icon: "fa-tv",
            nombre: "TV",
            plan: "Plan contratado",
            badge: "badge-orange",
            info: (value.canServicios || 0) + " servicio(s)",
            textPrecio: "Precio por cuenta",
            colorPrecio: "svc-price--orange",
            precio: value.precio || 0
          }
        default: return;
      }
    });
  }

  public contarServicios(pservicios: any): any {
    if (!pservicios) return {};
    let conteo = 0;
    const servicios = pservicios;
    if (servicios.internet) conteo++;
    if (servicios.camaras) conteo++;
    if (servicios.telefono) conteo++;
    if (servicios.cuentasTv) conteo++;
    return { total: conteo, clase: "col-md-"+(12/conteo) };
  }

  public deudaValida(pDeduda: any): number | null {
  const deuda = Number(pDeduda);
  return isNaN(deuda) ? null : deuda;
  }

}
