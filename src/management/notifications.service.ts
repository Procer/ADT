import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { TripStatus } from '../trips/dto/update-trip-status.dto';
import { TelegramService } from './telegram.service';
import { SystemConfig } from '../database/entities/system-config.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { AppLog, LogLevel } from '../database/entities/app-log.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(AuditLog)
        private readonly auditRepo: Repository<AuditLog>,
        @InjectRepository(SystemConfig)
        private readonly systemConfigRepo: Repository<SystemConfig>,
        @InjectRepository(AppLog)
        private readonly logRepo: Repository<AppLog>,
        private readonly telegramService: TelegramService,
    ) { }

    private async getTransporter(tenant?: Tenant) {
        // 1. Si hay tenant y tiene SMTP configurado, usarlo (Envíos de Cliente Logístico a sus Dadores/Choferes)
        if (tenant && tenant.smtpHost && tenant.smtpUser && tenant.smtpPass) {
            this.logger.log(`Using Tenant SMTP for: ${tenant.nombreEmpresa}`);
            return nodemailer.createTransport({
                host: tenant.smtpHost,
                port: tenant.smtpPort,
                secure: tenant.smtpSecure,
                auth: {
                    user: tenant.smtpUser,
                    pass: tenant.smtpPass,
                },
            });
        }

        // 2. Si no, usar la Configuración Global (Envíos de ADT a Clientes Logísticos)
        const globalConfig = await this.systemConfigRepo.findOne({ where: { configKey: 'GLOBAL_SETTINGS' } });
        const config = globalConfig && globalConfig.smtpConfig && globalConfig.smtpConfig.host ? globalConfig.smtpConfig : null;
        if (config) {
            this.logger.log(`Using Global SMTP: ${config.host}:${config.port} (User: ${config.user}, Secure: ${config.secure})`);
            return nodemailer.createTransport({
                host: config.host,
                port: config.port,
                secure: config.secure,
                auth: {
                    user: config.user,
                    pass: config.pass,
                },
            });
        }

        this.logger.warn('No SMTP configuration found (Neither Tenant nor Global)');
        return null;
    }

    async sendEmail(to: string, subject: string, html: string, tenant?: Tenant) {
        try {
            const transporter = await this.getTransporter(tenant);
            if (!transporter) throw new Error('No SMTP configuration available');

            let from = '';
            if (tenant && tenant.smtpFrom) {
                from = tenant.smtpFrom;
            } else {
                const globalConfig = await this.systemConfigRepo.findOne({ where: { configKey: 'GLOBAL_SETTINGS' } });
                from = globalConfig?.smtpConfig?.from || globalConfig?.smtpConfig?.user || '';
            }

            await transporter.sendMail({
                from,
                to,
                subject,
                html,
            });
            this.logger.log(`[EMAIL SENT] to ${to}: ${subject}`);
            return true;
        } catch (error) {
            this.logger.error(`[SMTP ERROR] to ${to}: ${error.message} - Check your credentials or Gmail App Password.`);

            // Persistir Error en Base de Datos para el Super Admin
            const appLog = this.logRepo.create({
                contexto: 'SMTP_SERVICE',
                level: LogLevel.CRITICAL,
                mensaje: `Fallo de envío a ${to}: ${error.message}`,
                metadata: JSON.stringify({ subject, tenantId: tenant?.id || 'GLOBAL', stack: error.stack }),
                tenantId: tenant?.id || null,
                userId: null
            });
            await this.logRepo.save(appLog);

            return false;
        }
    }

    async createAlert(data: {
        tenantId: string,
        tripId: string,
        tipo: string,
        prioridad: string,
        mensaje: string,
        metadata?: any
    }) {
        try {
            const log = this.auditRepo.create({
                tenantId: data.tenantId,
                accion: data.tipo,
                descripcion: data.mensaje,
                dataNueva: {
                    tripId: data.tripId,
                    prioridad: data.prioridad,
                    metadata: typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata
                }
            });
            await this.auditRepo.save(log);
        } catch (error) {
            this.logger.error(`Error saving alert: ${error.message}`);
        }
    }

    async sendTelegramAlert(chatId: string, message: string) {
        if (!chatId) return;
        await this.telegramService.sendMessage(chatId, message);
    }

    async notifyTripStatusChange(trip: any, tenant: any) {
        const isTelegramEnabled = tenant.config?.features?.telegram !== false;
        if (!isTelegramEnabled) return;

        let message = '';
        const clientName = trip.client?.nombreRazonSocial || 'Dador de Carga';

        switch (trip.estado) {
            case TripStatus.IN_PROGRESS:
                message = `🚚 *Viaje en curso*: La unidad con patente ${trip.unidad?.patente} ha iniciado el viaje para ${clientName}.`;
                break;
            case TripStatus.FINALIZED:
                message = `✅ *Misión Cumplida*: El viaje ${trip.numeroCP} para ${clientName} ha sido entregado exitosamente.`;
                break;
        }

        if (message && tenant.telegramChatId) {
            await this.sendTelegramAlert(tenant.telegramChatId, message);
        }
    }
}
