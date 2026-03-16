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
exports.Driver = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
const carta_porte_entity_1 = require("./carta-porte.entity");
let Driver = class Driver {
    id;
    tenantId;
    fechaNacimiento;
    fechaIngreso;
    telefonoEmergencia;
    tenant;
    nombre;
    dni;
    email;
    telegramUser;
    telegramChatId;
    telefono;
    licenciaNumero;
    licenciaCategoria;
    art;
    vencimientoLicencia;
    scoreConfianza;
    pin;
    deviceIdVinculado;
    paymentCycle;
    ultimoLogin;
    trips;
};
exports.Driver = Driver;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Driver.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], Driver.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_nacimiento', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Driver.prototype, "fechaNacimiento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_ingreso', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Driver.prototype, "fechaIngreso", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telefono_emergencia', nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "telefonoEmergencia", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant, tenant => tenant.drivers),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], Driver.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Driver.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "dni", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telegram_user', nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "telegramUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telegram_chat_id', nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "telegramChatId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'licencia_numero', nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "licenciaNumero", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'licencia_categoria', nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "licenciaCategoria", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "art", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vencimiento_licencia', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Driver.prototype, "vencimientoLicencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'score_confianza', default: 100 }),
    __metadata("design:type", Number)
], Driver.prototype, "scoreConfianza", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "pin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_id_vinculado', nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "deviceIdVinculado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_cycle', type: 'nvarchar', length: 20, default: 'SEMANAL' }),
    __metadata("design:type", String)
], Driver.prototype, "paymentCycle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ultimo_login', nullable: true }),
    __metadata("design:type", Date)
], Driver.prototype, "ultimoLogin", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => carta_porte_entity_1.CartaPorte, trip => trip.chofer),
    __metadata("design:type", Array)
], Driver.prototype, "trips", void 0);
exports.Driver = Driver = __decorate([
    (0, typeorm_1.Entity)('drivers')
], Driver);
//# sourceMappingURL=driver.entity.js.map