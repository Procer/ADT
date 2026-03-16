import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual } from 'typeorm';
import { Driver } from '../database/entities/driver.entity';
import { TransportUnit } from '../database/entities/transport-unit.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AlarmsService {
    private readonly logger = new Logger(AlarmsService.name);

    constructor(
        @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
        @InjectRepository(TransportUnit) private readonly unitRepo: Repository<TransportUnit>,
        @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async checkExpirations() {
        this.logger.log('Starting daily document expiration check...');
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        // 1. Check Drivers (Licenses)
        const expiringDrivers = await this.driverRepo.find({
            where: {
                vencimientoLicencia: LessThanOrEqual(thirtyDaysFromNow.toISOString()) as any
            }
        });

        for (const driver of expiringDrivers) {
            await this.createAlert(
                'ALERTA_VENCIMIENTO_LICENCIA',
                `La licencia del chofer ${driver.nombre} vence el ${driver.vencimientoLicencia}`,
                driver.tenantId,
                { driverId: driver.id, type: 'LICENCIA' }
            );
        }

        // 2. Check Transport Units (VTV, Seguro, Ruta)
        const expiringUnits = await this.unitRepo.find({
            where: [
                { vencimientoVTV: LessThanOrEqual(thirtyDaysFromNow) },
                { vencimientoSeguro: LessThanOrEqual(thirtyDaysFromNow) },
                { vencimientoRuta: LessThanOrEqual(thirtyDaysFromNow) }
            ]
        });

        for (const unit of expiringUnits) {
            if (unit.vencimientoVTV && unit.vencimientoVTV <= thirtyDaysFromNow) {
                await this.createAlert('ALERTA_VENCIMIENTO_VTV', `VTV de unidad ${unit.patente} vence el ${unit.vencimientoVTV}`, unit.tenantId, { unitId: unit.id, type: 'VTV' });
            }
            if (unit.vencimientoSeguro && unit.vencimientoSeguro <= thirtyDaysFromNow) {
                await this.createAlert('ALERTA_VENCIMIENTO_SEGURO', `Seguro de unidad ${unit.patente} vence el ${unit.vencimientoSeguro}`, unit.tenantId, { unitId: unit.id, type: 'SEGURO' });
            }
            if (unit.vencimientoRuta && unit.vencimientoRuta <= thirtyDaysFromNow) {
                await this.createAlert('ALERTA_VENCIMIENTO_RUTA', `Ruta de unidad ${unit.patente} vence el ${unit.vencimientoRuta}`, unit.tenantId, { unitId: unit.id, type: 'RUTA' });
            }
        }

        this.logger.log(`Check completed. Found ${expiringDrivers.length} drivers and ${expiringUnits.length} units with upcoming expirations.`);
    }

    private async createAlert(accion: string, descripcion: string, tenantId: string, data: any) {
        // Prevent duplicate alerts for the same day/entity/type
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await this.auditRepo.findOne({
            where: {
                accion,
                fecha: MoreThan(today)
            }
        });

        if (existing) {
            // Check if it's the same entity in data_nueva
            const details = typeof existing.dataNueva === 'string' ? JSON.parse(existing.dataNueva) : existing.dataNueva;
            if (details?.unitId === data.unitId && details?.driverId === data.driverId) return;
        }

        const log = this.auditRepo.create({
            accion,
            descripcion,
            dataNueva: data
        });
        await this.auditRepo.save(log);
    }
}
