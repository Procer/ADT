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
exports.TravelCredit = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
let TravelCredit = class TravelCredit {
    id;
    tenantId;
    tenant;
    clientId;
    precioPagadoNominal;
    patenteVinculada;
    choferVinculado;
    usado;
    createdAt;
};
exports.TravelCredit = TravelCredit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TravelCredit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], TravelCredit.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant, tenant => tenant.credits),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], TravelCredit.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id', nullable: true }),
    __metadata("design:type", String)
], TravelCredit.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'precio_pagado_nominal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], TravelCredit.prototype, "precioPagadoNominal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'patente_vinculada', length: 20, nullable: true }),
    __metadata("design:type", String)
], TravelCredit.prototype, "patenteVinculada", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chofer_vinculado', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TravelCredit.prototype, "choferVinculado", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], TravelCredit.prototype, "usado", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TravelCredit.prototype, "createdAt", void 0);
exports.TravelCredit = TravelCredit = __decorate([
    (0, typeorm_1.Entity)('travel_credits')
], TravelCredit);
//# sourceMappingURL=travel-credit.entity.js.map