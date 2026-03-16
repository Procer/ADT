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
exports.WalletBalance = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
const client_entity_1 = require("./client.entity");
let WalletBalance = class WalletBalance {
    id;
    tenantId;
    clientId;
    tenant;
    client;
    saldoCreditos;
    lastUpdate;
};
exports.WalletBalance = WalletBalance;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WalletBalance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], WalletBalance.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id', nullable: true }),
    __metadata("design:type", Object)
], WalletBalance.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], WalletBalance.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => client_entity_1.Client),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", client_entity_1.Client)
], WalletBalance.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'saldo_creditos', default: 0 }),
    __metadata("design:type", Number)
], WalletBalance.prototype, "saldoCreditos", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'last_update' }),
    __metadata("design:type", Date)
], WalletBalance.prototype, "lastUpdate", void 0);
exports.WalletBalance = WalletBalance = __decorate([
    (0, typeorm_1.Entity)('billetera_saldos')
], WalletBalance);
//# sourceMappingURL=wallet-balance.entity.js.map