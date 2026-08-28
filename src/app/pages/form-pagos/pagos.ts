
export interface Pago {
  id: number;
  numOperacion: string;
  clave: string;
  mensualidad: string;
  cantidad: string;
  estado: string;
  observacion: string | null;
  created_at: string;
}

export interface EstadoConfig {
  texto: string;
  clase: string;
  icono: string;
}

export interface FiltroPago {
  value: string;
  label: string;
}

export const ESTADOS_PAGO: Record<string, EstadoConfig> = {
  '1': {
    texto: 'Pendiente',
    clase: 'pendiente',
    icono: 'fa-clock'
  },

  '2': {
    texto: 'Validado',
    clase: 'validado',
    icono: 'fa-check'
  },

  '3': {
    texto: 'Validado',
    clase: 'validado',
    icono: 'fa-check'
  },

  '4': {
    texto: 'Rechazado',
    clase: 'rechazado',
    icono: 'fa-xmark'
  }
};

export const FILTROS_PAGO: FiltroPago[] = [
  {
    value: 'todos',
    label: 'Todas'
  },
  {
    value: '1',
    label: 'Pendientes'
  },
  {
    value: 'registrado',
    label: 'Registrado'
  },
  {
    value: '4',
    label: 'Rechazado'
  }
];

export const MENSAJES_FILTRO_PAGO: Record<string, string> = {
  todos: 'No se encontraron pagos.',
  '1': 'No hay pagos pendientes.',
  registrado: 'No hay pagos registrados.',
  '4': 'No hay pagos rechazados.'
};

export const ESTADOS_REGISTRADOS = ['2', '3'];
