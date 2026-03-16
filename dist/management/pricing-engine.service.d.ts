import { Repository } from 'typeorm';
import { PricingRule } from '../database/entities/pricing-rule.entity';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { Client } from '../database/entities/client.entity';
export declare class PricingEngineService {
    private pricingRepo;
    private tripRepo;
    private clientRepo;
    private readonly logger;
    constructor(pricingRepo: Repository<PricingRule>, tripRepo: Repository<CartaPorte>, clientRepo: Repository<Client>);
    calculatePrice(params: {
        tenantId: string;
        entityId: string;
        entityType: 'DADOR' | 'CHOFER';
        tripDate: Date;
        distanceKm?: number;
        tonnage?: number;
        hoursWait?: number;
        isNight?: boolean;
        overrideRule?: any;
    }): Promise<{
        price: number;
        ruleInfo: string;
    }>;
    simulateImpact(newRuleProposal: Partial<PricingRule>): Promise<{
        viajesAnalizados: number;
        message: string;
        anteriorTotal?: undefined;
        nuevoTotal?: undefined;
        diferenciaAbsoluta?: undefined;
        impactoPorcentaje?: undefined;
    } | {
        viajesAnalizados: number;
        anteriorTotal: number;
        nuevoTotal: number;
        diferenciaAbsoluta: number;
        impactoPorcentaje: number;
        message?: undefined;
    }>;
    deleteRule(ruleId: string, userRole: string): Promise<import("typeorm").DeleteResult>;
    recalculatePendingTrips(tenantId: string, entityId: string, entityType: 'DADOR' | 'CHOFER'): Promise<{
        updated: number;
    }>;
}
