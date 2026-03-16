import { Module, forwardRef } from '@nestjs/common';
import { TripsModule } from '../trips/trips.module';
import { AlarmsService } from './alarms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagementController } from './management.controller';
import { ClientsController } from './clients.controller';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { GpsTracking } from '../database/entities/gps-tracking.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { TransportUnit } from '../database/entities/transport-unit.entity';
import { Driver } from '../database/entities/driver.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantPricing } from '../database/entities/tenant-pricing.entity';
import { TravelCredit } from '../database/entities/travel-credit.entity';
import { User } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';
import { TenantPayment } from '../database/entities/tenant-payment.entity';
import { WalletBalance } from '../database/entities/wallet-balance.entity';
import { TelegramService } from './telegram.service';
import { AiExtractorService } from './ai-extractor.service';
import { EmailIngestionService } from './email-ingestion.service';
import { PricingEngineService } from './pricing-engine.service';
import { FinancialReportingService } from './financial-reporting.service';
import { PricingRule } from '../database/entities/pricing-rule.entity';
import { SettlementBatch } from '../database/entities/settlement-batch.entity';
import { SystemConfig } from '../database/entities/system-config.entity';

import { ClientAuthorizedEmail } from '../database/entities/client-authorized-email.entity';
import { EmailIngestionLog } from '../database/entities/email-ingestion-log.entity';
import { FinancialLot } from '../database/entities/financial-lot.entity';
import { PaymentLot } from '../database/entities/payment-lot.entity';
import { LotDeduction } from '../database/entities/lot-deduction.entity';
import { AdtCredit } from '../database/entities/adt-credit.entity';
import { AdtRecaudacion } from '../database/entities/adt-recaudacion.entity';
import { FinanceController } from './finance.controller';
import { Finance360Service } from './finance-360.service';
import { NotificationsService } from './notifications.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CartaPorte,
            GpsTracking,
            AuditLog,
            TransportUnit,
            Driver,
            Tenant,
            TenantPricing,
            TravelCredit,
            User,
            Client,
            TenantPayment,
            WalletBalance,
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
        ]),
        forwardRef(() => TripsModule)
    ],
    controllers: [ManagementController, ClientsController, FinanceController],
    providers: [AlarmsService, AiExtractorService, EmailIngestionService, PricingEngineService, FinancialReportingService, Finance360Service, TelegramService, NotificationsService],
    exports: [PricingEngineService, FinancialReportingService, Finance360Service, TelegramService, NotificationsService]
})
export class ManagementModule { }
