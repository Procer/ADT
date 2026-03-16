"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const audit_log_entity_1 = require("../database/entities/audit-log.entity");
const trips_service_1 = require("./trips.service");
const trips_controller_1 = require("./trips.controller");
const carta_porte_entity_1 = require("../database/entities/carta-porte.entity");
const travel_credit_entity_1 = require("../database/entities/travel-credit.entity");
const tenant_pricing_entity_1 = require("../database/entities/tenant-pricing.entity");
const driver_entity_1 = require("../database/entities/driver.entity");
const transport_unit_entity_1 = require("../database/entities/transport-unit.entity");
const gps_tracking_entity_1 = require("../database/entities/gps-tracking.entity");
const gps_tracking_service_1 = require("./gps-tracking.service");
const trip_closure_service_1 = require("./trip-closure.service");
const gps_gateway_1 = require("./gps.gateway");
const bullmq_1 = require("@nestjs/bullmq");
const gps_processor_1 = require("./gps.processor");
const management_module_1 = require("../management/management.module");
const client_entity_1 = require("../database/entities/client.entity");
const wallet_balance_entity_1 = require("../database/entities/wallet-balance.entity");
const tenant_entity_1 = require("../database/entities/tenant.entity");
const system_config_entity_1 = require("../database/entities/system-config.entity");
let TripsModule = class TripsModule {
};
exports.TripsModule = TripsModule;
exports.TripsModule = TripsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                carta_porte_entity_1.CartaPorte,
                client_entity_1.Client,
                travel_credit_entity_1.TravelCredit,
                tenant_pricing_entity_1.TenantPricing,
                driver_entity_1.Driver,
                transport_unit_entity_1.TransportUnit,
                gps_tracking_entity_1.GpsTracking,
                audit_log_entity_1.AuditLog,
                wallet_balance_entity_1.WalletBalance,
                tenant_entity_1.Tenant,
                system_config_entity_1.SystemConfig
            ]),
            bullmq_1.BullModule.registerQueue({
                name: 'gps-ping-queue',
            }),
            (0, common_1.forwardRef)(() => management_module_1.ManagementModule),
        ],
        controllers: [trips_controller_1.TripsController],
        providers: [trips_service_1.TripsService, gps_tracking_service_1.GpsTrackingService, trip_closure_service_1.TripClosureService, gps_gateway_1.GpsGateway, gps_processor_1.GpsProcessor],
        exports: [trips_service_1.TripsService, typeorm_1.TypeOrmModule],
    })
], TripsModule);
//# sourceMappingURL=trips.module.js.map