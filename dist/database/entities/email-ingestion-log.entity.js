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
exports.EmailIngestionLog = void 0;
const typeorm_1 = require("typeorm");
let EmailIngestionLog = class EmailIngestionLog {
    id;
    tenantId;
    remitente;
    asunto;
    cuerpoRaw;
    jsonExtraido;
    estadoIngesta;
    errorDetalle;
    createdAt;
};
exports.EmailIngestionLog = EmailIngestionLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", String)
], EmailIngestionLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], EmailIngestionLog.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailIngestionLog.prototype, "remitente", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'nvarchar', length: 'max' }),
    __metadata("design:type", String)
], EmailIngestionLog.prototype, "asunto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cuerpo_raw', type: 'nvarchar', length: 'max' }),
    __metadata("design:type", String)
], EmailIngestionLog.prototype, "cuerpoRaw", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'json_extraido', type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], EmailIngestionLog.prototype, "jsonExtraido", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estado_ingesta', length: 50 }),
    __metadata("design:type", String)
], EmailIngestionLog.prototype, "estadoIngesta", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_detalle', type: 'nvarchar', length: 'max', nullable: true }),
    __metadata("design:type", String)
], EmailIngestionLog.prototype, "errorDetalle", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], EmailIngestionLog.prototype, "createdAt", void 0);
exports.EmailIngestionLog = EmailIngestionLog = __decorate([
    (0, typeorm_1.Entity)('email_ingestion_logs')
], EmailIngestionLog);
//# sourceMappingURL=email-ingestion-log.entity.js.map