import { JwtService } from '@nestjs/jwt';
import { DriversService } from '../drivers/drivers.service';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
export declare class AuthService {
    private driversService;
    private jwtService;
    private readonly userRepo;
    private readonly auditRepo;
    constructor(driversService: DriversService, jwtService: JwtService, userRepo: Repository<User>, auditRepo: Repository<AuditLog>);
    validateDriver(dni: string, pin: string): Promise<any>;
    login(dni: string, pin: string): Promise<{
        access_token: string;
        driver: any;
        tenantConfig: any;
    }>;
    validateUser(email: string, pass: string): Promise<any>;
    adminLogin(email: string, pass: string): Promise<{
        access_token: string;
        user: any;
    }>;
    impersonate(tenantId: string, currentUser: any): Promise<{
        access_token: string;
        message: string;
    }>;
    changePassword(userId: string, newPass: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
