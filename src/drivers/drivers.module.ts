import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { Driver } from '../database/entities/driver.entity';
import { AuditLog } from '../database/entities/audit-log.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Driver, AuditLog])],
    controllers: [DriversController],
    providers: [DriversService],
    exports: [DriversService],
})
export class DriversModule { }
