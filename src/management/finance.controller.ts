import { Controller, Get, Post, Body, Query, BadRequestException, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull } from 'typeorm';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { Client } from '../database/entities/client.entity';
import { Driver } from '../database/entities/driver.entity';
import { WalletBalance } from '../database/entities/wallet-balance.entity';
import { Finance360Service } from './finance-360.service';
import { FinancialReportingService } from './financial-reporting.service';
import { Public } from '../auth/public.decorator';
import { FinancialLot } from '../database/entities/financial-lot.entity';
import { PaymentLot } from '../database/entities/payment-lot.entity';
import { TravelCredit } from '../database/entities/travel-credit.entity';

@Controller('finance-v3')
export class FinanceController {
    constructor(
        @InjectRepository(CartaPorte) private tripsRepo: Repository<CartaPorte>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        @InjectRepository(Client) private clientRepo: Repository<Client>,
        @InjectRepository(Driver) private driverRepo: Repository<Driver>,
        @InjectRepository(WalletBalance) private walletRepo: Repository<WalletBalance>,
        @InjectRepository(FinancialLot) private financialLotRepo: Repository<FinancialLot>,
        @InjectRepository(PaymentLot) private paymentLotRepo: Repository<PaymentLot>,
        @InjectRepository(TravelCredit) private creditsRepo: Repository<TravelCredit>,
        private finance360: Finance360Service,
        private reportingService: FinancialReportingService,
        private dataSource: DataSource,
    ) { }

    @Public()
    @Get('ping')
    async ping() {
        return { status: 'ok', service: 'FinanceController V3' };
    }

    @Public()
    @Get('dashboard-kpis')
    async getDashboardKPIs(
        @Query('tenantId') tenantId: string,
        @Query('start') start?: string,
        @Query('end') end?: string
    ) {
        if (!tenantId) throw new BadRequestException('tenantId is required');
        const startDate = start ? new Date(start) : undefined;
        const endDate = end ? new Date(end) : undefined;
        return await this.finance360.getDashboardKPIs(tenantId, startDate, endDate);
    }

    @Public()
    @Get('collect-kpis')
    async getCollectKPIs(@Query('tenantId') tenantId: string) {
        if (!tenantId) throw new BadRequestException('tenantId is required');

        const allTrips = await this.tripsRepo.find({
            where: {
                tenantId,
                estado: In(['ENTREGADO', 'FINALIZADO', 'LLEGUE'])
            }
        });

        const pendingTrips = allTrips.filter(t => !t.financialLotId);
        // Solo sumamos revenueAtExecution (Tarifa Dador Pactada). Jamás usar fallback a precio_congelado.
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

    @Public()
    @Get('report')
    async getFinance(
        @Query('tenantId') tenantId: string,
        @Query('month') month: string,
        @Query('year') year: string,
        @Query('clientId') clientId?: string
    ) {
        if (!tenantId) throw new BadRequestException('tenantId is required');
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

        const getHistoricalPrice = (trip: CartaPorte) => {
            // Prioridad 1: Precio congelado en el viaje (que ahora es el costo CP de ADT)
            if (Number(trip.precioCongelado) > 0) return Number(trip.precioCongelado);

            // Prioridad 2: Historial de precios del Tenant (Precio CP ADT)
            if (!tenant?.pricings || tenant.pricings.length === 0) return 1500;
            const pricing = tenant.pricings.find(p => new Date(trip.tsCreacion) >= new Date(p.fechaDesde));
            return Number(pricing?.precioCp || tenant.pricings[tenant.pricings.length - 1].precioCp || 1500);
        };

        const latestPricing = tenant?.pricings?.[0];
        const tenantPricing = Number(latestPricing?.precioCp || 0);

        // 1. Recuperar TODOS los viajes del tenant para el cálculo global de deuda
        const allTenantTrips = await this.tripsRepo.find({
            where: {
                tenantId,
                estado: In(['FINALIZADO', 'ENTREGADO', 'EN_CAMINO', 'PENDIENTE', 'OPERANDO', 'LLEGUE', 'SOLICITADO', 'ANULADO', 'VOID_CREDIT'])
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

        // 2. Desglose detallado (Global para justificar deudaActual)
        const unpaidTripsGlobal = allTenantTrips.filter(t => !t.pagoConfirmado && !['ANULADO', 'VOID_CREDIT'].includes(t.estado));

        const breakdown = await Promise.all(clients.map(async c => {
            const clientTripsFiltered = filteredGlobal.filter(t => t.clientId === c.id);
            const clientUnpaidGlobal = unpaidTripsGlobal.filter(t => t.clientId === c.id);
            const wallet = allWallets.find(w => w.clientId === c.id);

            const newTrips = clientTripsFiltered.filter(t => !t.esCredito);
            const valeTrips = clientTripsFiltered.filter(t => t.esCredito);

            // Deuda total acumulada de este dador para ADT
            const dDebtGlobal = clientUnpaidGlobal.filter(t => !t.esCredito).reduce((s, t) => s + getHistoricalPrice(t), 0);
            const uDebtGlobal = clientUnpaidGlobal.filter(t => t.esCredito).reduce((s, t) => s + Number(t.montoUpcharge || 0), 0);

            return {
                id: c.id,
                nombre: c.nombreRazonSocial,
                totalCps: clientTripsFiltered.length,
                newTripsCount: newTrips.length,
                usedValesCount: valeTrips.length,
                credits: Number(wallet?.saldoCreditos || 0) || 0,
                directDebt: newTrips.reduce((s, t) => s + getHistoricalPrice(t), 0), // Del periodo filtrado
                upchargeDebt: valeTrips.reduce((s, t) => s + Number(t.montoUpcharge || 0), 0), // Del periodo filtrado
                totalUnpaidDirect: dDebtGlobal,
                totalUnpaidUpcharge: uDebtGlobal,
                amountOwed: dDebtGlobal + uDebtGlobal,
                // Campo informativo para el dashboard de cobranzas:
                pendingCollect: clientTripsFiltered.filter(t => !t.financialLotId).reduce((s, t) => s + Number(t.revenueAtExecution || 0), 0)
            };
        }));

        const totalDirectDebt = breakdown.reduce((s, b) => s + b.directDebt, 0); // Mes actual
        const totalUpchargeDebt = breakdown.reduce((s, b) => s + b.upchargeDebt, 0); // Mes actual
        const totalNewTripsCount = breakdown.reduce((s, b) => s + b.newTripsCount, 0);
        const totalUsedValesCount = breakdown.reduce((s, b) => s + b.usedValesCount, 0);

        // 3. Historial de Movimientos
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

        // 4. Calcular Antigüedad de la Deuda (Aging)
        // Solo tomamos viajes que NO están confirmados como pagos y que generaron deuda
        const unpaidTrips = allTenantTrips.filter(t => !t.pagoConfirmado && !['ANULADO', 'VOID_CREDIT'].includes(t.estado));
        const agingMap: Record<string, { label: string, amount: number, sortKey: number }> = {};

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

    @Public()
    @Get('settlements')
    async getDriverSettlements(
        @Query('tenantId') tenantId: string,
        @Query('month') month: string,
        @Query('year') year: string,
        @Query('cycle') cycle?: string
    ) {
        if (!tenantId) throw new BadRequestException('tenantId is required');
        const m = parseInt(month);
        const y = parseInt(year);

        const drivers = await this.driverRepo.find({
            where: {
                tenantId,
                ...(cycle ? { paymentCycle: cycle } : {})
            }
        });

        return Promise.all(drivers.map(async d => {
            const trips = await this.tripsRepo.find({
                where: {
                    choferId: d.id,
                    estado: In(['FINALIZADO', 'ENTREGADO', 'EN_CAMINO', 'LIQUIDADO']),
                    paymentLotId: IsNull() // IMPORTANTE: Solo viajes no liquidados
                }
            });

            const filtered = trips.filter(t => {
                const dt = new Date(t.tsCreacion);
                return dt.getMonth() + 1 === m && dt.getFullYear() === y;
            });

            if (filtered.length === 0 && !cycle) return null; // Limpiar vista si no hay deuda, a menos que se filtre por ciclo

            return {
                id: d.id,
                nombre: d.nombre,
                paymentCycle: d.paymentCycle,
                pendingTrips: filtered.length,
                amountToPay: filtered.reduce((s, t) => s + Number(t.costAtExecution || 0), 0)
            };
        })).then(results => results.filter(r => r !== null));
    }

    @Public()
    @Get('export-excel')
    async exportExcel(
        @Query('tenantId') tenantId: string,
        @Query('month') month: string,
        @Query('year') year: string,
        @Query('clientId') clientId?: string,
        @Res() res?: Response
    ) {
        if (!tenantId) throw new BadRequestException('tenantId is required');
        const m = parseInt(month);
        const y = parseInt(year);

        const tenant = await this.tenantRepo.findOne({
            where: { id: tenantId },
            relations: ['pricings'],
            order: { pricings: { fechaDesde: 'DESC' } }
        });
        const allWallets = await this.walletRepo.find({ where: { tenantId } });
        const clients = await this.clientRepo.find({ where: { tenantId } });

        const getHistoricalPrice = (trip: CartaPorte) => {
            if (Number(trip.precioCongelado) > 0) return Number(trip.precioCongelado);
            if (!tenant?.pricings || tenant.pricings.length === 0) return 1500;
            const pricing = tenant.pricings.find(p => new Date(trip.tsCreacion) >= new Date(p.fechaDesde));
            return Number(pricing?.precioCp || tenant.pricings[tenant.pricings.length - 1].precioCp || 1500);
        };

        const allTenantTrips = await this.tripsRepo.find({
            where: {
                tenantId,
                estado: In(['FINALIZADO', 'ENTREGADO', 'EN_CAMINO', 'PENDIENTE', 'OPERANDO', 'LLEGUE', 'SOLICITADO', 'ANULADO', 'VOID_CREDIT'])
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

        // 2. Desglose por cliente
        const breakdown = await Promise.all(clients.map(async c => {
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
        const agingMap: Record<string, { label: string, amount: number }> = {};
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

    @Public()
    @Post('lotes-dador')
    async createFinancialLot(@Body() body: { tenantId: string, clientId: string, tripIds: string[] }) {
        return await this.finance360.createFinancialLot(body.tenantId, body.clientId, body.tripIds);
    }

    @Public()
    @Post('lotes-chofer')
    async createPaymentLot(@Body() body: { tenantId: string, choferId: string, tripIds: string[], deductions: any[] }) {
        return await this.finance360.createPaymentLot(body.tenantId, body.choferId, body.tripIds, body.deductions);
    }

    @Public()
    @Get('lotes-dador')
    async getFinancialLots(@Query('tenantId') tenantId: string) {
        return await this.financialLotRepo.find({
            where: { tenantId },
            relations: ['client'],
            order: { createdAt: 'DESC' }
        });
    }

    @Public()
    @Get('lotes-chofer')
    async getPaymentLots(@Query('tenantId') tenantId: string) {
        return await this.paymentLotRepo.find({
            where: { tenantId },
            relations: ['chofer'],
            order: { createdAt: 'DESC' }
        });
    }

    @Public()
    @Post('lotes-dador/:id/conciliate')
    async conciliateProforma(@Param('id') id: string) {
        return await this.finance360.conciliateFinancialLot(id);
    }

    @Public()
    @Get('lotes-dador/:id/pdf')
    async downloadProforma(@Param('id') id: string, @Res() res: Response) {
        const lot = await this.financialLotRepo.findOne({ where: { id } });
        if (!lot || !lot.proformaPath) throw new NotFoundException('Proforma PDF not found');

        const fullPath = path.join(process.cwd(), lot.proformaPath);
        if (!fs.existsSync(fullPath)) throw new NotFoundException('File on disk not found');

        res.download(fullPath);
    }

    @Public()
    @Get('lotes-chofer/:id/pdf')
    async downloadSettlement(@Param('id') id: string, @Res() res: Response) {
        const lot = await this.paymentLotRepo.findOne({ where: { id } });
        if (!lot || !lot.comprobantePath) throw new NotFoundException('Settlement PDF not found');

        const fullPath = path.join(process.cwd(), lot.comprobantePath);
        if (!fs.existsSync(fullPath)) throw new NotFoundException('File on disk not found');

        res.download(fullPath);
    }

    @Public()
    @Get('profitability/export-pdf')
    async exportProfitabilityPdf(
        @Query('tenantId') tenantId: string,
        @Query('start') start: string,
        @Query('end') end: string,
        @Res() res: Response
    ) {
        if (!tenantId) throw new BadRequestException('tenantId is required');

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

    @Public()
    @Get('finance/global')
    async getGlobalFinance(
        @Query('month') month: string,
        @Query('year') year: string
    ) {
        const m = parseInt(month);
        const y = parseInt(year);

        const tenants = await this.tenantRepo.find();
        const results: any[] = [];

        for (const tenant of tenants) {
            // Obtener viajes del periodo
            const trips = await this.tripsRepo.find({
                where: { tenantId: tenant.id }
            });

            const filteredTrips = trips.filter(t => {
                const d = new Date(t.tsCreacion);
                return d.getMonth() + 1 === m && d.getFullYear() === y;
            });

            // Créditos disponibles
            const availableCredits = await this.creditsRepo.count({
                where: { tenantId: tenant.id, usado: false }
            });

            // Calcular deuda y totales
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
}
