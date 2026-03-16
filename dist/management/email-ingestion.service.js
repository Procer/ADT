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
var EmailIngestionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailIngestionService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const imapflow_1 = require("imapflow");
const mailparser_1 = require("mailparser");
const client_authorized_email_entity_1 = require("../database/entities/client-authorized-email.entity");
const email_ingestion_log_entity_1 = require("../database/entities/email-ingestion-log.entity");
const carta_porte_entity_1 = require("../database/entities/carta-porte.entity");
const tenant_entity_1 = require("../database/entities/tenant.entity");
const update_trip_status_dto_1 = require("../trips/dto/update-trip-status.dto");
const ai_extractor_service_1 = require("./ai-extractor.service");
const telegram_service_1 = require("./telegram.service");
let EmailIngestionService = EmailIngestionService_1 = class EmailIngestionService {
    authRepo;
    logRepo;
    tripsRepo;
    tenantRepo;
    aiExtractor;
    telegramService;
    logger = new common_1.Logger(EmailIngestionService_1.name);
    constructor(authRepo, logRepo, tripsRepo, tenantRepo, aiExtractor, telegramService) {
        this.authRepo = authRepo;
        this.logRepo = logRepo;
        this.tripsRepo = tripsRepo;
        this.tenantRepo = tenantRepo;
        this.aiExtractor = aiExtractor;
        this.telegramService = telegramService;
    }
    async handleCron() {
        const tenants = await this.tenantRepo.find({
            where: { activo: true }
        });
        for (const tenant of tenants) {
            if (tenant.imapHost && tenant.imapUser && tenant.imapPass) {
                this.logger.log(`Iniciando ingesta para Tenant: ${tenant.nombreEmpresa}`);
                await this.processEmailsForTenant(tenant);
            }
        }
    }
    async processEmailsForTenant(tenant, criteria = { seen: false }) {
        const client = new imapflow_1.ImapFlow({
            host: tenant.imapHost,
            port: tenant.imapPort || 993,
            secure: true,
            auth: {
                user: tenant.imapUser,
                pass: tenant.imapPass
            },
            logger: false
        });
        try {
            await client.connect();
            const lock = await client.getMailboxLock('INBOX');
            try {
                const messages = await client.search(criteria);
                if (messages) {
                    for (const uid of messages) {
                        try {
                            const { content } = await client.download(uid);
                            const parsed = await (0, mailparser_1.simpleParser)(content);
                            await client.messageFlagsAdd({ uid }, ['\\Seen']);
                            const from = parsed.from?.value[0]?.address?.toLowerCase();
                            const subject = (parsed.subject || '').toUpperCase();
                            if (!from)
                                continue;
                            const authEntry = await this.authRepo.findOne({
                                where: { emailAutorizado: from },
                                relations: ['client']
                            });
                            const targetSubject = (authEntry?.client?.asuntoClave || authEntry?.asuntoClave || 'VIAJE').toUpperCase();
                            const keywords = targetSubject.split(' ').filter(k => k.length > 2);
                            const matches = keywords.length > 0
                                ? keywords.every(k => subject.includes(k))
                                : subject.includes('VIAJE');
                            if (!authEntry) {
                                continue;
                            }
                            if (!matches) {
                                const logData = this.logRepo.create({
                                    tenantId: tenant.id,
                                    remitente: from,
                                    asunto: parsed.subject,
                                    cuerpoRaw: parsed.text?.slice(0, 1000),
                                    estadoIngesta: 'RECHAZADO_FILTRO',
                                    errorDetalle: `Asunto no coincide (Esperado: ${targetSubject}). Asegúrate de incluir la palabra clave en el Asunto.`
                                });
                                await this.logRepo.save(logData);
                                continue;
                            }
                            const aiResult = await this.aiExtractor.extractTripData(parsed.text || '', tenant.geminiApiKey);
                            const missingFields = [];
                            if (!aiResult.data.Origen)
                                missingFields.push('Origen');
                            if (!aiResult.data.Destino)
                                missingFields.push('Destino');
                            if (!aiResult.data['Fecha de carga'])
                                missingFields.push('Fecha');
                            const log = this.logRepo.create({
                                tenantId: tenant.id,
                                remitente: from,
                                asunto: parsed.subject,
                                cuerpoRaw: parsed.text,
                                estadoIngesta: aiResult.success ? 'EXITOSO' : 'ERROR_IA',
                                jsonExtraido: aiResult.data,
                                errorDetalle: missingFields.length > 0 ? `Campos faltantes: ${missingFields.join(', ')}` : aiResult.error
                            });
                            await this.logRepo.save(log);
                            if (aiResult.success) {
                                const trip = this.tripsRepo.create({
                                    tenantId: tenant.id,
                                    clientId: authEntry.clientId,
                                    origenNombre: aiResult.data.Origen || 'Pendiente definición',
                                    destinoNombre: aiResult.data.Destino || 'Pendiente definición',
                                    mercaderiaTipo: aiResult.data['Tipo de Mercadería'],
                                    volumen: aiResult.data.Volumen,
                                    estado: update_trip_status_dto_1.TripStatus.PENDING_CONFIRMATION,
                                    numeroCP: `EMAIL-${Date.now().toString().slice(-6)}`,
                                    cierreMotivo: `Ingesta via Email (${from})`,
                                });
                                await this.tripsRepo.save(trip);
                                if (missingFields.length > 0) {
                                    const userRepo = this.authRepo.manager.getRepository('User');
                                    const user = await userRepo.findOne({
                                        where: { clientId: authEntry.clientId }
                                    });
                                    if (user?.telegramChatId) {
                                        const msg = `⚠️ *Aviso de Ingesta Email*\n\nSe creó una solicitud de viaje pero faltan datos: *${missingFields.join(', ')}*.\n\nPor favor, completa la información ingresando al portal.`;
                                        await this.telegramService.sendMessage(user.telegramChatId, msg);
                                    }
                                }
                            }
                        }
                        catch (emailErr) {
                            this.logger.error(`Error procesando email UID ${uid}: ${emailErr.message}`);
                        }
                    }
                }
            }
            finally {
                lock.release();
            }
            await client.logout();
        }
        catch (err) {
            this.logger.error(`Error Tenant ${tenant.nombreEmpresa}: ${err.message}`);
        }
    }
};
exports.EmailIngestionService = EmailIngestionService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailIngestionService.prototype, "handleCron", null);
exports.EmailIngestionService = EmailIngestionService = EmailIngestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(client_authorized_email_entity_1.ClientAuthorizedEmail)),
    __param(1, (0, typeorm_1.InjectRepository)(email_ingestion_log_entity_1.EmailIngestionLog)),
    __param(2, (0, typeorm_1.InjectRepository)(carta_porte_entity_1.CartaPorte)),
    __param(3, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        ai_extractor_service_1.AiExtractorService,
        telegram_service_1.TelegramService])
], EmailIngestionService);
//# sourceMappingURL=email-ingestion.service.js.map