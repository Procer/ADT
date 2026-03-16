import { Repository } from 'typeorm';
import { Driver } from '../database/entities/driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { AuditLog } from '../database/entities/audit-log.entity';
export declare class DriversService {
    private driversRepo;
    private auditRepo;
    constructor(driversRepo: Repository<Driver>, auditRepo: Repository<AuditLog>);
    private cleanDriverData;
    create(createDriverDto: CreateDriverDto): Promise<any>;
    findAll(tenantId: string): Promise<Driver[]>;
    findByDni(dni: string): Promise<Driver | null>;
    findOne(id: string): Promise<Driver | null>;
    update(id: string, updateDto: any): Promise<Driver | null>;
    private parseExcelDate;
    importBulkFromExcel(tenantId: string, fileBuffer: Buffer): Promise<{
        success: number;
        errors: string[];
    }>;
}
