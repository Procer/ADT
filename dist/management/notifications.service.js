"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("../database/entities/audit-log.entity");
const update_trip_status_dto_1 = require("../trips/dto/update-trip-status.dto");
const telegram_service_1 = require("./telegram.service");
const system_config_entity_1 = require("../database/entities/system-config.entity");
const app_log_entity_1 = require("../database/entities/app-log.entity");
const nodemailer = __importStar(require("nodemailer"));
let NotificationsService = NotificationsService_1 = class NotificationsService {
    auditRepo;
    systemConfigRepo;
    logRepo;
    telegramService;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(auditRepo, systemConfigRepo, logRepo, telegramService) {
        this.auditRepo = auditRepo;
        this.systemConfigRepo = systemConfigRepo;
        this.logRepo = logRepo;
        this.telegramService = telegramService;
    }
    async getTransporter(tenant) {
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
    async sendEmail(to, subject, html, tenant) {
        try {
            const transporter = await this.getTransporter(tenant);
            if (!transporter)
                throw new Error('No SMTP configuration available');
            let from = '';
            if (tenant && tenant.smtpFrom) {
                from = tenant.smtpFrom;
            }
            else {
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
        }
        catch (error) {
            this.logger.error(`[SMTP ERROR] to ${to}: ${error.message} - Check your credentials or Gmail App Password.`);
            const appLog = this.logRepo.create({
                contexto: 'SMTP_SERVICE',
                level: app_log_entity_1.LogLevel.CRITICAL,
                mensaje: `Fallo de envío a ${to}: ${error.message}`,
                metadata: JSON.stringify({ subject, tenantId: tenant?.id || 'GLOBAL', stack: error.stack }),
                tenantId: tenant?.id || null,
                userId: null
            });
            await this.logRepo.save(appLog);
            return false;
        }
    }
    async createAlert(data) {
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
        }
        catch (error) {
            this.logger.error(`Error saving alert: ${error.message}`);
        }
    }
    async sendTelegramAlert(chatId, message) {
        if (!chatId)
            return;
        await this.telegramService.sendMessage(chatId, message);
    }
    async notifyTripStatusChange(trip, tenant) {
        const isTelegramEnabled = tenant.config?.features?.telegram !== false;
        if (!isTelegramEnabled)
            return;
        let message = '';
        const clientName = trip.client?.nombreRazonSocial || 'Dador de Carga';
        switch (trip.estado) {
            case update_trip_status_dto_1.TripStatus.IN_PROGRESS:
                message = `🚚 *Viaje en curso*: La unidad con patente ${trip.unidad?.patente} ha iniciado el viaje para ${clientName}.`;
                break;
            case update_trip_status_dto_1.TripStatus.FINALIZED:
                message = `✅ *Misión Cumplida*: El viaje ${trip.numeroCP} para ${clientName} ha sido entregado exitosamente.`;
                break;
        }
        if (message && tenant.telegramChatId) {
            await this.sendTelegramAlert(tenant.telegramChatId, message);
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(1, (0, typeorm_1.InjectRepository)(system_config_entity_1.SystemConfig)),
    __param(2, (0, typeorm_1.InjectRepository)(app_log_entity_1.AppLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        telegram_service_1.TelegramService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map