import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripStatusDto } from './dto/update-trip-status.dto';
import { GpsTrackingService } from './gps-tracking.service';
import { CreateGpsPingDto } from './dto/create-gps-ping.dto';
import * as express from 'express';
export declare class TripsController {
    private readonly tripsService;
    private readonly gpsService;
    constructor(tripsService: TripsService, gpsService: GpsTrackingService);
    getMonthlyReport(month: number, year: number, format: 'excel' | 'pdf', req: any, res: express.Response): Promise<void>;
    bulkImport(file: any, req: any): Promise<any>;
    create(createTripDto: CreateTripDto, req: any): Promise<import("../database/entities/carta-porte.entity").CartaPorte>;
    recordPing(dto: CreateGpsPingDto): Promise<{
        status: string;
    }>;
    updateStatus(id: string, dto: UpdateTripStatusDto, req: any): Promise<import("../database/entities/carta-porte.entity").CartaPorte>;
    findActiveByDriver(req: any): Promise<any>;
    getQueue(req: any): Promise<import("../database/entities/carta-porte.entity").CartaPorte[]>;
    getStats(tenantId: string, choferId?: string, clientId?: string, period?: 'DAY' | 'WEEK' | 'FORTNIGHT' | 'MONTH' | 'ALL'): Promise<{
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
    findAll(queryTenantId: string, choferId: string, clientId: string, cp: string, req: any): Promise<import("../database/entities/carta-porte.entity").CartaPorte[]>;
    update(id: string, dto: Partial<CreateTripDto>, req: any): Promise<any>;
    cancel(id: string, body: {
        comentario?: string;
    }, req: any): Promise<import("../database/entities/carta-porte.entity").CartaPorte>;
    deletePricingRule(id: string, role: string): Promise<{
        success: boolean;
    }>;
    getHistory(id: string): Promise<any>;
    remove(id: string, req: any): Promise<void>;
    geocode(q: string): Promise<any>;
}
