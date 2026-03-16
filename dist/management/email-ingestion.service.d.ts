import { Repository } from 'typeorm';
import { ClientAuthorizedEmail } from '../database/entities/client-authorized-email.entity';
import { EmailIngestionLog } from '../database/entities/email-ingestion-log.entity';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { AiExtractorService } from './ai-extractor.service';
import { TelegramService } from './telegram.service';
export declare class EmailIngestionService {
    private authRepo;
    private logRepo;
    private tripsRepo;
    private tenantRepo;
    private aiExtractor;
    private telegramService;
    private readonly logger;
    constructor(authRepo: Repository<ClientAuthorizedEmail>, logRepo: Repository<EmailIngestionLog>, tripsRepo: Repository<CartaPorte>, tenantRepo: Repository<Tenant>, aiExtractor: AiExtractorService, telegramService: TelegramService);
    handleCron(): Promise<void>;
    processEmailsForTenant(tenant: Tenant, criteria?: any): Promise<void>;
}
