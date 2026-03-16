import { Tenant } from './tenant.entity';
export declare class Salesperson {
    id: string;
    nombre: string;
    email: string;
    porcentajeComision: number;
    bonoActivacion: number;
    tenants: Tenant[];
    createdAt: Date;
}
