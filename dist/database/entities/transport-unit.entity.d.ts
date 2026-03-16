import { Tenant } from './tenant.entity';
import { CartaPorte } from './carta-porte.entity';
export declare class TransportUnit {
    id: string;
    tenantId: string;
    vencimientoVTV: Date;
    vencimientoSeguro: Date;
    vencimientoRuta: Date;
    odometroActual: number;
    kmInicial: number;
    tenant: Tenant;
    patente: string;
    marca: string;
    modelo: string;
    statusHabilitacion: boolean;
    trips: CartaPorte[];
}
