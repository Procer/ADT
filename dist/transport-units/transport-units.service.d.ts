import { Repository } from 'typeorm';
import { TransportUnit } from '../database/entities/transport-unit.entity';
import { CreateTransportUnitDto } from './dto/create-transport-unit.dto';
export declare class TransportUnitsService {
    private unitsRepo;
    constructor(unitsRepo: Repository<TransportUnit>);
    create(createUnitDto: CreateTransportUnitDto): Promise<TransportUnit>;
    findAll(tenantId: string): Promise<TransportUnit[]>;
    findAllAdmin(): Promise<TransportUnit[]>;
    findOne(id: string): Promise<TransportUnit | null>;
    update(id: string, updateDto: any): Promise<TransportUnit | null>;
    private parseExcelDate;
    importBulkFromExcel(tenantId: string, fileBuffer: Buffer): Promise<{
        success: number;
        errors: string[];
    }>;
}
