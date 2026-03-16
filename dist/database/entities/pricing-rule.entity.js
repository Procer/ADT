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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingRule = void 0;
const typeorm_1 = require("typeorm");
let PricingRule = class PricingRule {
    id;
    tenantId;
    entityType;
    entityId;
    baseCalculation;
    baseValue;
    conditionals;
    validFrom;
    validTo;
    createdAt;
};
exports.PricingRule = PricingRule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PricingRule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uniqueidentifier' }),
    __metadata("design:type", String)
], PricingRule.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_type', type: 'nvarchar', length: 20 }),
    __metadata("design:type", String)
], PricingRule.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_id', type: 'uniqueidentifier' }),
    __metadata("design:type", String)
], PricingRule.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'base_calculation', type: 'nvarchar', length: 20 }),
    __metadata("design:type", String)
], PricingRule.prototype, "baseCalculation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'base_value', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], PricingRule.prototype, "baseValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], PricingRule.prototype, "conditionals", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valid_from', type: 'datetime2' }),
    __metadata("design:type", Date)
], PricingRule.prototype, "validFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valid_to', type: 'datetime2', nullable: true }),
    __metadata("design:type", Date)
], PricingRule.prototype, "validTo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PricingRule.prototype, "createdAt", void 0);
exports.PricingRule = PricingRule = __decorate([
    (0, typeorm_1.Entity)('pricing_rules')
], PricingRule);
//# sourceMappingURL=pricing-rule.entity.js.map