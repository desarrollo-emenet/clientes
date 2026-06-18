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
  zoomIndex: number | null = null;

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

  abrirZoom(index: number): void {
    this.zoomIndex = index;
  }

  cerrarZoom(evento?: MouseEvent): void {
    if (evento) {
      const esOverlay = (evento.target as HTMLElement)
        .classList.contains('zoom-overlay');
      if (!esOverlay) return;
    }
    this.zoomIndex = null;
  }

  zoomSiguiente(evento: MouseEvent): void {
    evento.stopPropagation();
    const total = this.productoSeleccionado.imagenes.length;
    this.zoomIndex = ((this.zoomIndex! + 1) % total);
  }

  zoomAnterior(evento: MouseEvent): void {
    evento.stopPropagation();
    const total = this.productoSeleccionado.imagenes.length;
    this.zoomIndex = ((this.zoomIndex! - 1 + total) % total);
  }

  get imagenZoomActual(): string | null {
    if (this.zoomIndex === null || !this.productoSeleccionado) return null;
    return this.productoSeleccionado.imagenes[this.zoomIndex];
  }

  private obtenerDatosProducto(categoria: string): any {
    const productos: any = {
      router: {
        nombre: 'Router tp-link',
        precio: '$390.00 MXN',
        disponibilidad: 'Bajo disponibilidad',
        imagenActual: 0,
        imagenes: [
          '../../../assets/img/productos/router/r1.png',
          '../../../assets/img/productos/router/r2.png'
        ],
        caracteristicas: [
          'Red de Invitados proporciona acceso independiente para invitados.',
          'Velocidad de transmisión inalámbrica de 300 Mbps ideal para tareas básicas.'
        ],
        descripcion: 'Conectividad para el hogar.',
        especificaciones: [
          { label: 'Interface', value: '4 10/100Mbps LAN PORTS 1 10/100Mbps WAN PORT' },
          { label: 'Fuente de alimentacion', value: '9VDC / 0.6A' },
          { label: 'Botón', value: 'WPS/Reset' },
          { label: 'Antena', value: '2 antenas' }
        ]
      },
      switch: {
        nombre: 'Switch tp-link 5 puertos',
        precio: '$250.00 MXN',
        disponibilidad: 'Bajo disponibilidad',
        imagenActual: 0,
        imagenes: [
          '../../../assets/img/productos/switch/s1.png',
          '../../../assets/img/productos/switch/s2.png'
        ],
        caracteristicas: [
          'Puertos Gigabit Ethernet',
          'La tecnología Green Ethernet ahorra energía'
        ],
        descripcion: 'Conectividad empresarial de alto rendimiento.',
        especificaciones: [
          { label: 'Capacidad de Switcheo', value: '10 Gbps' },
          { label: 'Cantidad de Ventiladores', value: 'Fanless' },
          { label: 'Interface', value: '5× 10/100/1000Mbps, Auto-Negotiation, Auto-MDI/MDIX Ports' },
          { label: 'Estándares y Protocolos', value: 'IEEE 802.3i/802.3u/ 802.3ab/802.3x' }
        ]
      },
      switchs: {
        nombre: 'Switch tp-link 8 puertos',
        precio: '$160.00 MXN',
        disponibilidad: 'Bajo disponibilidad',
        imagenActual: 0,
        imagenes: [
          '../../../assets/img/productos/switch8/s1.png',
          '../../../assets/img/productos/switch8/s2.png'
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
        nombre: 'Extensor WiFi tp-link',
        precio: '$350.00 MXN',
        disponibilidad: 'Bajo disponibilidad',
        imagenActual: 0,
        imagenes: [
          '../../../assets/img/productos/wifi/e2.png',
          '../../../assets/img/productos/wifi/e3.png'
        ],
        caracteristicas: [
          'Mejora la señal inalámbrica a áreas anteriormente inalcanzables o difíciles de cablear',
          'Puerto Ethernet permite que el Extensor funcione como un adaptador inalámbrico'
        ],
        descripcion: 'Mayor cobertura WiFi en cada rincón.',
        especificaciones: [
          { label: 'Interface', value: '1 x 10/100Mbps Ethernet Port (RJ45)' },
          { label: 'Botón', value: 'Botón RE (Range Extender), Botón de Reinicio' },
          { label: 'Input Power', value: '4x4 100-240V~50/60Hz' },
          { label: 'Estándares Inalámbricos', value: 'IEEE 802.11n, IEEE 802.11g, IEEE 802.11b' }
        ]
      },
      camaras: {
        nombre: 'Kit de Cámaras Uniarch',
        precio: '$4,800.00 MXN',
        disponibilidad: 'Bajo disponibilidad',
        imagenActual: 0,
        imagenes: [
          '../../../assets/img/productos/camaras/c1.png',
          '../../../assets/img/productos/camaras/c2.png'
        ],
        caracteristicas: [
          'Soporta cámaras TVI, AHD, CVI, CVBS, IP/ Soporta 1 salida HDMI y 1 salida VGA',
          'Protección IP67 / Tecnología Colorhunter'
        ],
        descripcion: 'Sistemas de videovigilancia y seguridad.',
        especificaciones: [
          { label: 'Incluye', value: ' 4 Camaras Bullet 2Mp / Exteriores / Lente 2.8 Mm /1 Xvr /Calidad 1080P' },
          { label: 'Incluye', value: ' 4 Cables Preponchados De 18M0 / 1 Distribuidor de Energía y Fuente de Poder' },
          { label: 'DVR', value: 'Soporta H.265/H.264/Ultra265 en cámaras IP UNV' },
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
        precio: '$1,300.00 MXN',
        disponibilidad: 'Bajo disponibilidad',
        imagenActual: 0,
        imagenes: [
          '../../../assets/img/productos/break/b1.png',
          '../../../assets/img/productos/break/b3.png'
        ],
        caracteristicas: [
          'Protege computadoras de escritorio, pantallas pequeñas, modems y más',
          ' Incorpora un sistema de regulación automática de voltaje'
        ],
        descripcion: 'Protección eléctrica para tus equipos.',
        especificaciones: [
          { label: 'Potencia', value: '520VA' },
          { label: 'Tiempo de respaldo', value: '8 min de autonomia' },
          { label: 'Salidas', value: '6 tomas de corriente' },
          { label: 'Voltaje', value: '120V' }
        ]
      },
      'roku': {
        nombre: 'Roku Premiere',
        precio: '$750.00 MXN',
        disponibilidad: 'Bajo disponibilidad',
        imagenActual: 0,
        imagenes: [
          '../../../assets/img/productos/roku/ro1.png',
          '../../../assets/img/productos/roku/ro2.png'
        ],
        caracteristicas: [
          '4K a 60 fps y compatibilidad con HDR.',
          'Wi-Fi integrado (compatible con redes de 2.4 GHz).'
        ],
        descripcion: 'Disfruta de tus películas y series favoritas en alta definición.',
        especificaciones: [
          { label: 'Resolución', value: '4K (3840x2160)' },
          { label: 'HDR', value: 'Sí' },
          { label: 'Puertos', value: 'HDMI' },
          { label: 'Tipo', value: 'Streaming Player' }
        ]
      }
    };

    return productos[categoria] || null;
  }

}
