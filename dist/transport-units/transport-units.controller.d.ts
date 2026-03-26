import { TransportUnitsService } from './transport-units.service';
import { CreateTransportUnitDto } from './dto/create-transport-unit.dto';
export declare class TransportUnitsController {
    private readonly unitsService;
    constructor(unitsService: TransportUnitsService);
    bulkImport(file: any, req: any): Promise<{
        success: number;
        errors: string[];
    }>;
    create(createUnitDto: CreateTransportUnitDto): Promise<import("../database/entities/transport-unit.entity").TransportUnit[]>;
    findAll(tenantId?: string): Promise<import("../database/entities/transport-unit.entity").TransportUnit[]>;
    findOne(id: string): Promise<import("../database/entities/transport-unit.entity").TransportUnit | null>;
    update(id: string, updateDto: any): Promise<import("../database/entities/transport-unit.entity").TransportUnit | null>;
}
