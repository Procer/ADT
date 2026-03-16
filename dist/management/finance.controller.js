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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const carta_porte_entity_1 = require("../database/entities/carta-porte.entity");
const tenant_entity_1 = require("../database/entities/tenant.entity");
const client_entity_1 = require("../database/entities/client.entity");
const driver_entity_1 = require("../database/entities/driver.entity");
const wallet_balance_entity_1 = require("../database/entities/wallet-balance.entity");
const finance_360_service_1 = require("./finance-360.service");
const financial_reporting_service_1 = require("./financial-reporting.service");
const public_decorator_1 = require("../auth/public.decorator");
const financial_lot_entity_1 = require("../database/entities/financial-lot.entity");
const payment_lot_entity_1 = require("../database/entities/payment-lot.entity");
const travel_credit_entity_1 = require("../database/entities/travel-credit.entity");
let FinanceController = class FinanceController {
    tripsRepo;
    tenantRepo;
    clientRepo;
    driverRepo;
    walletRepo;
    financialLotRepo;
    paymentLotRepo;
    creditsRepo;
    finance360;
    reportingService;
    dataSource;
    constructor(tripsRepo, tenantRepo, clientRepo, driverRepo, walletRepo, financialLotRepo, paymentLotRepo, creditsRepo, finance360, reportingService, dataSource) {
        this.tripsRepo = tripsRepo;
        this.tenantRepo = tenantRepo;
        this.clientRepo = clientRepo;
        this.driverRepo = driverRepo;
        this.walletRepo = walletRepo;
        this.financialLotRepo = financialLotRepo;
        this.paymentLotRepo = paymentLotRepo;
        this.creditsRepo = creditsRepo;
        this.finance360 = finance360;
        this.reportingService = reportingService;
        this.dataSource = dataSource;
    }
    async ping() {
        return { status: 'ok', service: 'FinanceController V3' };
    }
    async getDashboardKPIs(tenantId, start, end) {
        if (!tenantId)
            throw new common_1.BadRequestException('tenantId is required');
        const startDate = start ? new Date(start) : undefined;
        const endDate = end ? new Date(end) : undefined;
        return await this.finance360.getDashboardKPIs(tenantId, startDate, endDate);
    }
    async getCollectKPIs(tenantId) {
        if (!tenantId)
            throw new common_1.BadRequestException('tenantId is required');
        const allTrips = await this.tripsRepo.find({
            where: {
                tenantId,
                estado: (0, typeorm_2.In)(['ENTREGADO', 'FINALIZADO', 'LLEGUE'])
            }
        });
        const pendingTrips = allTrips.filter(t => !t.financialLotId);
        const totalPendingProforma = pendingTrips.reduce((s, t) => s + Number(t.revenueAtExecution || 0), 0);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const criticalTripsCount = pendingTrips.filter(t => new Date(t.tsCreacion) < sevenDaysAgo).length;
        const allLotes = await this.financialLotRepo.find({ where: { tenantId } });
        const totalAwaitingPayment = allLotes
            .filter(l => l.status === 'PROFORMADO')
            .reduce((s, l) => s + Number(l.totalNeto || 0), 0);
        const now = new Date();
        const monthlyCollected = allLotes
            .filter(l => l.status === 'CONCILIADO' &&
            new Date(l.updatedAt).getMonth() === now.getMonth() &&
            new Date(l.updatedAt).getFullYear() === now.getFullYear())
            .reduce((s, l) => s + Number(l.totalNeto || 0), 0);
        return {
            totalPendingProforma,
            totalAwaitingPayment,
            criticalTripsCount,
            monthlyCollected
        };
    }
    async getFinance(tenantId, month, year, clientId) {
        if (!tenantId)
            throw new common_1.BadRequestException('tenantId is required');
        const m = parseInt(month);
        const y = parseInt(year);
        const tenant = await this.tenantRepo.findOne({
            where: { id: tenantId },
            relations: ['pricings'],
            order: { pricings: { fechaDesde: 'DESC' } }
        });
        const allWallets = await this.walletRepo.find({ where: { tenantId } });
        const totalCredits = allWallets.reduce((s, w) => s + Number(w.saldoCreditos || 0), 0);
        const clients = await this.clientRepo.find({ where: { tenantId } });
        const getHistoricalPrice = (trip) => {
            if (Number(trip.precioCongelado) > 0)
                return Number(trip.precioCongelado);
            if (!tenant?.pricings || tenant.pricings.length === 0)
                return 1500;
            const pricing = tenant.pricings.find(p => new Date(trip.tsCreacion) >= new Date(p.fechaDesde));
            return Number(pricing?.precioCp || tenant.pricings[tenant.pricings.length - 1].precioCp || 1500);
        };
        const latestPricing = tenant?.pricings?.[0];
        const tenantPricing = Number(latestPricing?.precioCp || 0);
        const allTenantTrips = await this.tripsRepo.find({
            where: {
                tenantId,
                estado: (0, typeorm_2.In)(['FINALIZADO', 'ENTREGADO', 'EN_CAMINO', 'PENDIENTE', 'OPERANDO', 'LLEGUE', 'SOLICITADO', 'ANULADO', 'VOID_CREDIT'])
            },
            relations: ['client']
        });
        const clientIdFilter = clientId;
        const filteredGlobal = allTenantTrips.filter(t => {
            const d = new Date(t.tsCreacion);
            const isCurrentMonth = d.getMonth() + 1 === m && d.getFullYear() === y;
            const isActive = ['EN_CAMINO', 'PENDIENTE', 'OPERANDO', 'LLEGUE', 'SOLICITADO'].includes(t.estado);
            const matchesClient = !clientIdFilter || t.clientId === clientIdFilter;
            return (isCurrentMonth || isActive) && matchesClient;
        });
        const totalDespachos = filteredGlobal.length;
        const totalAmountOwed = Number(tenant?.deudaActual || 0);
        const unpaidTripsGlobal = allTenantTrips.filter(t => !t.pagoConfirmado && !['ANULADO', 'VOID_CREDIT'].includes(t.estado));
        const breakdown = await Promise.all(clients.map(async (c) => {
            const clientTripsFiltered = filteredGlobal.filter(t => t.clientId === c.id);
            const clientUnpaidGlobal = unpaidTripsGlobal.filter(t => t.clientId === c.id);
            const wallet = allWallets.find(w => w.clientId === c.id);
            const newTrips = clientTripsFiltered.filter(t => !t.esCredito);
            const valeTrips = clientTripsFiltered.filter(t => t.esCredito);
            const dDebtGlobal = clientUnpaidGlobal.filter(t => !t.esCredito).reduce((s, t) => s + getHistoricalPrice(t), 0);
            const uDebtGlobal = clientUnpaidGlobal.filter(t => t.esCredito).reduce((s, t) => s + Number(t.montoUpcharge || 0), 0);
            return {
                id: c.id,
                nombre: c.nombreRazonSocial,
                totalCps: clientTripsFiltered.length,
                newTripsCount: newTrips.length,
                usedValesCount: valeTrips.length,
                credits: Number(wallet?.saldoCreditos || 0) || 0,
                directDebt: newTrips.reduce((s, t) => s + getHistoricalPrice(t), 0),
                upchargeDebt: valeTrips.reduce((s, t) => s + Number(t.montoUpcharge || 0), 0),
                totalUnpaidDirect: dDebtGlobal,
                totalUnpaidUpcharge: uDebtGlobal,
                amountOwed: dDebtGlobal + uDebtGlobal,
                pendingCollect: clientTripsFiltered.filter(t => !t.financialLotId).reduce((s, t) => s + Number(t.revenueAtExecution || 0), 0)
            };
        }));
        const totalDirectDebt = breakdown.reduce((s, b) => s + b.directDebt, 0);
        const totalUpchargeDebt = breakdown.reduce((s, b) => s + b.upchargeDebt, 0);
        const totalNewTripsCount = breakdown.reduce((s, b) => s + b.newTripsCount, 0);
        const totalUsedValesCount = breakdown.reduce((s, b) => s + b.usedValesCount, 0);
        const history = filteredGlobal
            .sort((a, b) => new Date(b.tsCreacion).getTime() - new Date(a.tsCreacion).getTime())
            .map(t => {
            const isVoid = t.estado === 'VOID_CREDIT' || t.estado === 'ANULADO';
            const historicalPrice = getHistoricalPrice(t);
            const upcharge = Number(t.montoUpcharge || 0);
            return {
                fecha: t.tsCreacion,
                concepto: isVoid ? 'CARGO CP (ANULADO)' : (t.esCredito ? 'REUTILIZACIÓN VALE' : 'CARGO CP'),
                referencia: t.numeroCP || t.id.split('-')[0].toUpperCase(),
                costo: t.esCredito ? upcharge : historicalPrice,
                basePrice: t.esCredito ? (Number(t.montoAbonadoOriginal) || 0) : historicalPrice,
                upchargeAmount: upcharge,
                esCredito: t.esCredito,
                descripcion: isVoid
                    ? `Cargo por CP única (Generó 1 Crédito/Vale) - Viaje Anulado`
                    : (t.esCredito
                        ? `Uso de Vale anterior - Ajuste por aumento de precio: $${upcharge}`
                        : `Cargo por nueva CP - Tarifa: $${historicalPrice}`),
                usuario: t.cierreMotivo || 'Sistema'
            };
        });
        const unpaidTrips = allTenantTrips.filter(t => !t.pagoConfirmado && !['ANULADO', 'VOID_CREDIT'].includes(t.estado));
        const agingMap = {};
        unpaidTrips.forEach(t => {
            const d = new Date(t.tsCreacion);
            const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            const label = d.toLocaleString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase();
            const cost = t.esCredito ? Number(t.montoUpcharge || 0) : getHistoricalPrice(t);
            if (!agingMap[key]) {
                agingMap[key] = { label, amount: 0, sortKey: d.getTime() };
            }
            agingMap[key].amount += cost;
        });
        const aging = Object.keys(agingMap)
            .sort((a, b) => a.localeCompare(b))
            .map(key => ({
            periodo: agingMap[key].label,
            monto: agingMap[key].amount
        }));
        return {
            totalDespachos,
            totalNewTripsCount,
            totalUsedValesCount,
            credits: totalCredits,
            totalAmountOwed,
            totalDirectDebt,
            totalUpchargeDebt,
            costPerUnit: tenantPricing,
            pricingHistory: tenant?.pricings || [],
            breakdown,
            history,
            aging
        };
    }
    async getDriverSettlements(tenantId, month, year, cycle) {
        if (!tenantId)
            throw new common_1.BadRequestException('tenantId is required');
        const m = parseInt(month);
        const y = parseInt(year);
        const drivers = await this.driverRepo.find({
            where: {
                tenantId,
                ...(cycle ? { paymentCycle: cycle } : {})
            }
        });
        return Promise.all(drivers.map(async (d) => {
            const trips = await this.tripsRepo.find({
                where: {
                    choferId: d.id,
                    estado: (0, typeorm_2.In)(['FINALIZADO', 'ENTREGADO', 'EN_CAMINO', 'LIQUIDADO']),
                    paymentLotId: (0, typeorm_2.IsNull)()
                }
            });
            const filtered = trips.filter(t => {
                const dt = new Date(t.tsCreacion);
                return dt.getMonth() + 1 === m && dt.getFullYear() === y;
            });
            if (filtered.length === 0 && !cycle)
                return null;
            return {
                id: d.id,
                nombre: d.nombre,
                paymentCycle: d.paymentCycle,
                pendingTrips: filtered.length,
                amountToPay: filtered.reduce((s, t) => s + Number(t.costAtExecution || 0), 0)
            };
        })).then(results => results.filter(r => r !== null));
    }
    async exportExcel(tenantId, month, year, clientId, res) {
        if (!tenantId)
            throw new common_1.BadRequestException('tenantId is required');
        const m = parseInt(month);
        const y = parseInt(year);
        const tenant = await this.tenantRepo.findOne({
            where: { id: tenantId },
            relations: ['pricings'],
            order: { pricings: { fechaDesde: 'DESC' } }
        });
        const allWallets = await this.walletRepo.find({ where: { tenantId } });
        const clients = await this.clientRepo.find({ where: { tenantId } });
        const getHistoricalPrice = (trip) => {
            if (Number(trip.precioCongelado) > 0)
                return Number(trip.precioCongelado);
            if (!tenant?.pricings || tenant.pricings.length === 0)
                return 1500;
            const pricing = tenant.pricings.find(p => new Date(trip.tsCreacion) >= new Date(p.fechaDesde));
            return Number(pricing?.precioCp || tenant.pricings[tenant.pricings.length - 1].precioCp || 1500);
        };
        const allTenantTrips = await this.tripsRepo.find({
            where: {
                tenantId,
                estado: (0, typeorm_2.In)(['FINALIZADO', 'ENTREGADO', 'EN_CAMINO', 'PENDIENTE', 'OPERANDO', 'LLEGUE', 'SOLICITADO', 'ANULADO', 'VOID_CREDIT'])
            },
            relations: ['client']
        });
        const filteredGlobal = allTenantTrips.filter(t => {
            const d = new Date(t.tsCreacion);
            const isCurrentMonth = d.getMonth() + 1 === m && d.getFullYear() === y;
            const isActive = ['EN_CAMINO', 'PENDIENTE', 'OPERANDO', 'LLEGUE', 'SOLICITADO'].includes(t.estado);
            const matchesClient = !clientId || t.clientId === clientId;
            return (isCurrentMonth || isActive) && matchesClient;
        });
        const breakdown = await Promise.all(clients.map(async (c) => {
            const clientTrips = filteredGlobal.filter(t => t.clientId === c.id);
            const wallet = allWallets.find(w => w.clientId === c.id);
            const newTrips = clientTrips.filter(t => !t.esCredito);
            const valeTrips = clientTrips.filter(t => t.esCredito);
            const dDebt = newTrips.reduce((s, t) => s + getHistoricalPrice(t), 0);
            const uDebt = valeTrips.reduce((s, t) => s + Number(t.montoUpcharge || 0), 0);
            return {
                nombre: c.nombreRazonSocial,
                totalCps: clientTrips.length,
                newTripsCount: newTrips.length,
                usedValesCount: valeTrips.length,
                credits: Number(wallet?.saldoCreditos || 0) || 0,
                directDebt: dDebt,
                upchargeDebt: uDebt,
                amountOwed: dDebt + uDebt
            };
        }));
        const history = filteredGlobal
            .sort((a, b) => new Date(b.tsCreacion).getTime() - new Date(a.tsCreacion).getTime())
            .map(t => ({
            fecha: t.tsCreacion,
            concepto: (t.estado === 'VOID_CREDIT' || t.estado === 'ANULADO') ? 'CARGO CP (ANULADO)' : (t.esCredito ? 'REUTILIZACIÓN VALE' : 'CARGO CP'),
            referencia: t.numeroCP || t.id.split('-')[0].toUpperCase(),
            costo: t.esCredito ? Number(t.montoUpcharge || 0) : getHistoricalPrice(t),
            descripcion: (t.estado === 'VOID_CREDIT' || t.estado === 'ANULADO')
                ? `Cargo por CP única (Generó 1 Crédito/Vale) - Viaje Anulado`
                : (t.esCredito
                    ? `Uso de Vale anterior - Ajuste por aumento de precio: $${t.montoUpcharge}`
                    : `Cargo por flete pactado - Tarifa: $${getHistoricalPrice(t)}`),
            usuario: t.cierreMotivo || 'Sistema'
        }));
        const unpaidTrips = allTenantTrips.filter(t => !t.pagoConfirmado && !['ANULADO', 'VOID_CREDIT'].includes(t.estado));
        const agingMap = {};
        unpaidTrips.forEach(t => {
            const d = new Date(t.tsCreacion);
            const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!agingMap[key]) {
                agingMap[key] = { label: d.toLocaleString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase(), amount: 0 };
            }
            agingMap[key].amount += t.esCredito ? Number(t.montoUpcharge || 0) : getHistoricalPrice(t);
        });
        const aging = Object.keys(agingMap).sort().map(k => agingMap[k]);
        const totalCredits = allWallets.reduce((s, w) => s + Number(w.saldoCreditos || 0), 0);
        const buffer = await this.reportingService.generateStatusReportExcel({
            tenantName: tenant?.nombreEmpresa || 'ADT System',
            period: `${m}/${y}`,
            summary: {
                totalDespachos: filteredGlobal.length,
                directDebt: breakdown.reduce((s, b) => s + b.directDebt, 0),
                upchargeDebt: breakdown.reduce((s, b) => s + b.upchargeDebt, 0),
                credits: totalCredits,
                totalAmountOwed: Number(tenant?.deudaActual || 0)
            },
            breakdown,
            history,
            aging
        });
        res?.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename=Reporte_Finanzas_${m}_${y}.xlsx`,
            'Content-Length': buffer.length
        });
        res?.send(buffer);
    }
    async createFinancialLot(body) {
        return await this.finance360.createFinancialLot(body.tenantId, body.clientId, body.tripIds);
    }
    async createPaymentLot(body) {
        return await this.finance360.createPaymentLot(body.tenantId, body.choferId, body.tripIds, body.deductions);
    }
    async getFinancialLots(tenantId) {
        return await this.financialLotRepo.find({
            where: { tenantId },
            relations: ['client'],
            order: { createdAt: 'DESC' }
        });
    }
    async getPaymentLots(tenantId) {
        return await this.paymentLotRepo.find({
            where: { tenantId },
            relations: ['chofer'],
            order: { createdAt: 'DESC' }
        });
    }
    async conciliateProforma(id) {
        return await this.finance360.conciliateFinancialLot(id);
    }
    async downloadProforma(id, res) {
        const lot = await this.financialLotRepo.findOne({ where: { id } });
        if (!lot || !lot.proformaPath)
            throw new common_1.NotFoundException('Proforma PDF not found');
        const fullPath = path.join(process.cwd(), lot.proformaPath);
        if (!fs.existsSync(fullPath))
            throw new common_1.NotFoundException('File on disk not found');
        res.download(fullPath);
    }
    async downloadSettlement(id, res) {
        const lot = await this.paymentLotRepo.findOne({ where: { id } });
        if (!lot || !lot.comprobantePath)
            throw new common_1.NotFoundException('Settlement PDF not found');
        const fullPath = path.join(process.cwd(), lot.comprobantePath);
        if (!fs.existsSync(fullPath))
            throw new common_1.NotFoundException('File on disk not found');
        res.download(fullPath);
    }
    async exportProfitabilityPdf(tenantId, start, end, res) {
        if (!tenantId)
            throw new common_1.BadRequestException('tenantId is required');
        const startDate = new Date(start);
        const endDate = new Date(end);
        const stats = await this.finance360.getDashboardKPIs(tenantId, startDate, endDate);
        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        const period = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        const buffer = await this.reportingService.generateProfitabilityPdf({
            tenantName: tenant?.nombreEmpresa || 'ADT System',
            period,
            stats
        });
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Rentabilidad_${start.split('T')[0]}.pdf`,
            'Content-Length': buffer.length
        });
        res.send(buffer);
    }
    async getGlobalFinance(month, year) {
        const m = parseInt(month);
        const y = parseInt(year);
        const tenants = await this.tenantRepo.find();
        const results = [];
        for (const tenant of tenants) {
            const trips = await this.tripsRepo.find({
                where: { tenantId: tenant.id }
            });
            const filteredTrips = trips.filter(t => {
                const d = new Date(t.tsCreacion);
                return d.getMonth() + 1 === m && d.getFullYear() === y;
            });
            const availableCredits = await this.creditsRepo.count({
                where: { tenantId: tenant.id, usado: false }
            });
            let totalAmountOwed = 0;
            let paidTrips = 0;
            let pendingTripsCount = 0;
            filteredTrips.forEach(t => {
                const amount = t.esCredito ? Number(t.montoUpcharge || 0) : Number(t.precioCongelado || 0);
                totalAmountOwed += amount;
                if (t.esCredito) {
                    paidTrips++;
                }
                if (t.estado !== 'FINALIZADO') {
                    pendingTripsCount++;
                }
            });
            results.push({
                tenantId: tenant.id,
                nombreEmpresa: tenant.nombreEmpresa,
                totalTrips: filteredTrips.length,
                paidTrips,
                pendingTrips: pendingTripsCount,
                totalAmountOwed,
                availableCredits
            });
        }
        return results;
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "ping", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('dashboard-kpis'),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('start')),
    __param(2, (0, common_1.Query)('end')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getDashboardKPIs", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('collect-kpis'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getCollectKPIs", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('report'),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __param(3, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getFinance", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('settlements'),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __param(3, (0, common_1.Query)('cycle')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getDriverSettlements", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('export-excel'),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __param(3, (0, common_1.Query)('clientId')),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "exportExcel", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('lotes-dador'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "createFinancialLot", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('lotes-chofer'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "createPaymentLot", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('lotes-dador'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getFinancialLots", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('lotes-chofer'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getPaymentLots", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('lotes-dador/:id/conciliate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "conciliateProforma", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('lotes-dador/:id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "downloadProforma", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('lotes-chofer/:id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "downloadSettlement", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('profitability/export-pdf'),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('start')),
    __param(2, (0, common_1.Query)('end')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "exportProfitabilityPdf", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('finance/global'),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getGlobalFinance", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.Controller)('finance-v3'),
    __param(0, (0, typeorm_1.InjectRepository)(carta_porte_entity_1.CartaPorte)),
    __param(1, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __param(2, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __param(3, (0, typeorm_1.InjectRepository)(driver_entity_1.Driver)),
    __param(4, (0, typeorm_1.InjectRepository)(wallet_balance_entity_1.WalletBalance)),
    __param(5, (0, typeorm_1.InjectRepository)(financial_lot_entity_1.FinancialLot)),
    __param(6, (0, typeorm_1.InjectRepository)(payment_lot_entity_1.PaymentLot)),
    __param(7, (0, typeorm_1.InjectRepository)(travel_credit_entity_1.TravelCredit)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        finance_360_service_1.Finance360Service,
        financial_reporting_service_1.FinancialReportingService,
        typeorm_2.DataSource])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map