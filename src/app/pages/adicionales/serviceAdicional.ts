export interface Especificacion {
  label: string;
  value: string;
}

export interface Producto {
  id: string;
  nombre: string;
  precio: string;
  disponibilidad: string;
  imagenActual: number;
  imagenes: string[];
  caracteristicas: string[];
  descripcion: string;
  especificaciones: Especificacion[];
}

export const PRODUCTOS: Record<string, Producto> = {

  router: {
    id: 'router',
    nombre: 'Router TP-Link',
    precio: '$390.00 MXN',
    disponibilidad: 'Bajo disponibilidad',
    imagenActual: 0,

    imagenes: [
      '../../../assets/img/productos/router/r1.webp',
      '../../../assets/img/productos/router/r2.webp'
    ],

    caracteristicas: [
      'Red de invitados para proporcionar acceso independiente.',
      'Velocidad inalámbrica de hasta 300 Mbps.',
      'Ideal para tareas básicas y navegación.'
    ],

    descripcion: 'Conectividad estable para el hogar.',

    especificaciones: [
      {
        label: 'Interface',
        value: '4 × 10/100 Mbps LAN + 1 × 10/100 Mbps WAN'
      },
      {
        label: 'Fuente de alimentación',
        value: '9VDC / 0.6A'
      },
      {
        label: 'Botón',
        value: 'WPS / Reset'
      },
      {
        label: 'Antenas',
        value: '2 antenas'
      }
    ]
  },

  switch: {
    id: 'switch',
    nombre: 'Switch TP-Link 5 puertos',
    precio: '$250.00 MXN',
    disponibilidad: 'Bajo disponibilidad',
    imagenActual: 0,

    imagenes: [
      '../../../assets/img/productos/switch/s1.webp',
      '../../../assets/img/productos/switch/s2.webp'
    ],

    caracteristicas: [
      '5 puertos Gigabit Ethernet.',
      'Tecnología Green Ethernet para ahorro de energía.',
      'Plug and Play.'
    ],

    descripcion: 'Conectividad de alto rendimiento para redes domésticas y empresariales.',

    especificaciones: [
      {
        label: 'Capacidad de switcheo',
        value: '10 Gbps'
      },
      {
        label: 'Ventiladores',
        value: 'Fanless'
      },
      {
        label: 'Interface',
        value: '5 × 10/100/1000 Mbps'
      },
      {
        label: 'Estándares',
        value: 'IEEE 802.3i / 802.3u / 802.3ab / 802.3x'
      }
    ]
  },

  switchs: {
    id: 'switchs',
    nombre: 'Switch TP-Link 8 puertos',
    precio: '$160.00 MXN',
    disponibilidad: 'Bajo disponibilidad',
    imagenActual: 0,

    imagenes: [
      '../../../assets/img/productos/switch8/s1.webp',
      '../../../assets/img/productos/switch8/s2.webp'
    ],

    caracteristicas: [
      '8 puertos Ethernet.',
      'Diseño compacto para escritorio.',
      'Plug and Play.'
    ],

    descripcion: 'Solución sencilla para ampliar tu red local.',

    especificaciones: [
      {
        label: 'Puertos',
        value: '8 puertos'
      },
      {
        label: 'Velocidad',
        value: '10/100 Mbps'
      },
      {
        label: 'Material',
        value: 'Plástico'
      },
      {
        label: 'Tipo',
        value: 'No administrable'
      }
    ]
  },

  'access-point': {
    id: 'access-point',
    nombre: 'Extensor WiFi TP-Link',
    precio: '$350.00 MXN',
    disponibilidad: 'Bajo disponibilidad',
    imagenActual: 0,

    imagenes: [
      '../../../assets/img/productos/wifi/e2.webp',
      '../../../assets/img/productos/wifi/e3.webp'
    ],

    caracteristicas: [
      'Amplía la cobertura inalámbrica.',
      'Ideal para zonas con señal WiFi débil.',
      'Puerto Ethernet incluido.'
    ],

    descripcion: 'Mayor cobertura WiFi en cada rincón.',

    especificaciones: [
      {
        label: 'Interface',
        value: '1 × 10/100 Mbps Ethernet'
      },
      {
        label: 'Botón',
        value: 'RE / Reset'
      },
      {
        label: 'Alimentación',
        value: '100-240V'
      },
      {
        label: 'Estándares',
        value: 'IEEE 802.11n / 802.11g / 802.11b'
      }
    ]
  },

  camaras: {
    id: 'camaras',
    nombre: 'Kit de Cámaras Uniarch',
    precio: '$4,800.00 MXN',
    disponibilidad: 'Bajo disponibilidad',
    imagenActual: 0,

    imagenes: [
      '../../../assets/img/productos/camaras/c1.webp',
      '../../../assets/img/productos/camaras/c2.webp'
    ],

    caracteristicas: [
      'Soporta TVI, AHD, CVI, CVBS e IP.',
      'Salida HDMI y VGA.',
      'Protección IP67.',
      'Tecnología ColorHunter.'
    ],

    descripcion: 'Sistema completo de videovigilancia para hogar y negocio.',

    especificaciones: [
      {
        label: 'Incluye',
        value: '4 cámaras Bullet 2 MP'
      },
      {
        label: 'Resolución',
        value: '1080P'
      },
      {
        label: 'DVR',
        value: 'Compatible con H.265 / H.264 / Ultra265'
      },
      {
        label: 'Protección',
        value: 'IP67'
      }
    ]
  },

  'cables-rj45': {
    id: 'cables-rj45',
    nombre: 'Cables RJ45',
    precio: '$5.00 MXN',
    disponibilidad: 'Bajo disponibilidad',
    imagenActual: 0,

    imagenes: [
      '../../../assets/img/productos/cable/c1.webp',
      '../../../assets/img/productos/cable/c3.webp'
    ],

    caracteristicas: [
      'Cable categoría CAT5e.',
      'Conectores RJ45.',
      'Ponchado disponible por costo adicional.'
    ],

    descripcion: 'Costo adicional por ponchado de cable y conector: $15.',

    especificaciones: [
      {
        label: 'Categoría',
        value: 'CAT5e'
      },
      {
        label: 'Velocidad',
        value: 'Hasta 100 Mbps'
      },
      {
        label: 'Material',
        value: 'Cobre'
      },
      {
        label: 'Longitud',
        value: '1 metro'
      }
    ]
  },

  'no-break': {
    id: 'no-break',
    nombre: 'No Break Koblenz',
    precio: '$1,300.00 MXN',
    disponibilidad: 'Bajo disponibilidad',
    imagenActual: 0,

    imagenes: [
      '../../../assets/img/productos/break/b1.webp',
      '../../../assets/img/productos/break/b3.webp'
    ],

    caracteristicas: [
      'Protege computadoras, pantallas y módems.',
      'Regulación automática de voltaje.',
      'Protección contra variaciones eléctricas.'
    ],

    descripcion: 'Protección eléctrica para tus equipos.',

    especificaciones: [
      {
        label: 'Potencia',
        value: '520 VA'
      },
      {
        label: 'Respaldo',
        value: '8 minutos'
      },
      {
        label: 'Salidas',
        value: '6 tomas'
      },
      {
        label: 'Voltaje',
        value: '120 V'
      }
    ]
  },

  roku: {
    id: 'roku',
    nombre: 'Roku Premiere',
    precio: '$750.00 MXN',
    disponibilidad: 'Bajo disponibilidad',
    imagenActual: 0,

    imagenes: [
      '../../../assets/img/productos/roku/ro1.webp',
      '../../../assets/img/productos/roku/ro2.webp'
    ],

    caracteristicas: [
      'Resolución 4K a 60 fps.',
      'Compatibilidad con HDR.',
      'WiFi integrado.'
    ],

    descripcion: 'Disfruta películas y series en alta definición.',

    especificaciones: [
      {
        label: 'Resolución',
        value: '4K (3840 × 2160)'
      },
      {
        label: 'HDR',
        value: 'Sí'
      },
      {
        label: 'Puertos',
        value: 'HDMI'
      },
      {
        label: 'Tipo',
        value: 'Streaming Player'
      }
    ]
  }

};