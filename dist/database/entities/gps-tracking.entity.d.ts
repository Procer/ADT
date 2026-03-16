import { CartaPorte } from './carta-porte.entity';
export declare class GpsTracking {
    id: string;
    cpId: string;
    cartaPorte: CartaPorte;
    latitud: number;
    longitud: number;
    velocidad: number;
    esManual: boolean;
    tipoRegistro: string;
    eventoManual: string;
    cierreInternoDisparado: boolean;
    fueraDeRango: boolean;
    resuelto: boolean;
    comentarioResolucion: string;
    resueltoPor: string;
    distanciaDestinoMetros: number;
    timestampDispositivo: Date;
    timestampServidor: Date;
}
