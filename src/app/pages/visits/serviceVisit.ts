export interface Visitas {
    id: number;
    problema: string;
    detalle: string;
    diagnostico: string;
    solucion: string;
    estado: number;
    created_at: string;
    agendaFecha: string;
    atencionFecha: string;
    usuarioAgendado: string;
    usuarioProceso: string;
    usarioAtencion: string;
}

export interface EstadoConfig {
    texto: string;
    clase: string;
    icono: string;
}

export interface FiltroVisita {
    value: number;
    label: string;
}

export const filtros_visitas: FiltroVisita[] = [
    { value: -1, label: 'Todas' },
    { value: 0, label: 'Agendadas' },
    { value: 1, label: 'Pendientes' },
    { value: 2, label: 'En atención' },
    { value: 3, label: 'Finalizadas' }
];

export interface EstadoConfig {
    texto: string;
    clase: string;
    icono: string;
}

export const estado_visitas: Record<number, EstadoConfig> = {
    0: {
        texto: 'Agendado',
        clase: 'agendado',
        icono: 'fa-calendar-check'
    },
    1: {
        texto: 'Pendiente',
        clase: 'pendiente',
        icono: 'fa-clock'
    },
    2: {
        texto: 'En atención',
        clase: 'proceso',
        icono: 'fa-screwdriver-wrench'
    },
    3: {
        texto: 'Finalizado',
        clase: 'finalizado',
        icono: 'fa-check'
    }
};