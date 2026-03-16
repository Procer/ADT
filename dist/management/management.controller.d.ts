import { TripsService } from '../trips/trips.service';
import { Repository, DataSource } from 'typeorm';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { GpsTracking } from '../database/entities/gps-tracking.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { TransportUnit } from '../database/entities/transport-unit.entity';
import { Driver } from '../database/entities/driver.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantPricing } from '../database/entities/tenant-pricing.entity';
import { TravelCredit } from '../database/entities/travel-credit.entity';
import { User } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';
import { ClientAuthorizedEmail } from '../database/entities/client-authorized-email.entity';
import { WalletBalance } from '../database/entities/wallet-balance.entity';
import { TenantPayment } from '../database/entities/tenant-payment.entity';
import { TelegramService } from './telegram.service';
import { EmailIngestionService } from './email-ingestion.service';
import { SettlementBatch } from '../database/entities/settlement-batch.entity';
import { PaymentLot } from '../database/entities/payment-lot.entity';
import { PricingRule } from '../database/entities/pricing-rule.entity';
import { PricingEngineService } from './pricing-engine.service';
import { FinancialReportingService } from './financial-reporting.service';
import { AiExtractorService } from './ai-extractor.service';
import { AdtCredit } from '../database/entities/adt-credit.entity';
import { AdtRecaudacion } from '../database/entities/adt-recaudacion.entity';
import { NotificationsService } from './notifications.service';
import { SystemConfig } from '../database/entities/system-config.entity';
import { EmailIngestionLog } from '../database/entities/email-ingestion-log.entity';
export declare class ManagementController {
    private tripsRepo;
    private gpsRepo;
    private auditRepo;
    private unitRepo;
    private driverRepo;
    private tenantRepo;
    private pricingRepo;
    private creditsRepo;
    private clientRepo;
    private readonly userRepo;
    private readonly paymentRepo;
    private readonly walletRepo;
    private readonly systemConfigRepo;
    private readonly batchRepo;
    private readonly paymentLotRepo;
    private readonly adtCreditRepo;
    private readonly adtRecaudacionRepo;
    private readonly tripsService;
    private readonly pricingEngine;
    private readonly reportingService;
    private readonly aiExtractorService;
    private readonly notificationsService;
    private readonly telegramService;
    private readonly emailIngestionService;
    private dataSource;
    constructor(tripsRepo: Repository<CartaPorte>, gpsRepo: Repository<GpsTracking>, auditRepo: Repository<AuditLog>, unitRepo: Repository<TransportUnit>, driverRepo: Repository<Driver>, tenantRepo: Repository<Tenant>, pricingRepo: Repository<TenantPricing>, creditsRepo: Repository<TravelCredit>, clientRepo: Repository<Client>, userRepo: Repository<User>, paymentRepo: Repository<TenantPayment>, walletRepo: Repository<WalletBalance>, systemConfigRepo: Repository<SystemConfig>, batchRepo: Repository<SettlementBatch>, paymentLotRepo: Repository<PaymentLot>, adtCreditRepo: Repository<AdtCredit>, adtRecaudacionRepo: Repository<AdtRecaudacion>, tripsService: TripsService, pricingEngine: PricingEngineService, reportingService: FinancialReportingService, aiExtractorService: AiExtractorService, notificationsService: NotificationsService, telegramService: TelegramService, emailIngestionService: EmailIngestionService, dataSource: DataSource);
    findAllTrips(tenantId: string, estado?: string, choferId?: string, clientId?: string): Promise<CartaPorte[]>;
    getSystemConfig(): Promise<SystemConfig>;
    updateSystemConfig(body: any): Promise<SystemConfig>;
    getTenants(): Promise<{
        claveActualizada: boolean;
        id: string;
        nombreEmpresa: string;
        config: any;
        logoUrl: string;
        telegramChatId: string;
        imapHost: string;
        imapPort: number;
        imapUser: string;
        imapPass: string;
        geminiApiKey: string;
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPass: string;
        smtpFrom: string;
        smtpSecure: boolean;
        limiteCreditoGlobal: number;
        deudaActual: number;
        activo: boolean;
        createdAt: Date;
        salespersonId: string;
        salesperson: import("../database/entities/salesperson.entity").Salesperson;
        pricings: TenantPricing[];
        units: TransportUnit[];
        drivers: Driver[];
        trips: CartaPorte[];
        credits: TravelCredit[];
    }[]>;
    getTenant(id: string): Promise<Tenant>;
    createTenant(body: any): Promise<Tenant>;
    updateTenant(id: string, body: any): Promise<Tenant>;
    getTenantPayments(id: string): Promise<TenantPayment[]>;
    deleteTenant(id: string, force: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resetSystem(body: {
        confirmation: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getClients(tenantId: string): Promise<any[]>;
    createClient(body: any): Promise<Client[]>;
    updateClient(id: string, body: any): Promise<Client>;
    emptyClient(id: string, body: {
        secret: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getPricingRules(tenantId: string, entityId: string): Promise<PricingRule[]>;
    createPricingRule(body: any): Promise<PricingRule>;
    simulatePricingImpact(proposal: any): Promise<{
        viajesAnalizados: number;
        message: string;
        anteriorTotal?: undefined;
        nuevoTotal?: undefined;
        diferenciaAbsoluta?: undefined;
        impactoPorcentaje?: undefined;
    } | {
        viajesAnalizados: number;
        anteriorTotal: number;
        nuevoTotal: number;
        diferenciaAbsoluta: number;
        impactoPorcentaje: number;
        message?: undefined;
    }>;
    forceDeletePricingRule(id: string, role: string): Promise<{
        success: boolean;
    }>;
    getDrivers(tenantId: string): Promise<{
        precioPorViaje: number;
        id: string;
        tenantId: string;
        fechaNacimiento: Date;
        fechaIngreso: Date;
        telefonoEmergencia: string;
        tenant: Tenant;
        nombre: string;
        dni: string;
        email: string;
        telegramUser: string;
        telegramChatId: string;
        telefono: string;
        licenciaNumero: string;
        licenciaCategoria: string;
        art: string;
        vencimientoLicencia: Date;
        scoreConfianza: number;
        pin: string;
        deviceIdVinculado: string;
        paymentCycle: string;
        ultimoLogin: Date;
        trips: CartaPorte[];
    }[]>;
    getUnits(tenantId: string): Promise<TransportUnit[]>;
    getStats(tenantId?: string): Promise<{
        trips: number;
        clients: number;
        drivers: number;
        units: number;
    }>;
    getSettlementsV2(tenantId: string, entityType: string, month: string, year: string): Promise<{
        items: {
            id: any;
            createdAt: any;
            entityId: any;
            periodStart: any;
            periodEnd: any;
            totalNet: number;
            status: string;
            pdfUrl: any;
        }[];
        stats: {
            totalNet: number;
            paid: number;
            pending: number;
        };
    }>;
    getCreditsHistory(tenantId: string, month: string, year: string): Promise<{
        id: string;
        fecha: Date;
        client: {
            id: string;
            nombreRazonSocial: string;
        } | null;
        cantidadCreditos: number;
        montoPagado: number;
        aprobado: boolean;
        referenciaPago: string;
    }[]>;
    getBillingAudit(tenantId: string): Promise<{
        detalles: {
            id: string;
            fecha: Date;
            dadorCarga: string;
            dadorCargaId: string;
            numeroCP: string;
            tipo: string;
            costo: number;
            estado: string;
            montoUpcharge: number;
        }[];
    }>;
    getClientAdminInfo(id: string): Promise<User[]>;
    createClientUser(id: string, body: any): Promise<User>;
    updateUserEmail(userId: string, body: {
        email: string;
    }): Promise<User>;
    resendCredentials(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAuthorizedEmails(clientId: string): Promise<ClientAuthorizedEmail[]>;
    addAuthorizedEmail(body: any): Promise<ClientAuthorizedEmail>;
    deleteAuthorizedEmail(id: string): Promise<{
        success: boolean;
    }>;
    updateClientSubject(id: string, body: {
        asunto: string;
    }): Promise<Client>;
    getTenantAdminInfo(id: string): Promise<{
        nombre: string;
        email: string;
    }>;
    toggleTenantStatus(id: string): Promise<Tenant>;
    resetTenantPassword(id: string): Promise<{
        email: string;
        temporaryPassword: string;
    }>;
    updateTenantAdmin(id: string, body: any): Promise<User>;
    sendTenantCredentials(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    cleanupTenantData(body: {
        tenantId: string;
        secret: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getPendingTrips(tenantId: string): Promise<CartaPorte[]>;
    recordPayment(tenantId: string, body: any): Promise<TenantPayment>;
    deletePayment(paymentId: string): Promise<{
        success: boolean;
    }>;
    sendSettlement(tenantId: string, month: string, year: string): Promise<{
        success: boolean;
    }>;
    getIncomingRequests(tenantId: string): Promise<CartaPorte[]>;
    getEmailLogs(tenantId: string): Promise<EmailIngestionLog[]>;
    triggerIngestion(tenantId: string): Promise<{
        message: string;
    }>;
    processAiCopilot(body: {
        userInput: string;
        tenantId: string;
    }, req: any): Promise<any>;
}
