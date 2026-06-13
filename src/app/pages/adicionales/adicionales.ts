import { Component } from '@angular/core';
import { NgClass, CommonModule } from '@angular/common';


@Component({
  selector: 'app-adicionales',
  imports: [NgClass, CommonModule],
  templateUrl: './adicionales.html',
  styleUrl: './adicionales.css'
})
export class Adicionales {

  activeSection: string = 'servicios';
  modalActivo: string | null = null;
  productoSeleccionado: any = null;

  showSection(id: string): void {
    this.activeSection = id;
    this.cerrarModal();
  }

  abrirModal(seccion: string): void {
    this.modalActivo = seccion;
    document.body.style.overflow = 'hidden';
  }

  cerrarModal(evento?: MouseEvent): void {
    if (evento) {
      const esOverlay = (evento.target as HTMLElement)
        .classList.contains('modal-overlay');
      if (!esOverlay) return;
    }
    this.modalActivo = null;
    document.body.style.overflow = '';
  }

  solicitarOpcion(opcion: string): void {
    const mensaje = encodeURIComponent(
      `Hola, quiero información sobre el punto de venta My Business POS: ${opcion}`
    );
    window.open(
      `https://api.whatsapp.com/send?phone=5217131334557&text=${mensaje}`,
      '_blank'
    );
  }

  enviarCotizacion(evento: Event, servicio: string): void {
    evento.preventDefault();
    const formulario = evento.target as HTMLFormElement;
    const campos = new FormData(formulario);
    const mensaje = this.obtenerMensajeCotizacion(servicio, campos);
    this.redirigirAWhatsApp(mensaje);
  }

  private obtenerMensajeCotizacion(
    servicio: string,
    campos: FormData
  ): string {
    if (servicio === 'camaras') {
      return this.construirMensajeCamaras(campos);
    }
    if (servicio === 'web') {
      return this.construirMensajeWeb(campos);
    }
    return `Hola, quiero solicitar una cotización de: ${servicio}`;
  }

  private construirMensajeCamaras(campos: FormData): string {
    const nombre = campos.get('nombre') as string;
    const telefono = campos.get('telefono') as string;
    const cantidad = campos.get('cantidadCamaras') as string;
    const instalacion = campos.get('tipoInstalacion') as string;

    return `Hola, quiero cotizar cámaras de seguridad.\n\n` +
      `*Nombre:* ${nombre}\n` +
      `*Teléfono:* ${telefono}\n` +
      `*Cantidad de cámaras:* ${cantidad}\n` +
      `*Tipo de instalación:* ${instalacion}`;
  }

  private construirMensajeWeb(campos: FormData): string {
    const nombre = campos.get('nombre') as string;
    const telefono = campos.get('telefono') as string;
    const tipoPagina = campos.get('tipoPagina') as string;

    return `Hola, quiero cotizar una página web.\n\n` +
      `*Nombre:* ${nombre}\n` +
      `*Teléfono:* ${telefono}\n` +
      `*Tipo de página:* ${tipoPagina}`;
  }

  private redirigirAWhatsApp(mensaje: string): void {
    const numeroWhatsApp = '5217131334557';
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=` +
      `${numeroWhatsApp}&text=${mensajeCodificado}`;
    window.open(urlWhatsApp, '_blank');
  }

  abrirModalProducto(categoria: string): void {
    this.productoSeleccionado = this.obtenerDatosProducto(categoria);
    this.modalActivo = 'producto';
    document.body.style.overflow = 'hidden';
  }

  cambiarImagen(index: number): void {
    if (this.productoSeleccionado) {
      this.productoSeleccionado.imagenActual = index;
    }
  }

  private obtenerDatosProducto(categoria: string): any {
    const productos: any = {
      router: {
        nombre: 'Routers',
        precio: '$600.00 MXN',
        disponibilidad: 'Baja disponibilidad',
        imagenActual: 0,
        imagenes: [
          '../../../assets/img/productos/router.svg',
          '../../../assets/img/productos/router.svg'
        ],
        caracteristicas: [
          'Compatible con Windows, Mac y Linux',
          'Diseño ergonómico para uso prolongado'
        ],
        descripcion: 'Conectividad empresarial de alto rendimiento.',
        especificaciones: [
          { label: 'Fuente de luz', value: 'LED' },
          { label: 'IP Class', value: 'IP65' },
          { label: 'Material', value: 'Plástico resistente' },
          { label: 'Tipo de escaneo', value: 'Láser' }
        ]
      },
      switch: {
        nombre: 'Switch',
        precio: '$850.00 MXN',
        disponibilidad: 'En stock',
        imagenActual: 0,
        imagenes: [
          '../../../assets/img/productos/switch.svg',
          '../../../assets/img/productos/switch.svg'
        ],
        caracteristicas: [
          'Puertos Gigabit Ethernet',
          'Soporte para VLAN y QoS'
        ],
        descripcion: 'Conectividad empresarial de alto rendimiento.',
        especificaciones: [
          { label: 'Puertos', value: '24 Puertos' },
          { label: 'Velocidad', value: '10/100/1000 Mbps' },
          { label: 'Material', value: 'Metal' },
          { label: 'Tipo', value: 'Managed' }
        ]
      },
      'access-point': {
        nombre: 'Access Point',
        precio: '$1,200.00 MXN',
        disponibilidad: 'En stock',
        imagenActual: 0,
        imagenes: [
          '../../../assets/img/productos/AP.svg',
          '../../../assets/img/productos/AP.svg'
        ],
        caracteristicas: [
          'WiFi 6 de última generación',
          'Cobertura hasta 200 metros'
        ],
        descripcion: 'Mayor cobertura WiFi en cada rincón.',
        especificaciones: [
          { label: 'Estándar', value: 'WiFi 6 (802.11ax)' },
          { label: 'Velocidad', value: 'AX3000' },
          { label: 'Antenas', value: '4x4 MIMO' },
          { label: 'Puertos', value: '2x Gigabit' }
        ]
      },
      camaras: {
        nombre: 'Cámaras',
        precio: '$1,500.00 MXN',
        disponibilidad: 'Baja disponibilidad',
        imagenActual: 0,
        imagenes: [
          '../../../assets/img/productos/camara.svg',
          '../../../assets/img/productos/camara.svg'
        ],
        caracteristicas: [
          'Resolución 4K Ultra HD',
          'Visión nocturna infrarroja'
        ],
        descripcion: 'Sistemas de videovigilancia y seguridad.',
        especificaciones: [
          { label: 'Resolución', value: '4K (3840x2160)' },
          { label: 'Sensor', value: 'CMOS 1/2.7"' },
          { label: 'Lente', value: '2.8mm' },
          { label: 'IR', value: '30 metros' }
        ]
      },
      'cables-rj45': {
        nombre: 'Cables RJ45',
        precio: '$45.00 MXN',
        disponibilidad: 'En stock',
        imagenActual: 0,
        imagenes: [
          '../../../assets/img/productos/rj45.svg',
          '../../../assets/img/productos/rj45.svg'
        ],
        caracteristicas: [
          'Categoría CAT6',
          'Conector dorado 24K'
        ],
        descripcion: 'Accesorios y conectividad de calidad.',
        especificaciones: [
          { label: 'Categoría', value: 'CAT6' },
          { label: 'Velocidad', value: 'hasta 10 Gbps' },
          { label: 'Material', value: 'Cobre puro' },
          { label: 'Longitud', value: '1.5 metros' }
        ]
      },
      'no-break': {
        nombre: 'No Break',
        precio: '$2,800.00 MXN',
        disponibilidad: 'En stock',
        imagenActual: 0,
        imagenes: [
          '../../../assets/img/productos/ups.svg',
          '../../../assets/img/productos/ups.svg'
        ],
        caracteristicas: [
          'Potencia 1500VA',
          'Protección contra sobretensión'
        ],
        descripcion: 'Protección eléctrica para tus equipos.',
        especificaciones: [
          { label: 'Capacidad', value: '1500VA / 900W' },
          { label: 'Tiempo de respaldo', value: '20-30 min' },
          { label: 'Salidas', value: '8 outlets' },
          { label: 'Tipo', value: 'Line Interactive' }
        ]
      }
    };

    return productos[categoria] || null;
  }

}
