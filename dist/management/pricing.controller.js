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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingController = void 0;
const common_1 = require("@nestjs/common");
const pricing_engine_service_1 = require("./pricing-engine.service");
const public_decorator_1 = require("../auth/public.decorator");
let PricingController = class PricingController {
    pricingEngine;
    constructor(pricingEngine) {
        this.pricingEngine = pricingEngine;
    }
    async deletePricingRule(id, role) {
        if (role !== 'SUPER_ADMIN') {
            throw new common_1.BadRequestException('Solo el Dueño de ADT puede eliminar registros.');
        }
        console.log(`[PRICING CONTROLLER] Eliminando tarifa ID: ${id} solicitado por ${role}`);
        return this.pricingEngine.deleteRule(id, role);
    }
};
exports.PricingController = PricingController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Delete)('rules/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "deletePricingRule", null);
exports.PricingController = PricingController = __decorate([
    (0, common_1.Controller)('pricing'),
    __metadata("design:paramtypes", [pricing_engine_service_1.PricingEngineService])
], PricingController);
//# sourceMappingURL=pricing.controller.js.map