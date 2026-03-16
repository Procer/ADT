import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportUnitsService } from './transport-units.service';
import { TransportUnitsController } from './transport-units.controller';
import { TransportUnit } from '../database/entities/transport-unit.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TransportUnit])],
    controllers: [TransportUnitsController],
    providers: [TransportUnitsService],
    exports: [TransportUnitsService],
})
export class TransportUnitsModule { }
