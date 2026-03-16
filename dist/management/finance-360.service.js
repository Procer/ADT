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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Finance360Service = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const carta_porte_entity_1 = require("../database/entities/carta-porte.entity");
const financial_lot_entity_1 = require("../database/entities/financial-lot.entity");
const payment_lot_entity_1 = require("../database/entities/payment-lot.entity");
const lot_deduction_entity_1 = require("../database/entities/lot-deduction.entity");
const adt_credit_entity_1 = require("../database/entities/adt-credit.entity");
const adt_recaudacion_entity_1 = require("../database/entities/adt-recaudacion.entity");
const tenant_entity_1 = require("../database/entities/tenant.entity");
const financial_reporting_service_1 = require("./financial-reporting.service");
const client_entity_1 = require("../database/entities/client.entity");
const driver_entity_1 = require("../database/entities/driver.entity");
let Finance360Service = class Finance360Service {
    tripsRepo;
    financialLotRepo;
    paymentLotRepo;
    deductionRepo;
    adtCreditRepo;
    adtRecaudacionRepo;
    tenantRepo;
    clientRepo;
    reportingService;
    dataSource;
    constructor(tripsRepo, financialLotRepo, paymentLotRepo, deductionRepo, adtCreditRepo, adtRecaudacionRepo, tenantRepo, clientRepo, reportingService, dataSource) {
        this.tripsRepo = tripsRepo;
        this.financialLotRepo = financialLotRepo;
        this.paymentLotRepo = paymentLotRepo;
        this.deductionRepo = deductionRepo;
        this.adtCreditRepo = adtCreditRepo;
        this.adtRecaudacionRepo = adtRecaudacionRepo;
        this.tenantRepo = tenantRepo;
        this.clientRepo = clientRepo;
        this.reportingService = reportingService;
        this.dataSource = dataSource;
    }
    async createFinancialLot(tenantId, clientId, tripIds) {
        return await this.dataSource.transaction(async (manager) => {
            const trips = await manager.find(carta_porte_entity_1.CartaPorte, {
                where: { id: (0, typeorm_2.In)(tripIds), tenantId, clientId, financialLotId: (0, typeorm_2.IsNull)() }
            });
            if (trips.length === 0)
                throw new common_1.BadRequestException('No valid trips found for proforma');
            const lot = manager.create(financial_lot_entity_1.FinancialLot, {
                tenantId,
                clientId,
                status: 'PROFORMADO',
                totalNeto: trips.reduce((sum, t) => sum + Number(t.revenueAtExecution || 0), 0)
            });
            const savedLot = await manager.save(lot);
            const client = await manager.findOne(client_entity_1.Client, { where: { id: clientId } });
            const tenant = await manager.findOne(tenant_entity_1.Tenant, { where: { id: tenantId } });
            const pdfBuffer = await this.reportingService.generatePreInvoice({
                tenantName: tenant?.nombreEmpresa || 'ADT System',
                clientName: client?.nombreRazonSocial || 'Cliente Genérico',
                period: new Date().toLocaleDateString(),
                trips: trips.map(t => ({
                    fecha: t.tsCreacion,
                    origen: t.origenNombre || 'N/A',
                    destino: t.destinoNombre || 'N/A',
                    km: t.distanciaTotalRecorridaKm || 0,
                    monto: Number(t.revenueAtExecution || 0)
                })),
                total: trips.reduce((s, t) => s + Number(t.revenueAtExecution || 0), 0)
            });
            const storagePath = path.join(process.cwd(), 'storage', tenantId, 'dadores', 'proformas');
            if (!fs.existsSync(storagePath))
                fs.mkdirSync(storagePath, { recursive: true });
            const fileName = `${savedLot.id}.pdf`;
            const fullPath = path.join(storagePath, fileName);
            fs.writeFileSync(fullPath, pdfBuffer);
            savedLot.proformaPath = `storage/${tenantId}/dadores/proformas/${fileName}`;
            await manager.save(savedLot);
            for (const trip of trips) {
                trip.financialLotId = savedLot.id;
                trip.precioDadorSnap = Number(trip.revenueAtExecution || 0);
                await manager.save(trip);
            }
            return savedLot;
        });
    }
    async createPaymentLot(tenantId, choferId, tripIds, deductions) {
        return await this.dataSource.transaction(async (manager) => {
            const trips = await manager.find(carta_porte_entity_1.CartaPorte, {
                where: { id: (0, typeorm_2.In)(tripIds), tenantId, choferId, paymentLotId: (0, typeorm_2.IsNull)() }
            });
            if (trips.length === 0)
                throw new common_1.BadRequestException('No valid trips found for payment');
            const totalBruto = trips.reduce((sum, t) => sum + Number(t.costAtExecution || 0), 0);
            const deduccionesTotal = deductions.reduce((sum, d) => sum + Number(d.monto), 0);
            const lot = manager.create(payment_lot_entity_1.PaymentLot, {
                tenantId,
                choferId,
                totalBruto,
                deduccionesTotal,
                netoFinal: totalBruto - deduccionesTotal
            });
            const savedLot = await manager.save(lot);
            const driver = await manager.findOne(driver_entity_1.Driver, { where: { id: choferId } });
            const tenant = await manager.findOne(tenant_entity_1.Tenant, { where: { id: tenantId } });
            const pdfBuffer = await this.reportingService.generateDriverReceipt({
                tenantName: tenant?.nombreEmpresa || 'ADT System',
                driverName: driver?.nombre || 'Chofer Genérico',
                period: new Date().toLocaleDateString(),
                trips: trips.map(t => ({
                    fecha: t.tsCreacion,
                    concepto: `Viaje CP: ${t.numeroCP || t.id.split('-')[0]}`,
                    monto: Number(t.costAtExecution || 0)
                })),
                total: totalBruto - deduccionesTotal
            });
            const storagePath = path.join(process.cwd(), 'storage', tenantId, 'choferes', 'liquidaciones');
            if (!fs.existsSync(storagePath))
                fs.mkdirSync(storagePath, { recursive: true });
            const fileName = `${savedLot.id}.pdf`;
            const fullPath = path.join(storagePath, fileName);
            fs.writeFileSync(fullPath, pdfBuffer);
            savedLot.comprobantePath = `storage/${tenantId}/choferes/liquidaciones/${fileName}`;
            await manager.save(savedLot);
            for (const trip of trips) {
                trip.paymentLotId = savedLot.id;
                await manager.save(trip);
            }
            for (const d of deductions) {
                const deduction = manager.create(lot_deduction_entity_1.LotDeduction, {
                    paymentLotId: savedLot.id,
                    ...d
                });
                await manager.save(deduction);
            }
            return savedLot;
        });
    }
    async handleTripCancellation(tripId) {
        return await this.dataSource.transaction(async (manager) => {
            const trip = await manager.findOne(carta_porte_entity_1.CartaPorte, { where: { id: tripId } });
            if (!trip)
                throw new common_1.BadRequestException('Trip not found');
            if (trip.estado !== 'ANULADO') {
                trip.estado = 'ANULADO';
                await manager.save(trip);
            }
            const credit = manager.create(adt_credit_entity_1.AdtCredit, {
                clientId: trip.clientId,
                tripIdOriginal: trip.id,
                montoNominalOriginal: Number(trip.montoAbonadoOriginal || 0),
                status: 'DISPONIBLE'
            });
            return await manager.save(credit);
        });
    }
    async conciliateFinancialLot(lotId) {
        const lot = await this.financialLotRepo.findOne({ where: { id: lotId } });
        if (!lot)
            throw new common_1.BadRequestException('Financial lot not found');
        lot.status = 'CONCILIADO';
        return await this.financialLotRepo.save(lot);
    }
    async calculateUpcharge(clientId, currentPrice) {
        const activeCredit = await this.adtCreditRepo.findOne({
            where: { clientId, status: 'DISPONIBLE' },
            order: { createdAt: 'ASC' }
        });
        if (!activeCredit)
            return 0;
        const differential = currentPrice - Number(activeCredit.montoNominalOriginal);
        return differential > 0 ? differential : 0;
    }
    async getDashboardKPIs(tenantId, startDate, endDate) {
        try {
            console.log(`[FINANCE DEBUG] getDashboardKPIs started for tenantId: ${tenantId}, range: ${startDate?.toISOString()} - ${endDate?.toISOString()}`);
            const trips = await this.tripsRepo.find({
                where: { tenantId }
            });
            const filtered = trips.filter(t => {
                if (!startDate || !endDate)
                    return true;
                const d = new Date(t.tsCreacion);
                return d >= startDate && d <= endDate;
            });
            const newTrips = filtered.filter(t => !t.esCredito);
            const creditTrips = filtered.filter(t => t.esCredito);
            const revenue = filtered.reduce((s, t) => s + Number(t.precioDadorSnap || t.revenueAtExecution || 0), 0);
            const costs = filtered.reduce((s, t) => s + Number(t.costAtExecution || 0), 0);
            const upcharges = filtered.reduce((s, t) => s + Number(t.deudaUpcharge || t.montoUpcharge || 0), 0);
            const fees = filtered.reduce((s, t) => s + Number(t.precioCongelado || 0), 0);
            const netProfit = revenue - (costs + fees + upcharges);
            const clients = await this.clientRepo.find({ where: { tenantId } });
            const byClient = {};
            for (const c of clients) {
                const clientTrips = filtered.filter(t => t.clientId === c.id);
                if (clientTrips.length === 0)
                    continue;
                const clientRevenue = clientTrips.reduce((s, t) => s + Number(t.precioDadorSnap || t.revenueAtExecution || 0), 0);
                const clientCosts = clientTrips.reduce((s, t) => s + Number(t.costAtExecution || 0), 0);
                const clientUpcharges = clientTrips.reduce((s, t) => s + Number(t.deudaUpcharge || t.montoUpcharge || 0), 0);
                const clientProfit = clientRevenue - (clientCosts + clientUpcharges);
                const margin = clientRevenue > 0 ? (clientProfit / clientRevenue) * 100 : 0;
                byClient[c.nombreRazonSocial] = {
                    trips: clientTrips.length,
                    newTrips: clientTrips.filter(t => !t.esCredito).length,
                    creditTrips: clientTrips.filter(t => t.esCredito).length,
                    revenue: clientRevenue,
                    costs: clientCosts,
                    upcharges: clientUpcharges,
                    profit: clientProfit,
                    margin: Number(margin.toFixed(2))
                };
            }
            return {
                ingresoBruto: revenue,
                costoOperativo: costs + fees + upcharges,
                costoPlataforma: fees,
                upcharges,
                margenNeto: netProfit,
                totalViajes: filtered.length,
                newTripsCount: newTrips.length,
                creditTripsCount: creditTrips.length,
                breakdown: {
                    driverPayouts: costs,
                    platformFees: fees,
                    upcharges: upcharges
                },
                byClient,
                totalProfit: netProfit,
                startDate: startDate?.toISOString(),
                endDate: endDate?.toISOString()
            };
        }
        catch (error) {
            console.error('[FINANCE SERVICE] Error critico en getDashboardKPIs:', error);
            return {
                ingresoBruto: 0,
                costoOperativo: 0,
                costoPlataforma: 0,
                upcharges: 0,
                margenNeto: 0,
                totalViajes: 0,
                newTripsCount: 0,
                creditTripsCount: 0,
                byClient: {},
                totalProfit: 0,
                tripsCount: 0,
                totalAdtFee: 0,
                error: error.message
            };
        }
    }
};
exports.Finance360Service = Finance360Service;
exports.Finance360Service = Finance360Service = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(carta_porte_entity_1.CartaPorte)),
    __param(1, (0, typeorm_1.InjectRepository)(financial_lot_entity_1.FinancialLot)),
    __param(2, (0, typeorm_1.InjectRepository)(payment_lot_entity_1.PaymentLot)),
    __param(3, (0, typeorm_1.InjectRepository)(lot_deduction_entity_1.LotDeduction)),
    __param(4, (0, typeorm_1.InjectRepository)(adt_credit_entity_1.AdtCredit)),
    __param(5, (0, typeorm_1.InjectRepository)(adt_recaudacion_entity_1.AdtRecaudacion)),
    __param(6, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __param(7, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        financial_reporting_service_1.FinancialReportingService,
        typeorm_2.DataSource])
], Finance360Service);
//# sourceMappingURL=finance-360.service.js.map