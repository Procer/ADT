import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { ClientAuthorizedEmail } from '../database/entities/client-authorized-email.entity';
import { EmailIngestionLog } from '../database/entities/email-ingestion-log.entity';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { TripStatus } from '../trips/dto/update-trip-status.dto';
import { AiExtractorService } from './ai-extractor.service';
import { TelegramService } from './telegram.service';

@Injectable()
export class EmailIngestionService {
    private readonly logger = new Logger(EmailIngestionService.name);

    constructor(
        @InjectRepository(ClientAuthorizedEmail) private authRepo: Repository<ClientAuthorizedEmail>,
        @InjectRepository(EmailIngestionLog) private logRepo: Repository<EmailIngestionLog>,
        @InjectRepository(CartaPorte) private tripsRepo: Repository<CartaPorte>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        private aiExtractor: AiExtractorService,
        private telegramService: TelegramService
    ) { }

    @Cron(CronExpression.EVERY_5_MINUTES)
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

    async processEmailsForTenant(tenant: Tenant, criteria: any = { seen: false }) {
        const client = new ImapFlow({
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
                            const parsed = await simpleParser(content);
                            // Marcar como leído de inmediato para evitar re-procesarlo en el próximo ciclo si falla el filtro
                            await client.messageFlagsAdd({ uid }, ['\\Seen']);
                            const from = parsed.from?.value[0]?.address?.toLowerCase();
                            const subject = (parsed.subject || '').toUpperCase();

                            if (!from) continue;

                            const authEntry = await this.authRepo.findOne({
                                where: { emailAutorizado: from },
                                relations: ['client']
                            });

                            // Priorizar el asunto del cliente (global para ese dador)
                            const targetSubject = (authEntry?.client?.asuntoClave || authEntry?.asuntoClave || 'VIAJE').toUpperCase();
                            const keywords = targetSubject.split(' ').filter(k => k.length > 2);

                            const matches = keywords.length > 0
                                ? keywords.every(k => subject.includes(k))
                                : subject.includes('VIAJE');

                            if (!authEntry) {
                                // Si el remitente es totalmente desconocido, ni siquiera logueamos el rechazo para no ensuciar la UI (Spam/Notificaciones)
                                continue;
                            }

                            if (!matches) {
                                // Si el remitente es conocido pero el asunto no coincide, AQUÍ SI logueamos el error
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

                            // Analizar faltantes
                            const missingFields: string[] = [];
                            if (!aiResult.data.Origen) missingFields.push('Origen');
                            if (!aiResult.data.Destino) missingFields.push('Destino');
                            if (!aiResult.data['Fecha de carga']) missingFields.push('Fecha');

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
                                    estado: TripStatus.PENDING_CONFIRMATION,
                                    numeroCP: `EMAIL-${Date.now().toString().slice(-6)}`,
                                    cierreMotivo: `Ingesta via Email (${from})`,
                                });
                                await this.tripsRepo.save(trip);

                                // Notificar si faltan datos
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
                        } catch (emailErr) {
                            this.logger.error(`Error procesando email UID ${uid}: ${emailErr.message}`);
                            // Opcional: Loguear el error en la DB
                        }
                    }
                }
            } finally {
                lock.release();
            }
            await client.logout();
        } catch (err) {
            this.logger.error(`Error Tenant ${tenant.nombreEmpresa}: ${err.message}`);
        }
    }
}
