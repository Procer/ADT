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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportUnitsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transport_unit_entity_1 = require("../database/entities/transport-unit.entity");
let TransportUnitsService = class TransportUnitsService {
    unitsRepo;
    constructor(unitsRepo) {
        this.unitsRepo = unitsRepo;
    }
    create(createUnitDto) {
        const sanitizedData = { ...createUnitDto };
        const dateFields = ['vencimientoVTV', 'vencimientoSeguro', 'vencimientoRuta'];
        dateFields.forEach(field => {
            const val = sanitizedData[field];
            if (val instanceof Date && isNaN(val.getTime())) {
                sanitizedData[field] = null;
            }
            else if (typeof val === 'string' && val.trim() === '') {
                sanitizedData[field] = null;
            }
        });
        const unit = this.unitsRepo.create(sanitizedData);
        return this.unitsRepo.save(unit);
    }
    findAll(tenantId) {
        return this.unitsRepo.find({ where: { tenantId } });
    }
    findAllAdmin() {
        return this.unitsRepo.find();
    }
    findOne(id) {
        return this.unitsRepo.findOne({ where: { id } });
    }
    async update(id, updateDto) {
        await this.unitsRepo.update(id, updateDto);
        return this.findOne(id);
    }
    parseExcelDate(value) {
        if (!value)
            return undefined;
        if (value instanceof Date && !isNaN(value.getTime()))
            return value;
        if (typeof value === 'number') {
            const XLSX = require('xlsx');
            const date = XLSX.SSF.parse_date_code(value);
            return new Date(date.y, date.m - 1, date.d);
        }
        const str = String(value).trim();
        const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (dmyMatch) {
            const [_, d, m, y] = dmyMatch;
            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        }
        const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
        if (ymdMatch) {
            const [_, y, m, d] = ymdMatch;
            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        }
        const finalTry = new Date(str);
        return isNaN(finalTry.getTime()) ? undefined : finalTry;
    }
    async importBulkFromExcel(tenantId, fileBuffer) {
        const XLSX = require('xlsx');
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        let successCount = 0;
        const errors = [];
        for (const [index, row] of data.entries()) {
            try {
                const r = row;
                const patente = r.patente || r.Patente || r.Dominio;
                const marca = r.marca || r.Marca;
                const modelo = r.modelo || r.Modelo;
                const anio = r.anio || r.Anio || r['Año'];
                if (!patente) {
                    errors.push(`Fila ${index + 2}: Falta la Patente`);
                    continue;
                }
                const existing = await this.unitsRepo.findOne({ where: { patente: patente.toString(), tenantId } });
                if (existing) {
                    errors.push(`Fila ${index + 2}: La patente ${patente} ya existe`);
                    continue;
                }
                await this.create({
                    tenantId,
                    patente: patente.toString(),
                    marca: marca?.toString() || 'Genérica',
                    modelo: modelo?.toString() || 'Básico',
                    anio: anio ? Number(anio) : undefined,
                    vencimientoVTV: this.parseExcelDate(r['Vencimiento VTV'] || r.vencimientoVTV || r.VTV),
                    vencimientoSeguro: this.parseExcelDate(r['Vencimiento Seguro'] || r.vencimientoSeguro || r.Seguro),
                    vencimientoRuta: this.parseExcelDate(r['Vencimiento Ruta'] || r.vencimientoRuta || r.Ruta || r.CNRT)
                });
                successCount++;
            }
            catch (err) {
                errors.push(`Fila ${index + 2}: Error - ${err.message}`);
            }
        }
        return { success: successCount, errors };
    }
};
exports.TransportUnitsService = TransportUnitsService;
exports.TransportUnitsService = TransportUnitsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transport_unit_entity_1.TransportUnit)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TransportUnitsService);
//# sourceMappingURL=transport-units.service.js.map