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
exports.DriversService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const driver_entity_1 = require("../database/entities/driver.entity");
const audit_log_entity_1 = require("../database/entities/audit-log.entity");
let DriversService = class DriversService {
    driversRepo;
    auditRepo;
    constructor(driversRepo, auditRepo) {
        this.driversRepo = driversRepo;
        this.auditRepo = auditRepo;
    }
    cleanDriverData(dto) {
        const cleaned = {};
        cleaned.nombre = dto.nombre;
        cleaned.dni = dto.dni;
        cleaned.email = dto.email || null;
        cleaned.telefono = dto.telefono || null;
        cleaned.telegramUser = dto.telegramUser || null;
        cleaned.telegramChatId = dto.telegramChatId || null;
        cleaned.licenciaNumero = dto.licenciaNumero || null;
        cleaned.licenciaCategoria = dto.licenciaCategoria || null;
        cleaned.art = dto.art || null;
        let finalPin = dto.pin;
        if (!finalPin && dto.dni) {
            const dniStr = dto.dni.toString();
            finalPin = dniStr.length >= 4 ? dniStr.slice(-4) : dniStr;
        }
        cleaned.pin = finalPin || '1234';
        cleaned.telefonoEmergencia = dto.telefonoEmergencia || null;
        cleaned.tenantId = dto.tenantId;
        cleaned.fechaNacimiento = dto.fechaNacimiento && dto.fechaNacimiento !== '' ? dto.fechaNacimiento : null;
        cleaned.fechaIngreso = dto.fechaIngreso && dto.fechaIngreso !== '' ? dto.fechaIngreso : null;
        cleaned.vencimientoLicencia = dto.vencimientoLicencia && dto.vencimientoLicencia !== '' ? dto.vencimientoLicencia : null;
        cleaned.paymentCycle = dto.paymentCycle || 'SEMANAL';
        return cleaned;
    }
    async create(createDriverDto) {
        const cleanedData = this.cleanDriverData(createDriverDto);
        const driver = this.driversRepo.create(cleanedData);
        const savedDriver = await this.driversRepo.save(driver);
        await this.auditRepo.save(this.auditRepo.create({
            accion: 'ALTA DE CHOFER',
            descripcion: `Nuevo chofer registrado: ${savedDriver.nombre} (DNI: ${savedDriver.dni})`,
            dataNueva: savedDriver,
            tenantId: savedDriver.tenantId
        }));
        return savedDriver;
    }
    findAll(tenantId) {
        return this.driversRepo.find({ where: { tenantId } });
    }
    findByDni(dni) {
        return this.driversRepo.findOne({ where: { dni } });
    }
    findOne(id) {
        return this.driversRepo.findOne({ where: { id } });
    }
    async update(id, updateDto) {
        const oldData = await this.findOne(id);
        const cleanedData = this.cleanDriverData(updateDto);
        await this.driversRepo.update(id, cleanedData);
        const newData = await this.findOne(id);
        if (newData) {
            await this.auditRepo.save(this.auditRepo.create({
                accion: 'MODIFICACION DE CHOFER',
                descripcion: `Actualización de legajo para ${newData.nombre} (DNI: ${newData.dni})`,
                dataAnterior: oldData,
                dataNueva: newData,
                tenantId: newData.tenantId
            }));
        }
        return newData;
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
                const nombre = r.nombre || r.Nombre || r['Nombre y Apellido'];
                const dni = r.dni || r.DNI || r['Documento'];
                const email = r.email || r.Email || r['Correo'];
                const telefono = r.telefono || r.Telefono || r['Celular'];
                const licenciaNumero = r.licenciaNumero || r.Licencia || r['Nro Licencia'];
                const pin = r.pin || r.PIN || r['Clave'];
                const vencimientoLicencia = this.parseExcelDate(r['Vencimiento Licencia'] || r.vencimientoLicencia);
                const art = r['Vencimiento ART'] || r.art || r.ART;
                const paymentCycle = r['Periodicidad'] || r.periodicidad || r.paymentCycle || r.payment_cycle;
                if (!nombre || !dni) {
                    errors.push(`Fila ${index + 2}: Falta Nombre o DNI`);
                    continue;
                }
                const existing = await this.driversRepo.findOne({ where: { dni: dni.toString(), tenantId } });
                if (existing) {
                    errors.push(`Fila ${index + 2}: El DNI ${dni} ya está registrado`);
                    continue;
                }
                await this.create({
                    tenantId,
                    nombre: nombre.toString(),
                    dni: dni.toString(),
                    email: email?.toString(),
                    telefono: telefono?.toString(),
                    licenciaNumero: licenciaNumero?.toString(),
                    vencimientoLicencia: vencimientoLicencia,
                    art: art?.toString(),
                    pin: pin?.toString() || undefined,
                    paymentCycle: paymentCycle?.toString()?.toUpperCase() || 'SEMANAL'
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
exports.DriversService = DriversService;
exports.DriversService = DriversService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(driver_entity_1.Driver)),
    __param(1, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DriversService);
//# sourceMappingURL=drivers.service.js.map