import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import * as dotenv from 'dotenv';

dotenv.config();

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TripsModule } from './trips/trips.module';
import { DriversModule } from './drivers/drivers.module';
import { TransportUnitsModule } from './transport-units/transport-units.module';
import { Tenant } from './database/entities/tenant.entity';
import { TenantPricing } from './database/entities/tenant-pricing.entity';
import { TransportUnit } from './database/entities/transport-unit.entity';
import { Driver } from './database/entities/driver.entity';
import { CartaPorte } from './database/entities/carta-porte.entity';
import { GpsTracking } from './database/entities/gps-tracking.entity';
import { TravelCredit } from './database/entities/travel-credit.entity';
import { AuditLog } from './database/entities/audit-log.entity';
import { User } from './database/entities/user.entity';
import { Salesperson } from './database/entities/salesperson.entity';
import { Client } from './database/entities/client.entity';
import { WalletBalance } from './database/entities/wallet-balance.entity';
import { TenantPayment } from './database/entities/tenant-payment.entity';
import { AuthModule } from './auth/auth.module';
import { BullModule } from '@nestjs/bullmq';
import { ManagementModule } from './management/management.module';
import { CommonModule } from './common/common.module';

import { ClientAuthorizedEmail } from './database/entities/client-authorized-email.entity';
import { EmailIngestionLog } from './database/entities/email-ingestion-log.entity';
import { PricingRule } from './database/entities/pricing-rule.entity';
import { SettlementBatch } from './database/entities/settlement-batch.entity';
import { SystemConfig } from './database/entities/system-config.entity';
import { FinancialLot } from './database/entities/financial-lot.entity';
import { PaymentLot } from './database/entities/payment-lot.entity';
import { LotDeduction } from './database/entities/lot-deduction.entity';
import { AdtCredit } from './database/entities/adt-credit.entity';
import { AdtRecaudacion } from './database/entities/adt-recaudacion.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '1499'),
      username: process.env.DB_USERNAME || 'sa',
      password: process.env.DB_PASSWORD || 'YourStrongPassword123',
      database: process.env.DB_NAME || 'adt_db',
      entities: [
        Tenant,
        TenantPricing,
        TransportUnit,
        Driver,
        CartaPorte,
        GpsTracking,
        TravelCredit,
        AuditLog,
        User,
        Salesperson,
        Client,
        WalletBalance,
        TenantPayment,
        ClientAuthorizedEmail,
        EmailIngestionLog,
        PricingRule,
        SettlementBatch,
        SystemConfig,
        FinancialLot,
        PaymentLot,
        LotDeduction,
        AdtCredit,
        AdtRecaudacion
      ],
      synchronize: false,
      logging: true,
      options: {
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 30000
      }
    }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    CommonModule,
    TripsModule,
    DriversModule,
    TransportUnitsModule,
    AuthModule,
    ManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
