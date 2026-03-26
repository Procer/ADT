"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const trips_module_1 = require("./trips/trips.module");
const drivers_module_1 = require("./drivers/drivers.module");
const transport_units_module_1 = require("./transport-units/transport-units.module");
const tenant_entity_1 = require("./database/entities/tenant.entity");
const tenant_pricing_entity_1 = require("./database/entities/tenant-pricing.entity");
const transport_unit_entity_1 = require("./database/entities/transport-unit.entity");
const driver_entity_1 = require("./database/entities/driver.entity");
const carta_porte_entity_1 = require("./database/entities/carta-porte.entity");
const gps_tracking_entity_1 = require("./database/entities/gps-tracking.entity");
const travel_credit_entity_1 = require("./database/entities/travel-credit.entity");
const audit_log_entity_1 = require("./database/entities/audit-log.entity");
const user_entity_1 = require("./database/entities/user.entity");
const salesperson_entity_1 = require("./database/entities/salesperson.entity");
const client_entity_1 = require("./database/entities/client.entity");
const wallet_balance_entity_1 = require("./database/entities/wallet-balance.entity");
const tenant_payment_entity_1 = require("./database/entities/tenant-payment.entity");
const auth_module_1 = require("./auth/auth.module");
const bullmq_1 = require("@nestjs/bullmq");
const management_module_1 = require("./management/management.module");
const common_module_1 = require("./common/common.module");
const client_authorized_email_entity_1 = require("./database/entities/client-authorized-email.entity");
const email_ingestion_log_entity_1 = require("./database/entities/email-ingestion-log.entity");
const pricing_rule_entity_1 = require("./database/entities/pricing-rule.entity");
const settlement_batch_entity_1 = require("./database/entities/settlement-batch.entity");
const system_config_entity_1 = require("./database/entities/system-config.entity");
const financial_lot_entity_1 = require("./database/entities/financial-lot.entity");
const payment_lot_entity_1 = require("./database/entities/payment-lot.entity");
const lot_deduction_entity_1 = require("./database/entities/lot-deduction.entity");
const adt_credit_entity_1 = require("./database/entities/adt-credit.entity");
const adt_recaudacion_entity_1 = require("./database/entities/adt-recaudacion.entity");
const app_log_entity_1 = require("./database/entities/app-log.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mssql',
                host: process.env.DB_HOST || '127.0.0.1',
                port: parseInt(process.env.DB_PORT || '1499'),
                username: process.env.DB_USERNAME || 'sa',
                password: process.env.DB_PASSWORD || 'YourStrongPassword123',
                database: process.env.DB_NAME || 'adt_db',
                entities: [
                    tenant_entity_1.Tenant,
                    tenant_pricing_entity_1.TenantPricing,
                    transport_unit_entity_1.TransportUnit,
                    driver_entity_1.Driver,
                    carta_porte_entity_1.CartaPorte,
                    gps_tracking_entity_1.GpsTracking,
                    travel_credit_entity_1.TravelCredit,
                    audit_log_entity_1.AuditLog,
                    user_entity_1.User,
                    salesperson_entity_1.Salesperson,
                    client_entity_1.Client,
                    wallet_balance_entity_1.WalletBalance,
                    tenant_payment_entity_1.TenantPayment,
                    client_authorized_email_entity_1.ClientAuthorizedEmail,
                    email_ingestion_log_entity_1.EmailIngestionLog,
                    pricing_rule_entity_1.PricingRule,
                    settlement_batch_entity_1.SettlementBatch,
                    system_config_entity_1.SystemConfig,
                    financial_lot_entity_1.FinancialLot,
                    payment_lot_entity_1.PaymentLot,
                    lot_deduction_entity_1.LotDeduction,
                    adt_credit_entity_1.AdtCredit,
                    adt_recaudacion_entity_1.AdtRecaudacion,
                    app_log_entity_1.AppLog
                ],
                synchronize: false,
                logging: ['error', 'warn'],
                options: {
                    encrypt: true,
                    trustServerCertificate: true,
                    connectTimeout: 30000
                }
            }),
            schedule_1.ScheduleModule.forRoot(),
            bullmq_1.BullModule.forRoot({
                connection: {
                    host: 'localhost',
                    port: 6379,
                },
            }),
            common_module_1.CommonModule,
            trips_module_1.TripsModule,
            drivers_module_1.DriversModule,
            transport_units_module_1.TransportUnitsModule,
            auth_module_1.AuthModule,
            management_module_1.ManagementModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map