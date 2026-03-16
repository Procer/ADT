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
var PricingEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingEngineService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pricing_rule_entity_1 = require("../database/entities/pricing-rule.entity");
const carta_porte_entity_1 = require("../database/entities/carta-porte.entity");
const client_entity_1 = require("../database/entities/client.entity");
let PricingEngineService = PricingEngineService_1 = class PricingEngineService {
    pricingRepo;
    tripRepo;
    clientRepo;
    logger = new common_1.Logger(PricingEngineService_1.name);
    constructor(pricingRepo, tripRepo, clientRepo) {
        this.pricingRepo = pricingRepo;
        this.tripRepo = tripRepo;
        this.clientRepo = clientRepo;
    }
    async calculatePrice(params) {
        let rule = params.overrideRule;
        if (!rule) {
            rule = await this.pricingRepo.findOne({
                where: {
                    tenantId: params.tenantId,
                    entityId: params.entityId,
                    entityType: params.entityType,
                    validFrom: (0, typeorm_2.LessThanOrEqual)(params.tripDate),
                    validTo: (0, typeorm_2.Raw)(alias => `(${alias} IS NULL OR ${alias} >= :date)`, { date: params.tripDate })
                },
                order: { validFrom: 'DESC' }
            });
        }
        if (!rule) {
            if (params.entityType === 'DADOR') {
                const client = await this.clientRepo.findOne({ where: { id: params.entityId } });
                if (client && Number(client.precioPorCp) > 0) {
                    return { price: Number(client.precioPorCp), ruleInfo: 'Tarifa Fija Dador' };
                }
            }
            return { price: 0, ruleInfo: 'Sin Tarifa' };
        }
        let total = 0;
        const baseVal = Number(rule.baseValue || 0);
        let ruleDesc = '';
        switch (rule.baseCalculation) {
            case 'KM':
                total = (Number(params.distanceKm) || 0) * baseVal;
                ruleDesc = `KM x $${baseVal}`;
                break;
            case 'TON':
                total = (Number(params.tonnage) || 0) * baseVal;
                ruleDesc = `TON x $${baseVal}`;
                break;
            case 'FIXED':
                total = baseVal;
                ruleDesc = `Tarifa Plana $${baseVal}`;
                break;
            default:
                total = baseVal;
                ruleDesc = `Fija $${baseVal}`;
        }
        const cond = rule.conditionals;
        if (cond) {
            if (params.hoursWait && cond.espera_hora && params.hoursWait > (cond.umbral_espera_hs || 0)) {
                total += (params.hoursWait - (cond.umbral_espera_hs || 0)) * Number(cond.espera_hora);
                ruleDesc += ` + Espera`;
            }
            let isNightTrip = params.isNight;
            if (isNightTrip === undefined) {
                const hour = params.tripDate.getHours();
                isNightTrip = hour >= 22 || hour < 6;
            }
            if (isNightTrip && cond.nocturno_plus) {
                total += Number(cond.nocturno_plus);
                ruleDesc += ` + Nocturno`;
            }
        }
        return { price: total, ruleInfo: ruleDesc };
    }
    async simulateImpact(newRuleProposal) {
        if (!newRuleProposal.entityId || !newRuleProposal.entityType) {
            throw new Error('Datos insuficientes para la simulación.');
        }
        let effectiveTenantId = newRuleProposal.tenantId;
        if (!effectiveTenantId || effectiveTenantId === 'null' || effectiveTenantId === 'undefined') {
            if (newRuleProposal.entityType === 'DADOR') {
                const client = await this.clientRepo.findOne({ where: { id: newRuleProposal.entityId } });
                effectiveTenantId = client?.tenantId;
            }
            else {
                const driver = await this.pricingRepo.manager.getRepository('Driver').findOne({ where: { id: newRuleProposal.entityId } });
                effectiveTenantId = driver?.tenantId;
            }
        }
        if (!effectiveTenantId)
            throw new Error('No se pudo determinar la empresa logística.');
        const lastTrips = await this.tripRepo.find({
            where: {
                tenantId: effectiveTenantId,
                ...(newRuleProposal.entityType === 'DADOR' ? { clientId: newRuleProposal.entityId } : { choferId: newRuleProposal.entityId })
            },
            take: 10,
            order: { tsCreacion: 'DESC' }
        });
        const filteredTrips = lastTrips.filter(t => t.estado !== 'ANULADO' && t.estado !== 'VOID_CREDIT');
        if (filteredTrips.length === 0) {
            return { viajesAnalizados: 0, message: 'No hay viajes previos para simular impacto.' };
        }
        let oldTotal = 0;
        let newTotal = 0;
        for (const trip of filteredTrips) {
            const currentVal = newRuleProposal.entityType === 'DADOR'
                ? Number(trip.revenueAtExecution || trip.precioCongelado || 0)
                : Number(trip.costAtExecution || 0);
            oldTotal += currentVal;
            const { price: simulatedVal } = await this.calculatePrice({
                tenantId: effectiveTenantId,
                entityId: newRuleProposal.entityId,
                entityType: newRuleProposal.entityType,
                tripDate: new Date(),
                distanceKm: Number(trip.distanciaTotalRecorridaKm || 0),
                tonnage: Number(trip.pesoToneladas || 0),
                overrideRule: {
                    baseCalculation: newRuleProposal.baseCalculation,
                    baseValue: newRuleProposal.baseValue,
                    conditionals: newRuleProposal.conditionals
                }
            });
            newTotal += simulatedVal;
        }
        return {
            viajesAnalizados: filteredTrips.length,
            anteriorTotal: oldTotal,
            nuevoTotal: newTotal,
            diferenciaAbsoluta: newTotal - oldTotal,
            impactoPorcentaje: oldTotal > 0 ? ((newTotal - oldTotal) / oldTotal) * 100 : 0
        };
    }
    async deleteRule(ruleId, userRole) {
        if (userRole !== 'SUPER_ADMIN') {
            throw new Error('Solo el Dueño de ADT puede eliminar registros históricos de tarifas.');
        }
        return this.pricingRepo.delete(ruleId);
    }
    async recalculatePendingTrips(tenantId, entityId, entityType) {
        this.logger.log(`[PRICING SYNC] Recalculando viajes pendientes para ${entityType} ${entityId}...`);
        const trips = await this.tripRepo.find({
            where: {
                tenantId,
                ...(entityType === 'DADOR' ? { clientId: entityId, financialLotId: (0, typeorm_2.IsNull)() } : { choferId: entityId, paymentLotId: (0, typeorm_2.IsNull)() }),
                estado: (0, typeorm_2.Raw)(alias => `${alias} NOT IN ('ANULADO', 'VOID_CREDIT')`)
            }
        });
        if (trips.length === 0)
            return { updated: 0 };
        let updatedCount = 0;
        for (const trip of trips) {
            const { price: newPrice, ruleInfo } = await this.calculatePrice({
                tenantId,
                entityId,
                entityType,
                tripDate: new Date(trip.tsCreacion),
                distanceKm: Number(trip.distanciaTotalRecorridaKm || 0),
                tonnage: Number(trip.pesoToneladas || 0)
            });
            if (entityType === 'DADOR') {
                trip.revenueAtExecution = newPrice;
                trip.appliedRuleInfo = ruleInfo;
            }
            else {
                trip.costAtExecution = newPrice;
            }
            await this.tripRepo.save(trip);
            updatedCount++;
        }
        this.logger.log(`[PRICING SYNC] Finalizado. ${updatedCount} viajes actualizados.`);
        return { updated: updatedCount };
    }
};
exports.PricingEngineService = PricingEngineService;
exports.PricingEngineService = PricingEngineService = PricingEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pricing_rule_entity_1.PricingRule)),
    __param(1, (0, typeorm_1.InjectRepository)(carta_porte_entity_1.CartaPorte)),
    __param(2, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PricingEngineService);
//# sourceMappingURL=pricing-engine.service.js.map