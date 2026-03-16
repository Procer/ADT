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
exports.SettlementBatch = void 0;
const typeorm_1 = require("typeorm");
let SettlementBatch = class SettlementBatch {
    id;
    tenantId;
    entityType;
    entityId;
    periodStart;
    periodEnd;
    totalNet;
    status;
    pdfUrl;
    createdAt;
};
exports.SettlementBatch = SettlementBatch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SettlementBatch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uniqueidentifier' }),
    __metadata("design:type", String)
], SettlementBatch.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_type', type: 'nvarchar', length: 20 }),
    __metadata("design:type", String)
], SettlementBatch.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_id', type: 'uniqueidentifier' }),
    __metadata("design:type", String)
], SettlementBatch.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'period_start', type: 'date' }),
    __metadata("design:type", Date)
], SettlementBatch.prototype, "periodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'period_end', type: 'date' }),
    __metadata("design:type", Date)
], SettlementBatch.prototype, "periodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_net', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], SettlementBatch.prototype, "totalNet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'nvarchar', length: 20, default: 'OPEN' }),
    __metadata("design:type", String)
], SettlementBatch.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pdf_url', type: 'nvarchar', length: 'max', nullable: true }),
    __metadata("design:type", String)
], SettlementBatch.prototype, "pdfUrl", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SettlementBatch.prototype, "createdAt", void 0);
exports.SettlementBatch = SettlementBatch = __decorate([
    (0, typeorm_1.Entity)('settlement_batches')
], SettlementBatch);
//# sourceMappingURL=settlement-batch.entity.js.map