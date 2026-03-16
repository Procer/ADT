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
exports.Tenant = void 0;
const typeorm_1 = require("typeorm");
const tenant_pricing_entity_1 = require("./tenant-pricing.entity");
const transport_unit_entity_1 = require("./transport-unit.entity");
const driver_entity_1 = require("./driver.entity");
const carta_porte_entity_1 = require("./carta-porte.entity");
const travel_credit_entity_1 = require("./travel-credit.entity");
const salesperson_entity_1 = require("./salesperson.entity");
let Tenant = class Tenant {
    id;
    nombreEmpresa;
    config;
    logoUrl;
    telegramChatId;
    imapHost;
    imapPort;
    imapUser;
    imapPass;
    geminiApiKey;
    smtpHost;
    smtpPort;
    smtpUser;
    smtpPass;
    smtpFrom;
    smtpSecure;
    limiteCreditoGlobal;
    deudaActual;
    activo;
    createdAt;
    salespersonId;
    salesperson;
    pricings;
    units;
    drivers;
    trips;
    credits;
};
exports.Tenant = Tenant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Tenant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_empresa' }),
    __metadata("design:type", String)
], Tenant.prototype, "nombreEmpresa", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: '{"radio_geocerca": 500, "moneda": "ARS", "frecuencia_gps": 120}' }),
    __metadata("design:type", Object)
], Tenant.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logo_url', nullable: true }),
    __metadata("design:type", String)
], Tenant.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telegram_chat_id', nullable: true }),
    __metadata("design:type", String)
], Tenant.prototype, "telegramChatId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'imap_host', nullable: true }),
    __metadata("design:type", String)
], Tenant.prototype, "imapHost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'imap_port', type: 'int', nullable: true, default: 993 }),
    __metadata("design:type", Number)
], Tenant.prototype, "imapPort", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'imap_user', nullable: true }),
    __metadata("design:type", String)
], Tenant.prototype, "imapUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'imap_pass', nullable: true }),
    __metadata("design:type", String)
], Tenant.prototype, "imapPass", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gemini_api_key', nullable: true }),
    __metadata("design:type", String)
], Tenant.prototype, "geminiApiKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'smtp_host', nullable: true }),
    __metadata("design:type", String)
], Tenant.prototype, "smtpHost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'smtp_port', type: 'int', nullable: true, default: 587 }),
    __metadata("design:type", Number)
], Tenant.prototype, "smtpPort", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'smtp_user', nullable: true }),
    __metadata("design:type", String)
], Tenant.prototype, "smtpUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'smtp_pass', nullable: true }),
    __metadata("design:type", String)
], Tenant.prototype, "smtpPass", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'smtp_from', nullable: true }),
    __metadata("design:type", String)
], Tenant.prototype, "smtpFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'smtp_secure', default: false }),
    __metadata("design:type", Boolean)
], Tenant.prototype, "smtpSecure", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'limite_credito_global', type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Tenant.prototype, "limiteCreditoGlobal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deuda_actual', type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Tenant.prototype, "deudaActual", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Tenant.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Tenant.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'salesperson_id', nullable: true }),
    __metadata("design:type", String)
], Tenant.prototype, "salespersonId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => salesperson_entity_1.Salesperson, salesperson => salesperson.tenants, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'salesperson_id' }),
    __metadata("design:type", salesperson_entity_1.Salesperson)
], Tenant.prototype, "salesperson", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => tenant_pricing_entity_1.TenantPricing, pricing => pricing.tenant),
    __metadata("design:type", Array)
], Tenant.prototype, "pricings", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => transport_unit_entity_1.TransportUnit, unit => unit.tenant),
    __metadata("design:type", Array)
], Tenant.prototype, "units", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => driver_entity_1.Driver, driver => driver.tenant),
    __metadata("design:type", Array)
], Tenant.prototype, "drivers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => carta_porte_entity_1.CartaPorte, trip => trip.tenant),
    __metadata("design:type", Array)
], Tenant.prototype, "trips", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => travel_credit_entity_1.TravelCredit, credit => credit.tenant),
    __metadata("design:type", Array)
], Tenant.prototype, "credits", void 0);
exports.Tenant = Tenant = __decorate([
    (0, typeorm_1.Entity)('tenants')
], Tenant);
//# sourceMappingURL=tenant.entity.js.map