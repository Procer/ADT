import { PricingEngineService } from './pricing-engine.service';
export declare class PricingController {
    private readonly pricingEngine;
    constructor(pricingEngine: PricingEngineService);
    deletePricingRule(id: string, role: string): Promise<import("typeorm").DeleteResult>;
}
