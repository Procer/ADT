import { Tenant } from './tenant.entity';
export declare class TenantPricing {
    id: number;
    tenantId: string;
    tenant: Tenant;
    precioCp: number;
    moneda: string;
    fechaDesde: Date;
}
