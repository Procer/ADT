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
exports.GpsTracking = void 0;
const typeorm_1 = require("typeorm");
const carta_porte_entity_1 = require("./carta-porte.entity");
let GpsTracking = class GpsTracking {
    id;
    cpId;
    cartaPorte;
    latitud;
    longitud;
    velocidad;
    esManual;
    tipoRegistro;
    eventoManual;
    cierreInternoDisparado;
    fueraDeRango;
    resuelto;
    comentarioResolucion;
    resueltoPor;
    distanciaDestinoMetros;
    timestampDispositivo;
    timestampServidor;
};
exports.GpsTracking = GpsTracking;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", String)
], GpsTracking.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cp_id', type: 'uuid' }),
    __metadata("design:type", String)
], GpsTracking.prototype, "cpId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => carta_porte_entity_1.CartaPorte),
    (0, typeorm_1.JoinColumn)({ name: 'cp_id' }),
    __metadata("design:type", carta_porte_entity_1.CartaPorte)
], GpsTracking.prototype, "cartaPorte", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 8 }),
    __metadata("design:type", Number)
], GpsTracking.prototype, "latitud", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 11, scale: 8 }),
    __metadata("design:type", Number)
], GpsTracking.prototype, "longitud", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], GpsTracking.prototype, "velocidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'es_manual', default: false }),
    __metadata("design:type", Boolean)
], GpsTracking.prototype, "esManual", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_registro', length: 20, default: 'AUTOMATICO' }),
    __metadata("design:type", String)
], GpsTracking.prototype, "tipoRegistro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'evento_manual', length: 50, nullable: true }),
    __metadata("design:type", String)
], GpsTracking.prototype, "eventoManual", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cierre_interno_disparado', default: false }),
    __metadata("design:type", Boolean)
], GpsTracking.prototype, "cierreInternoDisparado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fuera_de_rango', default: false }),
    __metadata("design:type", Boolean)
], GpsTracking.prototype, "fueraDeRango", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resuelto', default: false }),
    __metadata("design:type", Boolean)
], GpsTracking.prototype, "resuelto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comentario_resolucion', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GpsTracking.prototype, "comentarioResolucion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resuelto_por', nullable: true }),
    __metadata("design:type", String)
], GpsTracking.prototype, "resueltoPor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'distancia_destino_metros', type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], GpsTracking.prototype, "distanciaDestinoMetros", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'timestamp_dispositivo' }),
    __metadata("design:type", Date)
], GpsTracking.prototype, "timestampDispositivo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'timestamp_servidor' }),
    __metadata("design:type", Date)
], GpsTracking.prototype, "timestampServidor", void 0);
exports.GpsTracking = GpsTracking = __decorate([
    (0, typeorm_1.Entity)('gps_tracking')
], GpsTracking);
//# sourceMappingURL=gps-tracking.entity.js.map