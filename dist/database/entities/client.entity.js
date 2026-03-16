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
exports.Client = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
const carta_porte_entity_1 = require("./carta-porte.entity");
let Client = class Client {
    id;
    nombreRazonSocial;
    email;
    tenantId;
    tenant;
    monedaPreferida;
    precioPorCp;
    notifyNewTrip;
    notifySpeeding;
    notifySettlement;
    asuntoClave;
    trips;
    createdAt;
};
exports.Client = Client;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Client.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_razon_social' }),
    __metadata("design:type", String)
], Client.prototype, "nombreRazonSocial", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Client.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], Client.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], Client.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'moneda_preferida', default: 'ARS', length: 3 }),
    __metadata("design:type", String)
], Client.prototype, "monedaPreferida", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'precio_por_cp', type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Client.prototype, "precioPorCp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notify_new_trip', default: true }),
    __metadata("design:type", Boolean)
], Client.prototype, "notifyNewTrip", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notify_speeding', default: true }),
    __metadata("design:type", Boolean)
], Client.prototype, "notifySpeeding", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notify_settlement', default: true }),
    __metadata("design:type", Boolean)
], Client.prototype, "notifySettlement", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'asunto_clave', default: 'SOLICITUD VIAJE' }),
    __metadata("design:type", String)
], Client.prototype, "asuntoClave", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => carta_porte_entity_1.CartaPorte, trip => trip.client),
    __metadata("design:type", Array)
], Client.prototype, "trips", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Client.prototype, "createdAt", void 0);
exports.Client = Client = __decorate([
    (0, typeorm_1.Entity)('clients')
], Client);
//# sourceMappingURL=client.entity.js.map