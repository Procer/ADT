import { Module, MiddlewareConsumer, NestModule, RequestMethod, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { TravelCredit } from '../database/entities/travel-credit.entity';
import { TenantPricing } from '../database/entities/tenant-pricing.entity';
import { Driver } from '../database/entities/driver.entity';
import { TransportUnit } from '../database/entities/transport-unit.entity';
import { GpsTracking } from '../database/entities/gps-tracking.entity';
import { GpsTrackingService } from './gps-tracking.service';
import { TripClosureService } from './trip-closure.service';
import { GpsGateway } from './gps.gateway';
import { BullModule } from '@nestjs/bullmq';
import { GpsProcessor } from './gps.processor';
import { NotificationsService } from '../management/notifications.service';
import { ManagementModule } from '../management/management.module';

import { Client } from '../database/entities/client.entity';
import { WalletBalance } from '../database/entities/wallet-balance.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { SystemConfig } from '../database/entities/system-config.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CartaPorte,
            Client,
            TravelCredit,
            TenantPricing,
            Driver,
            TransportUnit,
            GpsTracking,
            AuditLog,
            WalletBalance,
            Tenant,
            SystemConfig
        ]),
        BullModule.registerQueue({
            name: 'gps-ping-queue',
        }),
        forwardRef(() => ManagementModule),
    ],
    controllers: [TripsController],
    providers: [TripsService, GpsTrackingService, TripClosureService, GpsGateway, GpsProcessor],
    exports: [TripsService, TypeOrmModule],
})
export class TripsModule { }
