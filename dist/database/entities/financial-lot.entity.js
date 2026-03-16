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
exports.FinancialLot = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
const client_entity_1 = require("./client.entity");
const carta_porte_entity_1 = require("./carta-porte.entity");
let FinancialLot = class FinancialLot {
    id;
    tenantId;
    tenant;
    clientId;
    client;
    totalNeto;
    status;
    proformaPath;
    createdAt;
    updatedAt;
    trips;
};
exports.FinancialLot = FinancialLot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FinancialLot.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], FinancialLot.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], FinancialLot.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id', type: 'uuid' }),
    __metadata("design:type", String)
], FinancialLot.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => client_entity_1.Client),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", client_entity_1.Client)
], FinancialLot.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'total_neto', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FinancialLot.prototype, "totalNeto", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'PENDIENTE' }),
    __metadata("design:type", String)
], FinancialLot.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proforma_path', nullable: true }),
    __metadata("design:type", String)
], FinancialLot.prototype, "proformaPath", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], FinancialLot.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], FinancialLot.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => carta_porte_entity_1.CartaPorte, trip => trip.financialLot),
    __metadata("design:type", Array)
], FinancialLot.prototype, "trips", void 0);
exports.FinancialLot = FinancialLot = __decorate([
    (0, typeorm_1.Entity)('financial_lotes')
], FinancialLot);
//# sourceMappingURL=financial-lot.entity.js.map