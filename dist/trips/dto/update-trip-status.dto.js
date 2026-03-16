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
exports.UpdateTripStatusDto = exports.TripStatus = void 0;
const class_validator_1 = require("class-validator");
var TripStatus;
(function (TripStatus) {
    TripStatus["SOLICITADO"] = "SOLICITADO";
    TripStatus["PENDING_CONFIRMATION"] = "PENDING_CONFIRMATION";
    TripStatus["PENDING"] = "PENDIENTE";
    TripStatus["IN_PROGRESS"] = "EN_CAMINO";
    TripStatus["LLEGUE"] = "LLEGUE";
    TripStatus["CARGA_DESCARGA"] = "CARGA_DESCARGA";
    TripStatus["ENTREGADO"] = "ENTREGADO";
    TripStatus["FINALIZED"] = "FINALIZADO";
    TripStatus["VOID_CREDIT"] = "ANULADO";
})(TripStatus || (exports.TripStatus = TripStatus = {}));
class UpdateTripStatusDto {
    estado;
    urlFotoRemito;
    lat;
    lng;
    fuera_de_rango;
    comentario;
}
exports.UpdateTripStatusDto = UpdateTripStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(TripStatus),
    __metadata("design:type", String)
], UpdateTripStatusDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTripStatusDto.prototype, "urlFotoRemito", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateTripStatusDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateTripStatusDto.prototype, "lng", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateTripStatusDto.prototype, "fuera_de_rango", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTripStatusDto.prototype, "comentario", void 0);
//# sourceMappingURL=update-trip-status.dto.js.map