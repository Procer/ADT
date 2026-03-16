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
exports.TransportUnit = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
const carta_porte_entity_1 = require("./carta-porte.entity");
let TransportUnit = class TransportUnit {
    id;
    tenantId;
    vencimientoVTV;
    vencimientoSeguro;
    vencimientoRuta;
    odometroActual;
    kmInicial;
    tenant;
    patente;
    marca;
    modelo;
    statusHabilitacion;
    trips;
};
exports.TransportUnit = TransportUnit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TransportUnit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], TransportUnit.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vencimiento_vtv', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], TransportUnit.prototype, "vencimientoVTV", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vencimiento_seguro', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], TransportUnit.prototype, "vencimientoSeguro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vencimiento_ruta', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], TransportUnit.prototype, "vencimientoRuta", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'odometro_actual', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TransportUnit.prototype, "odometroActual", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'km_inicial', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TransportUnit.prototype, "kmInicial", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant, tenant => tenant.units),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], TransportUnit.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], TransportUnit.prototype, "patente", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TransportUnit.prototype, "marca", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TransportUnit.prototype, "modelo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status_habilitacion', default: true }),
    __metadata("design:type", Boolean)
], TransportUnit.prototype, "statusHabilitacion", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => carta_porte_entity_1.CartaPorte, trip => trip.unidad),
    __metadata("design:type", Array)
], TransportUnit.prototype, "trips", void 0);
exports.TransportUnit = TransportUnit = __decorate([
    (0, typeorm_1.Entity)('transport_units'),
    (0, typeorm_1.Unique)(['tenantId', 'patente'])
], TransportUnit);
//# sourceMappingURL=transport-unit.entity.js.map