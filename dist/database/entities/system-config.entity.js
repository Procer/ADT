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
exports.SystemConfig = void 0;
const typeorm_1 = require("typeorm");
let SystemConfig = class SystemConfig {
    id;
    configKey;
    smtpConfig;
    telegramConfig;
    geminiApiKey;
    active;
    createdAt;
    updatedAt;
};
exports.SystemConfig = SystemConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SystemConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'GLOBAL_SETTINGS' }),
    __metadata("design:type", String)
], SystemConfig.prototype, "configKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], SystemConfig.prototype, "smtpConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], SystemConfig.prototype, "telegramConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gemini_api_key', nullable: true }),
    __metadata("design:type", String)
], SystemConfig.prototype, "geminiApiKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], SystemConfig.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SystemConfig.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SystemConfig.prototype, "updatedAt", void 0);
exports.SystemConfig = SystemConfig = __decorate([
    (0, typeorm_1.Entity)('system_config')
], SystemConfig);
//# sourceMappingURL=system-config.entity.js.map