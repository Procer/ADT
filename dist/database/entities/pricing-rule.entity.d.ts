export declare class PricingRule {
    id: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    baseCalculation: string;
    baseValue: number;
    conditionals: {
        espera_hora?: number;
        nocturno_plus?: number;
        umbral_espera_hs?: number;
        [key: string]: any;
    };
    validFrom: Date;
    validTo: Date;
    createdAt: Date;
}
