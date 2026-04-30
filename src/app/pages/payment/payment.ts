import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ClipboardModule } from 'ngx-clipboard';
import { NgxSonnerToaster, toast } from 'ngx-sonner';


@Component({
  selector: 'app-payment',
  imports: [ClipboardModule, NgxSonnerToaster, NgIf],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class Payment {
  mensajeCopiado: boolean = false;

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

  contactSupport() {
    const phone = '7291792524';
    const text = encodeURIComponent('Hola, necesito ayuda con mi pago.');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

   selectedMethod: string | null = null;

  selectMethod(method: string) {
    this.selectedMethod = method;
  }

}
