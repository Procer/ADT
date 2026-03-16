import { Tenant } from './tenant.entity';
export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    TENANT_ADMIN = "TENANT_ADMIN",
    CLIENT = "CLIENT"
}
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    tenantId: string;
    tenant: Tenant;
    clientId: string;
    nombreCompleto: string;
    telegramChatId: string;
    mustChangePassword: boolean;
    createdAt: Date;
}
