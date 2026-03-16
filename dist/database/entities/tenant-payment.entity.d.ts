import { Tenant } from './tenant.entity';
export declare class TenantPayment {
    id: string;
    tenantId: string;
    tenant: Tenant;
    monto: number;
    referencia: string;
    metodoPago: string;
    comprobanteUrl: string;
    periodo: string;
    fechaPago: Date;
    registradoPor: string;
}
