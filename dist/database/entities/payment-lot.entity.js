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
exports.PaymentLot = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
const driver_entity_1 = require("./driver.entity");
const lot_deduction_entity_1 = require("./lot-deduction.entity");
const carta_porte_entity_1 = require("./carta-porte.entity");
let PaymentLot = class PaymentLot {
    id;
    tenantId;
    tenant;
    choferId;
    chofer;
    totalBruto;
    deduccionesTotal;
    netoFinal;
    comprobantePath;
    createdAt;
    deducciones;
    trips;
};
exports.PaymentLot = PaymentLot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PaymentLot.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], PaymentLot.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], PaymentLot.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chofer_id', type: 'uuid' }),
    __metadata("design:type", String)
], PaymentLot.prototype, "choferId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => driver_entity_1.Driver),
    (0, typeorm_1.JoinColumn)({ name: 'chofer_id' }),
    __metadata("design:type", driver_entity_1.Driver)
], PaymentLot.prototype, "chofer", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'total_bruto', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PaymentLot.prototype, "totalBruto", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'deducciones_total', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PaymentLot.prototype, "deduccionesTotal", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'neto_final', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PaymentLot.prototype, "netoFinal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comprobante_path', nullable: true }),
    __metadata("design:type", String)
], PaymentLot.prototype, "comprobantePath", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PaymentLot.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lot_deduction_entity_1.LotDeduction, deduction => deduction.paymentLot),
    __metadata("design:type", Array)
], PaymentLot.prototype, "deducciones", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => carta_porte_entity_1.CartaPorte, trip => trip.paymentLot),
    __metadata("design:type", Array)
], PaymentLot.prototype, "trips", void 0);
exports.PaymentLot = PaymentLot = __decorate([
    (0, typeorm_1.Entity)('payment_lotes')
], PaymentLot);
//# sourceMappingURL=payment-lot.entity.js.map