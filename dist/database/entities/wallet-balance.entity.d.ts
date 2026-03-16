import { Tenant } from './tenant.entity';
import { Client } from './client.entity';
export declare class WalletBalance {
    id: string;
    tenantId: string;
    clientId: string | null;
    tenant: Tenant;
    client: Client;
    saldoCreditos: number;
    lastUpdate: Date;
}
