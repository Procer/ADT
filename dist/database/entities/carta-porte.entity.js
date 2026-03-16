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
exports.CartaPorte = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
const driver_entity_1 = require("./driver.entity");
const transport_unit_entity_1 = require("./transport-unit.entity");
const client_entity_1 = require("./client.entity");
const financial_lot_entity_1 = require("./financial-lot.entity");
const payment_lot_entity_1 = require("./payment-lot.entity");
const settlement_batch_entity_1 = require("./settlement-batch.entity");
let CartaPorte = class CartaPorte {
    id;
    tenantId;
    tenant;
    numeroSecuencial;
    choferId;
    chofer;
    unidadId;
    unidad;
    clientId;
    client;
    numeroCP;
    estado;
    origenNombre;
    origenLat;
    origenLng;
    destinoNombre;
    destinoLat;
    destinoLng;
    mercaderiaTipo;
    volumen;
    pesoToneladas;
    radioGeocercaKm;
    precioCongelado;
    precioDadorSnap;
    financialLotId;
    financialLot;
    paymentLotId;
    paymentLot;
    deudaUpcharge;
    montoAbonadoOriginal;
    pagoConfirmado;
    batchCobroId;
    settlementId;
    settlement;
    costAtExecution;
    revenueAtExecution;
    esCredito;
    montoUpcharge;
    tsCreacion;
    tsInicioReal;
    tsFinalizacionReal;
    tsCierreInterno;
    tsCierre;
    cierreMotivo;
    distanciaTotalRecorridaKm;
    reachedDestination;
    urlFotoRemito;
    appliedRuleInfo;
};
exports.CartaPorte = CartaPorte;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CartaPorte.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], CartaPorte.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant, tenant => tenant.trips),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], CartaPorte.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'numero_secuencial', nullable: true }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "numeroSecuencial", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chofer_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "choferId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => driver_entity_1.Driver, driver => driver.trips, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'chofer_id' }),
    __metadata("design:type", driver_entity_1.Driver)
], CartaPorte.prototype, "chofer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unidad_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "unidadId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => transport_unit_entity_1.TransportUnit, unit => unit.trips, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'unidad_id' }),
    __metadata("design:type", transport_unit_entity_1.TransportUnit)
], CartaPorte.prototype, "unidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => client_entity_1.Client, client => client.trips),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", client_entity_1.Client)
], CartaPorte.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'numero_cp', unique: true, nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "numeroCP", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'PENDIENTE' }),
    __metadata("design:type", String)
], CartaPorte.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'origen_nombre', nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "origenNombre", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'origen_lat', precision: 10, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "origenLat", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'origen_lng', precision: 11, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "origenLng", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'destino_nombre', nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "destinoNombre", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'destino_lat', precision: 10, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "destinoLat", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'destino_lng', precision: 11, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "destinoLng", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mercaderia_tipo', length: 255, nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "mercaderiaTipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'volumen', length: 100, nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "volumen", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'peso_toneladas', precision: 10, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "pesoToneladas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'radio_geocerca_km', default: 1 }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "radioGeocercaKm", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'precio_congelado', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "precioCongelado", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'precio_dador_snap', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "precioDadorSnap", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'financial_lot_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "financialLotId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => financial_lot_entity_1.FinancialLot, lot => lot.trips, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'financial_lot_id' }),
    __metadata("design:type", financial_lot_entity_1.FinancialLot)
], CartaPorte.prototype, "financialLot", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_lot_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "paymentLotId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => payment_lot_entity_1.PaymentLot, lot => lot.trips, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'payment_lot_id' }),
    __metadata("design:type", payment_lot_entity_1.PaymentLot)
], CartaPorte.prototype, "paymentLot", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'deuda_upcharge', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "deudaUpcharge", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'monto_abonado_original', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "montoAbonadoOriginal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pago_confirmado', default: false }),
    __metadata("design:type", Boolean)
], CartaPorte.prototype, "pagoConfirmado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'batch_cobro_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "batchCobroId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'settlement_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "settlementId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => settlement_batch_entity_1.SettlementBatch),
    (0, typeorm_1.JoinColumn)({ name: 'settlement_id' }),
    __metadata("design:type", settlement_batch_entity_1.SettlementBatch)
], CartaPorte.prototype, "settlement", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'cost_at_execution', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "costAtExecution", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'revenue_at_execution', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "revenueAtExecution", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'es_credito', default: false }),
    __metadata("design:type", Boolean)
], CartaPorte.prototype, "esCredito", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'monto_upcharge', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "montoUpcharge", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'ts_creacion' }),
    __metadata("design:type", Date)
], CartaPorte.prototype, "tsCreacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ts_inicio_real', nullable: true }),
    __metadata("design:type", Date)
], CartaPorte.prototype, "tsInicioReal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ts_finalizacion_real', nullable: true }),
    __metadata("design:type", Date)
], CartaPorte.prototype, "tsFinalizacionReal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ts_cierre_interno', nullable: true }),
    __metadata("design:type", Date)
], CartaPorte.prototype, "tsCierreInterno", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ts_cierre', nullable: true }),
    __metadata("design:type", Date)
], CartaPorte.prototype, "tsCierre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cierre_motivo', length: 50, nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "cierreMotivo", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'distancia_total_recorrida_km', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], CartaPorte.prototype, "distanciaTotalRecorridaKm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reached_destination', default: false }),
    __metadata("design:type", Boolean)
], CartaPorte.prototype, "reachedDestination", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'url_foto_remito', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "urlFotoRemito", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'applied_rule_info', length: 255, nullable: true }),
    __metadata("design:type", String)
], CartaPorte.prototype, "appliedRuleInfo", void 0);
exports.CartaPorte = CartaPorte = __decorate([
    (0, typeorm_1.Entity)('cartas_de_porte'),
    (0, typeorm_1.Index)('idx_unidad_viaje_activo', ['unidadId'], { unique: true, where: "(estado = 'EN_CAMINO')" }),
    (0, typeorm_1.Index)('idx_chofer_viaje_activo', ['choferId'], { unique: true, where: "(estado = 'EN_CAMINO')" })
], CartaPorte);
//# sourceMappingURL=carta-porte.entity.js.map