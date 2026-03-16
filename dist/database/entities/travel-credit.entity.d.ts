import { Tenant } from './tenant.entity';
export declare class TravelCredit {
    id: string;
    tenantId: string;
    tenant: Tenant;
    clientId: string;
    precioPagadoNominal: number;
    patenteVinculada: string;
    choferVinculado: string;
    usado: boolean;
    createdAt: Date;
}
