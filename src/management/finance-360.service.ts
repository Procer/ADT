import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull } from 'typeorm';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { FinancialLot } from '../database/entities/financial-lot.entity';
import { PaymentLot } from '../database/entities/payment-lot.entity';
import { LotDeduction } from '../database/entities/lot-deduction.entity';
import { AdtCredit } from '../database/entities/adt-credit.entity';
import { AdtRecaudacion } from '../database/entities/adt-recaudacion.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { FinancialReportingService } from './financial-reporting.service';
import { Client } from '../database/entities/client.entity';
import { Driver } from '../database/entities/driver.entity';

@Injectable()
export class Finance360Service {
    constructor(
        @InjectRepository(CartaPorte) private tripsRepo: Repository<CartaPorte>,
        @InjectRepository(FinancialLot) private financialLotRepo: Repository<FinancialLot>,
        @InjectRepository(PaymentLot) private paymentLotRepo: Repository<PaymentLot>,
        @InjectRepository(LotDeduction) private deductionRepo: Repository<LotDeduction>,
        @InjectRepository(AdtCredit) private adtCreditRepo: Repository<AdtCredit>,
        @InjectRepository(AdtRecaudacion) private adtRecaudacionRepo: Repository<AdtRecaudacion>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        @InjectRepository(Client) private clientRepo: Repository<Client>,
        private reportingService: FinancialReportingService,
        private dataSource: DataSource,
    ) { }

    async createFinancialLot(tenantId: string, clientId: string, tripIds: string[]) {
        return await this.dataSource.transaction(async manager => {
            const trips = await manager.find(CartaPorte, {
                where: { id: In(tripIds), tenantId, clientId, financialLotId: IsNull() }
            });

            if (trips.length === 0) throw new BadRequestException('No valid trips found for proforma');

            const lot = manager.create(FinancialLot, {
                tenantId,
                clientId,
                status: 'PROFORMADO',
                // TOTAL NETO: Solo revenueAtExecution (lo pactado con dador). Jamás usar fallback a CP Fee.
                totalNeto: trips.reduce((sum, t) => sum + Number(t.revenueAtExecution || 0), 0)
            });

            const savedLot = await manager.save(lot);

            // Generar PDF de Proforma
            const client = await manager.findOne(Client, { where: { id: clientId } });
            const tenant = await manager.findOne(Tenant, { where: { id: tenantId } });

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
            if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });

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

    async createPaymentLot(tenantId: string, choferId: string, tripIds: string[], deductions: { monto: number, descripcion: string, tipo: string }[]) {
        return await this.dataSource.transaction(async manager => {
            const trips = await manager.find(CartaPorte, {
                where: { id: In(tripIds), tenantId, choferId, paymentLotId: IsNull() }
            });

            if (trips.length === 0) throw new BadRequestException('No valid trips found for payment');

            const totalBruto = trips.reduce((sum, t) => sum + Number(t.costAtExecution || 0), 0);
            const deduccionesTotal = deductions.reduce((sum, d) => sum + Number(d.monto), 0);

            const lot = manager.create(PaymentLot, {
                tenantId,
                choferId,
                totalBruto,
                deduccionesTotal,
                netoFinal: totalBruto - deduccionesTotal
            });

            const savedLot = await manager.save(lot);

            // Generar Recibo de Chofer
            const driver = await manager.findOne(Driver, { where: { id: choferId } });
            const tenant = await manager.findOne(Tenant, { where: { id: tenantId } });

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
            if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });

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
                const deduction = manager.create(LotDeduction, {
                    paymentLotId: savedLot.id,
                    ...d
                });
                await manager.save(deduction);
            }

            return savedLot;
        });
    }

    async handleTripCancellation(tripId: string) {
        return await this.dataSource.transaction(async manager => {
            const trip = await manager.findOne(CartaPorte, { where: { id: tripId } });
            if (!trip) throw new BadRequestException('Trip not found');

            if (trip.estado !== 'ANULADO') {
                trip.estado = 'ANULADO';
                await manager.save(trip);
            }

            const credit = manager.create(AdtCredit, {
                clientId: trip.clientId,
                tripIdOriginal: trip.id,
                montoNominalOriginal: Number(trip.montoAbonadoOriginal || 0),
                status: 'DISPONIBLE'
            });

            return await manager.save(credit);
        });
    }

    async conciliateFinancialLot(lotId: string) {
        const lot = await this.financialLotRepo.findOne({ where: { id: lotId } });
        if (!lot) throw new BadRequestException('Financial lot not found');
        lot.status = 'CONCILIADO';
        return await this.financialLotRepo.save(lot);
    }

    async calculateUpcharge(clientId: string, currentPrice: number) {
        const activeCredit = await this.adtCreditRepo.findOne({
            where: { clientId, status: 'DISPONIBLE' },
            order: { createdAt: 'ASC' }
        });

        if (!activeCredit) return 0;

        const differential = currentPrice - Number(activeCredit.montoNominalOriginal);
        return differential > 0 ? differential : 0;
    }

    async getDashboardKPIs(tenantId: string, startDate?: Date, endDate?: Date) {
        try {
            console.log(`[FINANCE DEBUG] getDashboardKPIs started for tenantId: ${tenantId}, range: ${startDate?.toISOString()} - ${endDate?.toISOString()}`);

            // Implementation for master formula: Net Profit = Σ(Revenue) - [Σ(Cost) + Σ(Fees) + Σ(Upcharges)]
            const trips = await this.tripsRepo.find({
                where: { tenantId }
            });

            const filtered = trips.filter(t => {
                if (!startDate || !endDate) return true;
                const d = new Date(t.tsCreacion);
                return d >= startDate && d <= endDate;
            });

            const newTrips = filtered.filter(t => !t.esCredito);
            const creditTrips = filtered.filter(t => t.esCredito);

            const revenue = filtered.reduce((s, t) => s + Number(t.precioDadorSnap || t.revenueAtExecution || 0), 0);
            const costs = filtered.reduce((s, t) => s + Number(t.costAtExecution || 0), 0);
            const upcharges = filtered.reduce((s, t) => s + Number(t.deudaUpcharge || t.montoUpcharge || 0), 0);

            // Fee ADT: Platform fee per CP processed. 
            // We use precioCongelado from trips as the accrued platform cost.
            const fees = filtered.reduce((s, t) => s + Number(t.precioCongelado || 0), 0);

            const netProfit = revenue - (costs + fees + upcharges);

            // Group by client
            const clients = await this.clientRepo.find({ where: { tenantId } });
            const byClient: any = {};
            for (const c of clients) {
                const clientTrips = filtered.filter(t => t.clientId === c.id);
                if (clientTrips.length === 0) continue;

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
        } catch (error) {
            console.error('[FINANCE SERVICE] Error critico en getDashboardKPIs:', error);
            // Devolvemos un objeto seguro con ceros para evitar el crash del frontend por 500
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
}
