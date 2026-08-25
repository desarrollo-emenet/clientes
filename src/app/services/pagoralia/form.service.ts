import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CalculoService } from '../utility/calculo.service';
import { GenerarInvoiceService } from './generar-invoice.service';

@Injectable({
  providedIn: 'root'
})
export class FormService {
  formInfo: FormGroup;
  constructor(private fb: FormBuilder, private calculo: CalculoService, private invoiceService: GenerarInvoiceService) {
    this.formInfo = fb.group({
      isUnique: [1, [Validators.required]],
      invoice: [null, [Validators.required]],
      cliente: [null, [Validators.required]],
      nombre: [null, [Validators.required]],
      apellido: [null, [Validators.required]],
      monto: [null, [Validators.required, Validators.min(1)]],
      moneda: ["MXN", [Validators.required]],
    });
  }

  public generarDatos(infoCliente: any, servicios: any): FormGroup{
    const nombrePartes = infoCliente.nombre.split(" ");
    let monto = 0;
    if(this.calculo.deudaValida(infoCliente.deuda) !== null){
      monto = this.sinAdeudo(infoCliente) ? this.calculo.calcularTotalMensual(servicios) : (infoCliente.deuda);
    }else{
      monto = this.calculo.calcularTotalMensual(servicios);
    }
    this.formInfo.patchValue({
      invoice: this.invoiceService.generarInvoiceEncriptado(infoCliente.cliente, this.invoiceService.obtenerFechaActualFactura14()),
      cliente: infoCliente.cliente,
      nombre: nombrePartes[0],
      apellido: nombrePartes.length >= 3
          ? nombrePartes[nombrePartes.length - 2] + " " + nombrePartes[nombrePartes.length - 1]
          : nombrePartes.length === 2 ? nombrePartes[1] : nombrePartes[0],
      monto: monto,
    })
    return this.formInfo;
  }

  protected sinAdeudo(infoCliente: any): boolean {
    const deudaNumerica = Number(infoCliente.deuda);
    return !isNaN(deudaNumerica) && deudaNumerica === 0 && infoCliente.clasificacion !== 'BAJA';
  }
}
