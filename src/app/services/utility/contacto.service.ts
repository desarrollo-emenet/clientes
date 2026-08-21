import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ContactoService {
  public contactSupport(telefono: string, texto: string) {
    const phone = telefono;
    const text = encodeURIComponent(texto);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }
}
