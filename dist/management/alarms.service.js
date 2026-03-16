"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AlarmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlarmsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const driver_entity_1 = require("../database/entities/driver.entity");
const transport_unit_entity_1 = require("../database/entities/transport-unit.entity");
const audit_log_entity_1 = require("../database/entities/audit-log.entity");
const schedule_1 = require("@nestjs/schedule");
let AlarmsService = AlarmsService_1 = class AlarmsService {
    driverRepo;
    unitRepo;
    auditRepo;
    logger = new common_1.Logger(AlarmsService_1.name);
    constructor(driverRepo, unitRepo, auditRepo) {
        this.driverRepo = driverRepo;
        this.unitRepo = unitRepo;
        this.auditRepo = auditRepo;
    }
    async checkExpirations() {
        this.logger.log('Starting daily document expiration check...');
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const expiringDrivers = await this.driverRepo.find({
            where: {
                vencimientoLicencia: (0, typeorm_2.LessThanOrEqual)(thirtyDaysFromNow.toISOString())
            }
        });
        for (const driver of expiringDrivers) {
            await this.createAlert('ALERTA_VENCIMIENTO_LICENCIA', `La licencia del chofer ${driver.nombre} vence el ${driver.vencimientoLicencia}`, driver.tenantId, { driverId: driver.id, type: 'LICENCIA' });
        }
        const expiringUnits = await this.unitRepo.find({
            where: [
                { vencimientoVTV: (0, typeorm_2.LessThanOrEqual)(thirtyDaysFromNow) },
                { vencimientoSeguro: (0, typeorm_2.LessThanOrEqual)(thirtyDaysFromNow) },
                { vencimientoRuta: (0, typeorm_2.LessThanOrEqual)(thirtyDaysFromNow) }
            ]
        });
        for (const unit of expiringUnits) {
            if (unit.vencimientoVTV && unit.vencimientoVTV <= thirtyDaysFromNow) {
                await this.createAlert('ALERTA_VENCIMIENTO_VTV', `VTV de unidad ${unit.patente} vence el ${unit.vencimientoVTV}`, unit.tenantId, { unitId: unit.id, type: 'VTV' });
            }
            if (unit.vencimientoSeguro && unit.vencimientoSeguro <= thirtyDaysFromNow) {
                await this.createAlert('ALERTA_VENCIMIENTO_SEGURO', `Seguro de unidad ${unit.patente} vence el ${unit.vencimientoSeguro}`, unit.tenantId, { unitId: unit.id, type: 'SEGURO' });
            }
            if (unit.vencimientoRuta && unit.vencimientoRuta <= thirtyDaysFromNow) {
                await this.createAlert('ALERTA_VENCIMIENTO_RUTA', `Ruta de unidad ${unit.patente} vence el ${unit.vencimientoRuta}`, unit.tenantId, { unitId: unit.id, type: 'RUTA' });
            }
        }
        this.logger.log(`Check completed. Found ${expiringDrivers.length} drivers and ${expiringUnits.length} units with upcoming expirations.`);
    }
    async createAlert(accion, descripcion, tenantId, data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await this.auditRepo.findOne({
            where: {
                accion,
                fecha: (0, typeorm_2.MoreThan)(today)
            }
        });
        if (existing) {
            const details = typeof existing.dataNueva === 'string' ? JSON.parse(existing.dataNueva) : existing.dataNueva;
            if (details?.unitId === data.unitId && details?.driverId === data.driverId)
                return;
        }
        const log = this.auditRepo.create({
            accion,
            descripcion,
            dataNueva: data
        });
        await this.auditRepo.save(log);
    }
};
exports.AlarmsService = AlarmsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlarmsService.prototype, "checkExpirations", null);
exports.AlarmsService = AlarmsService = AlarmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(driver_entity_1.Driver)),
    __param(1, (0, typeorm_1.InjectRepository)(transport_unit_entity_1.TransportUnit)),
    __param(2, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AlarmsService);
//# sourceMappingURL=alarms.service.js.map