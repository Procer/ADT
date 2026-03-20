import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { TelegramService } from './telegram.service';
import { SystemConfig } from '../database/entities/system-config.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { AppLog } from '../database/entities/app-log.entity';
export declare class NotificationsService {
    private readonly auditRepo;
    private readonly systemConfigRepo;
    private readonly logRepo;
    private readonly telegramService;
    private readonly logger;
    constructor(auditRepo: Repository<AuditLog>, systemConfigRepo: Repository<SystemConfig>, logRepo: Repository<AppLog>, telegramService: TelegramService);
    private getTransporter;
    sendEmail(to: string, subject: string, html: string, tenant?: Tenant): Promise<boolean>;
    createAlert(data: {
        tenantId: string;
        tripId: string;
        tipo: string;
        prioridad: string;
        mensaje: string;
        metadata?: any;
    }): Promise<void>;
    sendTelegramAlert(chatId: string, message: string): Promise<void>;
    notifyTripStatusChange(trip: any, tenant: any): Promise<void>;
}
