import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Raw, IsNull } from 'typeorm';
import { PricingRule } from '../database/entities/pricing-rule.entity';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { Client } from '../database/entities/client.entity';

@Injectable()
export class PricingEngineService {
    private readonly logger = new Logger(PricingEngineService.name);

    constructor(
        @InjectRepository(PricingRule)
        private pricingRepo: Repository<PricingRule>,
        @InjectRepository(CartaPorte)
        private tripRepo: Repository<CartaPorte>,
        @InjectRepository(Client)
        private clientRepo: Repository<Client>,
    ) { }

    /**
     * Motor de Reglas Determinístico
     * Si se provee overrideRule, se usa esa en lugar de buscar en la DB (útil para simulaciones).
     */
    async calculatePrice(params: {
        tenantId: string;
        entityId: string;
        entityType: 'DADOR' | 'CHOFER';
        tripDate: Date;
        distanceKm?: number;
        tonnage?: number;
        hoursWait?: number;
        isNight?: boolean;
        overrideRule?: any; // Para simulaciones
    }): Promise<{ price: number; ruleInfo: string }> {
        // 1. Obtener la regla (de los parámetros o de la DB)
        let rule = params.overrideRule;

        if (!rule) {
            rule = await this.pricingRepo.findOne({
                where: {
                    tenantId: params.tenantId,
                    entityId: params.entityId,
                    entityType: params.entityType,
                    validFrom: LessThanOrEqual(params.tripDate),
                    validTo: Raw(alias => `(${alias} IS NULL OR ${alias} >= :date)`, { date: params.tripDate })
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

        // 3. Cálculo Base
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

        // 4. Ladrillos Lógicos
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

    /**
     * Protocolo de Seguridad "Doble Chequeo"
     */
    async simulateImpact(newRuleProposal: Partial<PricingRule>) {
        if (!newRuleProposal.entityId || !newRuleProposal.entityType) {
            throw new Error('Datos insuficientes para la simulación.');
        }

        let effectiveTenantId = newRuleProposal.tenantId;
        if (!effectiveTenantId || effectiveTenantId === 'null' || effectiveTenantId === 'undefined') {
            if (newRuleProposal.entityType === 'DADOR') {
                const client = await this.clientRepo.findOne({ where: { id: newRuleProposal.entityId } });
                effectiveTenantId = client?.tenantId;
            } else {
                const driver = await this.pricingRepo.manager.getRepository('Driver').findOne({ where: { id: newRuleProposal.entityId } }) as any;
                effectiveTenantId = driver?.tenantId;
            }
        }

        if (!effectiveTenantId) throw new Error('No se pudo determinar la empresa logística.');

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
            // Valor histórico
            const currentVal = newRuleProposal.entityType === 'DADOR'
                ? Number(trip.revenueAtExecution || trip.precioCongelado || 0)
                : Number(trip.costAtExecution || 0);

            oldTotal += currentVal;

            // Simulación USANDO LA PROPUESTA (overrideRule)
            // Aseguramos que los condicionales se pasen correctamente
            const { price: simulatedVal } = await this.calculatePrice({
                tenantId: effectiveTenantId,
                entityId: newRuleProposal.entityId,
                entityType: newRuleProposal.entityType as any,
                tripDate: new Date(),
                distanceKm: Number(trip.distanciaTotalRecorridaKm || 0),
                tonnage: Number(trip.pesoToneladas || 0),
                overrideRule: {
                    baseCalculation: newRuleProposal.baseCalculation,
                    baseValue: newRuleProposal.baseValue,
                    conditionals: newRuleProposal.conditionals // Aquí vienen los extras
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

    async deleteRule(ruleId: string, userRole: string) {
        if (userRole !== 'SUPER_ADMIN') {
            throw new Error('Solo el Dueño de ADT puede eliminar registros históricos de tarifas.');
        }
        return this.pricingRepo.delete(ruleId);
    }

    /**
     * Recalcula el precio de todos los viajes pendientes que no han sido proformados/liquidados.
     * Se dispara automáticamente cuando se actualiza una regla de tarifa.
     */
    async recalculatePendingTrips(tenantId: string, entityId: string, entityType: 'DADOR' | 'CHOFER') {
        this.logger.log(`[PRICING SYNC] Recalculando viajes pendientes para ${entityType} ${entityId}...`);

        const trips = await this.tripRepo.find({
            where: {
                tenantId,
                ...(entityType === 'DADOR' ? { clientId: entityId, financialLotId: IsNull() } : { choferId: entityId, paymentLotId: IsNull() }),
                estado: Raw(alias => `${alias} NOT IN ('ANULADO', 'VOID_CREDIT')`)
            }
        });

        if (trips.length === 0) return { updated: 0 };

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
            } else {
                trip.costAtExecution = newPrice;
            }

            await this.tripRepo.save(trip);
            updatedCount++;
        }

        this.logger.log(`[PRICING SYNC] Finalizado. ${updatedCount} viajes actualizados.`);
        return { updated: updatedCount };
    }
}
