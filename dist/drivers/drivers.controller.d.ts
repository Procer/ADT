import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
export declare class DriversController {
    private readonly driversService;
    constructor(driversService: DriversService);
    bulkImport(file: any, req: any): Promise<{
        success: number;
        errors: string[];
    }>;
    create(createDriverDto: CreateDriverDto): Promise<any>;
    findAll(tenantId: string): Promise<import("../database/entities/driver.entity").Driver[]>;
    findOne(id: string): Promise<import("../database/entities/driver.entity").Driver | null>;
    update(id: string, updateDto: any): Promise<import("../database/entities/driver.entity").Driver | null>;
}
