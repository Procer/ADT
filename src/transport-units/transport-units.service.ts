import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransportUnit } from '../database/entities/transport-unit.entity';
import { CreateTransportUnitDto } from './dto/create-transport-unit.dto';

@Injectable()
export class TransportUnitsService {
    constructor(
        @InjectRepository(TransportUnit)
        private unitsRepo: Repository<TransportUnit>,
    ) { }

    create(createUnitDto: CreateTransportUnitDto) {
        const unit = this.unitsRepo.create(createUnitDto);
        return this.unitsRepo.save(unit);
    }

    findAll(tenantId: string) {
        return this.unitsRepo.find({ where: { tenantId } });
    }

    findAllAdmin() {
        return this.unitsRepo.find();
    }

    findOne(id: string) {
        return this.unitsRepo.findOne({ where: { id } });
    }

    async update(id: string, updateDto: any) {
        await this.unitsRepo.update(id, updateDto);
        return this.findOne(id);
    }

    private parseExcelDate(value: any): Date | undefined {
        if (!value) return undefined;
        
        // 1. Si ya es un objeto Date de JS
        if (value instanceof Date && !isNaN(value.getTime())) return value;

        // 2. Si es un número (formato serial de Excel)
        if (typeof value === 'number') {
            const XLSX = require('xlsx');
            const date = XLSX.SSF.parse_date_code(value);
            return new Date(date.y, date.m - 1, date.d);
        }

        // 3. Si es un string, intentamos procesar formatos comunes
        const str = String(value).trim();
        
        // Formato DD-MM-YYYY o DD/MM/YYYY
        const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (dmyMatch) {
            const [_, d, m, y] = dmyMatch;
            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        }

        // Formato YYYY-MM-DD (ISO)
        const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
        if (ymdMatch) {
            const [_, y, m, d] = ymdMatch;
            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        }

        // Intento final con el constructor nativo
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
                } as any);

                successCount++;
            } catch (err: any) {
                errors.push(`Fila ${index + 2}: Error - ${err.message}`);
            }
        }

        return { success: successCount, errors };
    }
}
