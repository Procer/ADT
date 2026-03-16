import { Repository, DataSource } from 'typeorm';
import { CreateTripDto } from './dto/create-trip.dto';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { Client } from '../database/entities/client.entity';
import { Driver } from '../database/entities/driver.entity';
import { TransportUnit } from '../database/entities/transport-unit.entity';
import { GpsTracking } from '../database/entities/gps-tracking.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { UpdateTripStatusDto } from './dto/update-trip-status.dto';
import { Tenant } from '../database/entities/tenant.entity';
import { WalletBalance } from '../database/entities/wallet-balance.entity';
import { User } from '../database/entities/user.entity';
import { NotificationsService } from '../management/notifications.service';
import { TelegramService } from '../management/telegram.service';
import { PricingEngineService } from '../management/pricing-engine.service';
export declare class TripsService {
    private tripsRepo;
    private clientRepo;
    private driverRepo;
    private unitRepo;
    private gpsRepo;
    private auditRepo;
    private tenantRepo;
    private walletRepo;
    private dataSource;
    private notificationsService;
    private telegramService;
    private pricingEngine;
    constructor(tripsRepo: Repository<CartaPorte>, clientRepo: Repository<Client>, driverRepo: Repository<Driver>, unitRepo: Repository<TransportUnit>, gpsRepo: Repository<GpsTracking>, auditRepo: Repository<AuditLog>, tenantRepo: Repository<Tenant>, walletRepo: Repository<WalletBalance>, dataSource: DataSource, notificationsService: NotificationsService, telegramService: TelegramService, pricingEngine: PricingEngineService);
    create(createTripDto: CreateTripDto): Promise<CartaPorte>;
    startTrip(tripId: string, lat?: number, lng?: number): Promise<CartaPorte>;
    closeTrip(tripId: string, motivo: string, manager?: any): Promise<CartaPorte>;
    cancelTrip(tripId: string, motivo?: string): Promise<CartaPorte>;
    updateStatus(tripId: string, dto: UpdateTripStatusDto, userRole?: string): Promise<CartaPorte>;
    calculateSmartEta(tripId: string): Promise<{
        etaMinutes: number;
        speedKmh: number;
    }>;
    getBillingReport(tenantId: string, month?: number, year?: number): Promise<any>;
    generateMonthlyReportBuffer(tenantId: string, month: number, year: number, format: 'excel' | 'pdf'): Promise<any>;
    sendSettlementSummary(tenantId: string, month: number, year: number, chatId: string): Promise<void>;
    importBulkFromExcel(tenantId: string, buffer: Buffer): Promise<any>;
    update(id: string, dto: any, role: string): Promise<any>;
    remove(id: string, role: string): Promise<void>;
    getHistory(id: string): Promise<any>;
    calculateStats(tenantId: string, filters: {
        choferId?: string;
        clientId?: string;
        period?: string;
    }): Promise<{
        count: number;
        newTripsCount: number;
        creditTripsCount: number;
        totalWeight: number;
        totalKm: number;
        totalMoney: number;
        trips: {
            id: string;
            numeroCP: string;
            fecha: Date;
            cliente: string;
            chofer: string;
            monto: number;
            km: number;
            peso: number;
            esCredito: boolean;
            estado: string;
        }[];
    }>;
    findAllActive(): Promise<any[]>;
    findAll(tenantId: string, filters?: any): Promise<CartaPorte[]>;
    deletePricingRule(id: string, role: string): Promise<{
        success: boolean;
    }>;
    findActiveByDriver(driverId: string): Promise<any | null>;
    getDriverQueue(driverId: string): Promise<CartaPorte[]>;
    getDistance(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number>;
    getTenant(id: string): Promise<Tenant | null>;
    getTenantAdmin(tenantId: string): Promise<User | null>;
    createAuditLog(data: {
        tenantId: string;
        accion: string;
        descripcion: string;
        dataNueva?: string;
    }): Promise<AuditLog>;
    private checkHardLock;
}
