"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagementModule = void 0;
const common_1 = require("@nestjs/common");
const trips_module_1 = require("../trips/trips.module");
const alarms_service_1 = require("./alarms.service");
const typeorm_1 = require("@nestjs/typeorm");
const management_controller_1 = require("./management.controller");
const clients_controller_1 = require("./clients.controller");
const carta_porte_entity_1 = require("../database/entities/carta-porte.entity");
const gps_tracking_entity_1 = require("../database/entities/gps-tracking.entity");
const audit_log_entity_1 = require("../database/entities/audit-log.entity");
const transport_unit_entity_1 = require("../database/entities/transport-unit.entity");
const driver_entity_1 = require("../database/entities/driver.entity");
const tenant_entity_1 = require("../database/entities/tenant.entity");
const tenant_pricing_entity_1 = require("../database/entities/tenant-pricing.entity");
const travel_credit_entity_1 = require("../database/entities/travel-credit.entity");
const user_entity_1 = require("../database/entities/user.entity");
const client_entity_1 = require("../database/entities/client.entity");
const tenant_payment_entity_1 = require("../database/entities/tenant-payment.entity");
const wallet_balance_entity_1 = require("../database/entities/wallet-balance.entity");
const telegram_service_1 = require("./telegram.service");
const ai_extractor_service_1 = require("./ai-extractor.service");
const email_ingestion_service_1 = require("./email-ingestion.service");
const pricing_engine_service_1 = require("./pricing-engine.service");
const financial_reporting_service_1 = require("./financial-reporting.service");
const pricing_rule_entity_1 = require("../database/entities/pricing-rule.entity");
const settlement_batch_entity_1 = require("../database/entities/settlement-batch.entity");
const system_config_entity_1 = require("../database/entities/system-config.entity");
const client_authorized_email_entity_1 = require("../database/entities/client-authorized-email.entity");
const email_ingestion_log_entity_1 = require("../database/entities/email-ingestion-log.entity");
const financial_lot_entity_1 = require("../database/entities/financial-lot.entity");
const payment_lot_entity_1 = require("../database/entities/payment-lot.entity");
const lot_deduction_entity_1 = require("../database/entities/lot-deduction.entity");
const adt_credit_entity_1 = require("../database/entities/adt-credit.entity");
const adt_recaudacion_entity_1 = require("../database/entities/adt-recaudacion.entity");
const finance_controller_1 = require("./finance.controller");
const finance_360_service_1 = require("./finance-360.service");
const notifications_service_1 = require("./notifications.service");
let ManagementModule = class ManagementModule {
};
exports.ManagementModule = ManagementModule;
exports.ManagementModule = ManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                carta_porte_entity_1.CartaPorte,
                gps_tracking_entity_1.GpsTracking,
                audit_log_entity_1.AuditLog,
                transport_unit_entity_1.TransportUnit,
                driver_entity_1.Driver,
                tenant_entity_1.Tenant,
                tenant_pricing_entity_1.TenantPricing,
                travel_credit_entity_1.TravelCredit,
                user_entity_1.User,
                client_entity_1.Client,
                tenant_payment_entity_1.TenantPayment,
                wallet_balance_entity_1.WalletBalance,
                client_authorized_email_entity_1.ClientAuthorizedEmail,
                email_ingestion_log_entity_1.EmailIngestionLog,
                pricing_rule_entity_1.PricingRule,
                settlement_batch_entity_1.SettlementBatch,
                system_config_entity_1.SystemConfig,
                financial_lot_entity_1.FinancialLot,
                payment_lot_entity_1.PaymentLot,
                lot_deduction_entity_1.LotDeduction,
                adt_credit_entity_1.AdtCredit,
                adt_recaudacion_entity_1.AdtRecaudacion
            ]),
            (0, common_1.forwardRef)(() => trips_module_1.TripsModule)
        ],
        controllers: [management_controller_1.ManagementController, clients_controller_1.ClientsController, finance_controller_1.FinanceController],
        providers: [alarms_service_1.AlarmsService, ai_extractor_service_1.AiExtractorService, email_ingestion_service_1.EmailIngestionService, pricing_engine_service_1.PricingEngineService, financial_reporting_service_1.FinancialReportingService, finance_360_service_1.Finance360Service, telegram_service_1.TelegramService, notifications_service_1.NotificationsService],
        exports: [pricing_engine_service_1.PricingEngineService, financial_reporting_service_1.FinancialReportingService, finance_360_service_1.Finance360Service, telegram_service_1.TelegramService, notifications_service_1.NotificationsService]
    })
], ManagementModule);
//# sourceMappingURL=management.module.js.map