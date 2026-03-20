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
exports.AppLog = exports.LogLevel = void 0;
const typeorm_1 = require("typeorm");
var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["CRITICAL"] = "CRITICAL";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
let AppLog = class AppLog {
    id;
    timestamp;
    contexto;
    level;
    mensaje;
    metadata;
    userId;
    tenantId;
};
exports.AppLog = AppLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AppLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'ts_log' }),
    __metadata("design:type", Date)
], AppLog.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contexto', length: 100 }),
    __metadata("design:type", String)
], AppLog.prototype, "contexto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'level', type: 'varchar', length: 20, default: LogLevel.ERROR }),
    __metadata("design:type", String)
], AppLog.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mensaje', type: 'text' }),
    __metadata("design:type", String)
], AppLog.prototype, "mensaje", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metadata', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AppLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', nullable: true }),
    __metadata("design:type", Object)
], AppLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id', nullable: true }),
    __metadata("design:type", Object)
], AppLog.prototype, "tenantId", void 0);
exports.AppLog = AppLog = __decorate([
    (0, typeorm_1.Entity)('app_logs')
], AppLog);
//# sourceMappingURL=app-log.entity.js.map