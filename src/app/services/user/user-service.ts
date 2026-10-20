import { Injectable } from '@angular/core';
import { ObservableService } from '../utility/observable.service';
import { FormGroup } from '@angular/forms';

interface Limitacion {
  id: string;
  intentos: number;
  unlock: number;
  fecha: string;
}

@Injectable({
  providedIn: 'root'
})

export class UserService {

  private readonly maxIntentos = 3;
  private readonly penalizacion = [30, 60, /*2 * 60 * 60*/ 90];
  private readonly storageKey = 'limit';

  constructor(private ObservableService: ObservableService) { }

  private obtenerLimitaciones(): Limitacion[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) as Limitacion[] : [];
    } catch {
      return [];
    }
  }

  private guardarLimitaciones(limitaciones: Limitacion[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(limitaciones));
  }
  private obtenerLimitacion(id: string): Limitacion {
    const hoy = new Date().toLocaleDateString();
    const limitaciones = this.obtenerLimitaciones();

    let limitacion = limitaciones.find(item => item.id === id);

    if (!limitacion) {
      limitacion = {
        id,
        intentos: 0,
        unlock: 0,
        fecha: hoy
      };

      limitaciones.push(limitacion);
      this.guardarLimitaciones(limitaciones);
    } else if (limitacion.fecha !== hoy) {
      limitacion.intentos = 0;
      limitacion.unlock = 0;
      limitacion.fecha = hoy;

      this.guardarLimitaciones(limitaciones);
    }

    return limitacion;
  }

  enviarCorreo(id: string): boolean {
    const limitacion = this.obtenerLimitacion(id);
    return limitacion.intentos < this.maxIntentos && Date.now() >= limitacion.unlock;
  }

  registrarIntentos(id: string): number {
    const limitacion = this.obtenerLimitacion(id);
    limitacion.intentos++;
    const seconds = this.penalizacion[limitacion.intentos - 1] ?? 0;
    limitacion.unlock = Date.now() + seconds * 1000;

    const limitaciones = this.obtenerLimitaciones();
    const index = limitaciones.findIndex(item => item.id === id);

    if (index !== -1) {
      limitaciones[index] = limitacion;
    } else {
      limitaciones.push(limitacion);
    }

    this.guardarLimitaciones(limitaciones);
    return seconds;
  }

  getFaltante(id: string): number {
    const limitacion = this.obtenerLimitacion(id);
    return Math.max(0, Math.ceil((limitacion.unlock - Date.now()) / 1000));
  }

  getIntentos(id: string): number {
    return this.obtenerLimitacion(id).intentos;
  }

  reset(id: string): void {
    const limitaciones = this.obtenerLimitaciones().filter(item => item.id !== id);
    this.guardarLimitaciones(limitaciones);
  }

  resetTodo(): void {
    localStorage.removeItem(this.storageKey);
  }

  formatearTextoTelefono(valor: string, maxLength: number = 10): string {
    if (!valor) return '';
    const valorLimpio = valor.replace(/\D/g, '').slice(0, maxLength);

    if (valorLimpio.length <= 3) {
      return valorLimpio;
    } else if (valorLimpio.length <= 6) {
      return `${valorLimpio.slice(0, 3)}-${valorLimpio.slice(3)}`;
    } else {
      return `${valorLimpio.slice(0, 3)}-${valorLimpio.slice(3, 6)}-${valorLimpio.slice(6)}`;
    }
  }

  soloNumeros(event: Event, form?: FormGroup, controlName?: string, maxLength: number = 10): string {
    const input = event.target as HTMLInputElement;
    const valorFormateado = this.formatearTextoTelefono(input.value, maxLength);
    if (form && controlName) {
      input.value = valorFormateado;
      form.get(controlName)?.setValue(valorFormateado, { emitEvent: false });
    } else {
      setTimeout(() => {
        input.value = valorFormateado;
      });
    }
    return valorFormateado;
  }

  obtenerServicioActivo(): string | null {
    return (
      localStorage.getItem('servicio_activo')
    );
  }

  eliminarServicioActivo(): void {
    this.ObservableService.actualizarObs({}, [], [])
    localStorage.removeItem('servicio_activo');
  }
}
