"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportUnitsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const transport_units_service_1 = require("./transport-units.service");
const transport_units_controller_1 = require("./transport-units.controller");
const transport_unit_entity_1 = require("../database/entities/transport-unit.entity");
let TransportUnitsModule = class TransportUnitsModule {
};
exports.TransportUnitsModule = TransportUnitsModule;
exports.TransportUnitsModule = TransportUnitsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([transport_unit_entity_1.TransportUnit])],
        controllers: [transport_units_controller_1.TransportUnitsController],
        providers: [transport_units_service_1.TransportUnitsService],
        exports: [transport_units_service_1.TransportUnitsService],
    })
], TransportUnitsModule);
//# sourceMappingURL=transport-units.module.js.map