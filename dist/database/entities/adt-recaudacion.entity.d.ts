import { Tenant } from './tenant.entity';
import { User } from './user.entity';
export declare class AdtRecaudacion {
    id: string;
    tenantId: string;
    tenant: Tenant;
    status: string;
    monto: number;
    fechaRecaudo: Date;
    adminId: string;
    admin: User;
}
