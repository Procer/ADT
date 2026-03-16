import { Tenant } from './tenant.entity';
import { CartaPorte } from './carta-porte.entity';
export declare class Client {
    id: string;
    nombreRazonSocial: string;
    email: string;
    tenantId: string;
    tenant: Tenant;
    monedaPreferida: string;
    precioPorCp: number;
    notifyNewTrip: boolean;
    notifySpeeding: boolean;
    notifySettlement: boolean;
    asuntoClave: string;
    trips: CartaPorte[];
    createdAt: Date;
}
