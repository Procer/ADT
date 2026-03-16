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
exports.AuditLog = void 0;
const typeorm_1 = require("typeorm");
let AuditLog = class AuditLog {
    id;
    usuarioId;
    accion;
    descripcion;
    dataAnterior;
    dataNueva;
    tenantId;
    resuelto;
    comentarioResolucion;
    resueltoPor;
    fecha;
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'nvarchar', length: 255 }),
    __metadata("design:type", String)
], AuditLog.prototype, "accion", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', name: 'data_anterior', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "dataAnterior", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', name: 'data_nueva', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "dataNueva", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], AuditLog.prototype, "resuelto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comentario_resolucion', type: 'nvarchar', length: 'max', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "comentarioResolucion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resuelto_por', type: 'nvarchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "resueltoPor", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha' }),
    __metadata("design:type", Date)
], AuditLog.prototype, "fecha", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_logs')
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map