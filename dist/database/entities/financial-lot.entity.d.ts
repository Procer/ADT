import { Tenant } from './tenant.entity';
import { Client } from './client.entity';
import { CartaPorte } from './carta-porte.entity';
export declare class FinancialLot {
    id: string;
    tenantId: string;
    tenant: Tenant;
    clientId: string;
    client: Client;
    totalNeto: number;
    status: string;
    proformaPath: string;
    createdAt: Date;
    updatedAt: Date;
    trips: CartaPorte[];
}
