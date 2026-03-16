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
exports.Salesperson = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
let Salesperson = class Salesperson {
    id;
    nombre;
    email;
    porcentajeComision;
    bonoActivacion;
    tenants;
    createdAt;
};
exports.Salesperson = Salesperson;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Salesperson.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Salesperson.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Salesperson.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'porcentaje_comision', type: 'decimal', precision: 5, scale: 2, default: 10.00 }),
    __metadata("design:type", Number)
], Salesperson.prototype, "porcentajeComision", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bono_activacion', type: 'decimal', precision: 12, scale: 2, default: 0.00 }),
    __metadata("design:type", Number)
], Salesperson.prototype, "bonoActivacion", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => tenant_entity_1.Tenant, tenant => tenant.salesperson),
    __metadata("design:type", Array)
], Salesperson.prototype, "tenants", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Salesperson.prototype, "createdAt", void 0);
exports.Salesperson = Salesperson = __decorate([
    (0, typeorm_1.Entity)('salespersons')
], Salesperson);
//# sourceMappingURL=salesperson.entity.js.map