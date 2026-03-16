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
exports.User = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["TENANT_ADMIN"] = "TENANT_ADMIN";
    UserRole["CLIENT"] = "CLIENT";
})(UserRole || (exports.UserRole = UserRole = {}));
let User = class User {
    id;
    email;
    passwordHash;
    role;
    tenantId;
    tenant;
    clientId;
    nombreCompleto;
    telegramChatId;
    mustChangePassword;
    createdAt;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_hash' }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: UserRole.TENANT_ADMIN,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], User.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_completo' }),
    __metadata("design:type", String)
], User.prototype, "nombreCompleto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telegram_chat_id', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "telegramChatId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false, name: 'must_change_password' }),
    __metadata("design:type", Boolean)
], User.prototype, "mustChangePassword", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map