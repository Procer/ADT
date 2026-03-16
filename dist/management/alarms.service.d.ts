import { Repository } from 'typeorm';
import { Driver } from '../database/entities/driver.entity';
import { TransportUnit } from '../database/entities/transport-unit.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
export declare class AlarmsService {
    private readonly driverRepo;
    private readonly unitRepo;
    private readonly auditRepo;
    private readonly logger;
    constructor(driverRepo: Repository<Driver>, unitRepo: Repository<TransportUnit>, auditRepo: Repository<AuditLog>);
    checkExpirations(): Promise<void>;
    private createAlert;
}
