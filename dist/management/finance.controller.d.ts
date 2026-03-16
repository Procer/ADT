import type { Response } from 'express';
import { Repository, DataSource } from 'typeorm';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { Client } from '../database/entities/client.entity';
import { Driver } from '../database/entities/driver.entity';
import { WalletBalance } from '../database/entities/wallet-balance.entity';
import { Finance360Service } from './finance-360.service';
import { FinancialReportingService } from './financial-reporting.service';
import { FinancialLot } from '../database/entities/financial-lot.entity';
import { PaymentLot } from '../database/entities/payment-lot.entity';
import { TravelCredit } from '../database/entities/travel-credit.entity';
export declare class FinanceController {
    private tripsRepo;
    private tenantRepo;
    private clientRepo;
    private driverRepo;
    private walletRepo;
    private financialLotRepo;
    private paymentLotRepo;
    private creditsRepo;
    private finance360;
    private reportingService;
    private dataSource;
    constructor(tripsRepo: Repository<CartaPorte>, tenantRepo: Repository<Tenant>, clientRepo: Repository<Client>, driverRepo: Repository<Driver>, walletRepo: Repository<WalletBalance>, financialLotRepo: Repository<FinancialLot>, paymentLotRepo: Repository<PaymentLot>, creditsRepo: Repository<TravelCredit>, finance360: Finance360Service, reportingService: FinancialReportingService, dataSource: DataSource);
    ping(): Promise<{
        status: string;
        service: string;
    }>;
    getDashboardKPIs(tenantId: string, start?: string, end?: string): Promise<{
        ingresoBruto: number;
        costoOperativo: number;
        costoPlataforma: number;
        upcharges: number;
        margenNeto: number;
        totalViajes: number;
        newTripsCount: number;
        creditTripsCount: number;
        breakdown: {
            driverPayouts: number;
            platformFees: number;
            upcharges: number;
        };
        byClient: any;
        totalProfit: number;
        startDate: string | undefined;
        endDate: string | undefined;
        tripsCount?: undefined;
        totalAdtFee?: undefined;
        error?: undefined;
    } | {
        ingresoBruto: number;
        costoOperativo: number;
        costoPlataforma: number;
        upcharges: number;
        margenNeto: number;
        totalViajes: number;
        newTripsCount: number;
        creditTripsCount: number;
        byClient: {};
        totalProfit: number;
        tripsCount: number;
        totalAdtFee: number;
        error: any;
        breakdown?: undefined;
        startDate?: undefined;
        endDate?: undefined;
    }>;
    getCollectKPIs(tenantId: string): Promise<{
        totalPendingProforma: number;
        totalAwaitingPayment: number;
        criticalTripsCount: number;
        monthlyCollected: number;
    }>;
    getFinance(tenantId: string, month: string, year: string, clientId?: string): Promise<{
        totalDespachos: number;
        totalNewTripsCount: number;
        totalUsedValesCount: number;
        credits: number;
        totalAmountOwed: number;
        totalDirectDebt: number;
        totalUpchargeDebt: number;
        costPerUnit: number;
        pricingHistory: import("../database/entities/tenant-pricing.entity").TenantPricing[];
        breakdown: {
            id: string;
            nombre: string;
            totalCps: number;
            newTripsCount: number;
            usedValesCount: number;
            credits: number;
            directDebt: number;
            upchargeDebt: number;
            totalUnpaidDirect: number;
            totalUnpaidUpcharge: number;
            amountOwed: number;
            pendingCollect: number;
        }[];
        history: {
            fecha: Date;
            concepto: string;
            referencia: string;
            costo: number;
            basePrice: number;
            upchargeAmount: number;
            esCredito: boolean;
            descripcion: string;
            usuario: string;
        }[];
        aging: {
            periodo: string;
            monto: number;
        }[];
    }>;
    getDriverSettlements(tenantId: string, month: string, year: string, cycle?: string): Promise<{
        id: string;
        nombre: string;
        paymentCycle: string;
        pendingTrips: number;
        amountToPay: number;
    }[]>;
    exportExcel(tenantId: string, month: string, year: string, clientId?: string, res?: Response): Promise<void>;
    createFinancialLot(body: {
        tenantId: string;
        clientId: string;
        tripIds: string[];
    }): Promise<FinancialLot>;
    createPaymentLot(body: {
        tenantId: string;
        choferId: string;
        tripIds: string[];
        deductions: any[];
    }): Promise<PaymentLot>;
    getFinancialLots(tenantId: string): Promise<FinancialLot[]>;
    getPaymentLots(tenantId: string): Promise<PaymentLot[]>;
    conciliateProforma(id: string): Promise<FinancialLot>;
    downloadProforma(id: string, res: Response): Promise<void>;
    downloadSettlement(id: string, res: Response): Promise<void>;
    exportProfitabilityPdf(tenantId: string, start: string, end: string, res: Response): Promise<void>;
    getGlobalFinance(month: string, year: string): Promise<any[]>;
}
