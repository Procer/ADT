import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../database/entities/driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { AuditLog } from '../database/entities/audit-log.entity';

@Injectable()
export class DriversService {
    constructor(
        @InjectRepository(Driver)
        private driversRepo: Repository<Driver>,
        @InjectRepository(AuditLog)
        private auditRepo: Repository<AuditLog>,
    ) { }

    private cleanDriverData(dto: any) {
        const cleaned: any = {};

        // Map fields explicitly to ensure entity consistency
        cleaned.nombre = dto.nombre;
        cleaned.dni = dto.dni;
        cleaned.email = dto.email || null;
        cleaned.telefono = dto.telefono || null;
        cleaned.telegramUser = dto.telegramUser || null;
        cleaned.telegramChatId = dto.telegramChatId || null;
        cleaned.licenciaNumero = dto.licenciaNumero || null;
        cleaned.licenciaCategoria = dto.licenciaCategoria || null;
        cleaned.art = dto.art || null;

        // Lógica de PIN automático: últimos 4 del DNI si no se provee PIN
        let finalPin = dto.pin;
        if (!finalPin && dto.dni) {
            const dniStr = dto.dni.toString();
            finalPin = dniStr.length >= 4 ? dniStr.slice(-4) : dniStr;
        }
        cleaned.pin = finalPin || '1234';

        cleaned.telefonoEmergencia = dto.telefonoEmergencia || null;
        cleaned.tenantId = dto.tenantId;

        // Date fields cleaning (empty string -> null)
        cleaned.fechaNacimiento = dto.fechaNacimiento && dto.fechaNacimiento !== '' ? dto.fechaNacimiento : null;
        cleaned.fechaIngreso = dto.fechaIngreso && dto.fechaIngreso !== '' ? dto.fechaIngreso : null;
        cleaned.vencimientoLicencia = dto.vencimientoLicencia && dto.vencimientoLicencia !== '' ? dto.vencimientoLicencia : null;
        cleaned.paymentCycle = dto.paymentCycle || 'SEMANAL';

        return cleaned;
    }

    async create(createDriverDto: CreateDriverDto) {
        const cleanedData = this.cleanDriverData(createDriverDto);
        const driver = this.driversRepo.create(cleanedData);
        const savedDriver: any = await this.driversRepo.save(driver);

        await this.auditRepo.save(this.auditRepo.create({
            accion: 'ALTA DE CHOFER',
            descripcion: `Nuevo chofer registrado: ${savedDriver.nombre} (DNI: ${savedDriver.dni})`,
            dataNueva: savedDriver,
            tenantId: savedDriver.tenantId
        }));

        return savedDriver;
    }

    findAll(tenantId: string) {
        return this.driversRepo.find({ where: { tenantId } });
    }

    findByDni(dni: string) {
        return this.driversRepo.findOne({ where: { dni } });
    }

    findOne(id: string) {
        return this.driversRepo.findOne({ where: { id } });
    }

    async update(id: string, updateDto: any) {
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

    private parseExcelDate(value: any): Date | undefined {
        if (!value) return undefined;
        if (value instanceof Date && !isNaN(value.getTime())) return value;
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

    async importBulkFromExcel(tenantId: string, fileBuffer: Buffer): Promise<{ success: number; errors: string[] }> {
        const XLSX = require('xlsx');
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        let successCount = 0;
        const errors: string[] = [];

        for (const [index, row] of data.entries()) {
            try {
                const r = row as any;
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
                    vencimientoLicencia: vencimientoLicencia as any,
                    art: art?.toString(),
                    pin: pin?.toString() || undefined,
                    paymentCycle: paymentCycle?.toString()?.toUpperCase() || 'SEMANAL'
                } as any);

                successCount++;
            } catch (err: any) {
                errors.push(`Fila ${index + 2}: Error - ${err.message}`);
            }
        }

        return { success: successCount, errors };
    }
}
