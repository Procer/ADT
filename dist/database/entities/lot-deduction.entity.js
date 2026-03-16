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
exports.LotDeduction = void 0;
const typeorm_1 = require("typeorm");
const payment_lot_entity_1 = require("./payment-lot.entity");
let LotDeduction = class LotDeduction {
    id;
    paymentLotId;
    paymentLot;
    monto;
    descripcion;
    tipo;
};
exports.LotDeduction = LotDeduction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LotDeduction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_lot_id' }),
    __metadata("design:type", String)
], LotDeduction.prototype, "paymentLotId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => payment_lot_entity_1.PaymentLot, lot => lot.deducciones),
    (0, typeorm_1.JoinColumn)({ name: 'payment_lot_id' }),
    __metadata("design:type", payment_lot_entity_1.PaymentLot)
], LotDeduction.prototype, "paymentLot", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], LotDeduction.prototype, "monto", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LotDeduction.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo', length: 50 }),
    __metadata("design:type", String)
], LotDeduction.prototype, "tipo", void 0);
exports.LotDeduction = LotDeduction = __decorate([
    (0, typeorm_1.Entity)('lote_deducciones')
], LotDeduction);
//# sourceMappingURL=lot-deduction.entity.js.map