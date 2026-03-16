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
exports.TenantPricing = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
let TenantPricing = class TenantPricing {
    id;
    tenantId;
    tenant;
    precioCp;
    moneda;
    fechaDesde;
};
exports.TenantPricing = TenantPricing;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TenantPricing.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], TenantPricing.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant, tenant => tenant.pricings),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], TenantPricing.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2, name: 'precio_cp' }),
    __metadata("design:type", Number)
], TenantPricing.prototype, "precioCp", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'ARS' }),
    __metadata("design:type", String)
], TenantPricing.prototype, "moneda", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_desde' }),
    __metadata("design:type", Date)
], TenantPricing.prototype, "fechaDesde", void 0);
exports.TenantPricing = TenantPricing = __decorate([
    (0, typeorm_1.Entity)('tenant_pricing')
], TenantPricing);
//# sourceMappingURL=tenant-pricing.entity.js.map