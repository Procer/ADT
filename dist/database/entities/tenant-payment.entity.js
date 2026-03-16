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
exports.TenantPayment = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
let TenantPayment = class TenantPayment {
    id;
    tenantId;
    tenant;
    monto;
    referencia;
    metodoPago;
    comprobanteUrl;
    periodo;
    fechaPago;
    registradoPor;
};
exports.TenantPayment = TenantPayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TenantPayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], TenantPayment.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], TenantPayment.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], TenantPayment.prototype, "monto", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TenantPayment.prototype, "referencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metodo_pago', nullable: true }),
    __metadata("design:type", String)
], TenantPayment.prototype, "metodoPago", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comprobante_url', nullable: true, type: 'nvarchar', length: 'max' }),
    __metadata("design:type", String)
], TenantPayment.prototype, "comprobanteUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TenantPayment.prototype, "periodo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_pago' }),
    __metadata("design:type", Date)
], TenantPayment.prototype, "fechaPago", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'registrado_por', nullable: true }),
    __metadata("design:type", String)
], TenantPayment.prototype, "registradoPor", void 0);
exports.TenantPayment = TenantPayment = __decorate([
    (0, typeorm_1.Entity)('tenant_payments')
], TenantPayment);
//# sourceMappingURL=tenant-payment.entity.js.map