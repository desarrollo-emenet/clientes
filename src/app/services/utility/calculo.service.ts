import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CalculoService {
  calcularTotalMensual(servicios: any): number {
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
}
