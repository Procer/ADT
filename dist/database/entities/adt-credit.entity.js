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
exports.AdtCredit = void 0;
const typeorm_1 = require("typeorm");
const client_entity_1 = require("./client.entity");
let AdtCredit = class AdtCredit {
    id;
    clientId;
    client;
    tripIdOriginal;
    montoNominalOriginal;
    status;
    createdAt;
};
exports.AdtCredit = AdtCredit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AdtCredit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id', type: 'uuid' }),
    __metadata("design:type", String)
], AdtCredit.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => client_entity_1.Client),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", client_entity_1.Client)
], AdtCredit.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trip_id_original', type: 'uuid' }),
    __metadata("design:type", String)
], AdtCredit.prototype, "tripIdOriginal", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'monto_nominal_original', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], AdtCredit.prototype, "montoNominalOriginal", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'DISPONIBLE' }),
    __metadata("design:type", String)
], AdtCredit.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AdtCredit.prototype, "createdAt", void 0);
exports.AdtCredit = AdtCredit = __decorate([
    (0, typeorm_1.Entity)('adt_credits')
], AdtCredit);
//# sourceMappingURL=adt-credit.entity.js.map