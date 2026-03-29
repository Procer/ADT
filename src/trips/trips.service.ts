import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan, Like } from 'typeorm';
import { CreateTripDto } from './dto/create-trip.dto';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { Client } from '../database/entities/client.entity';
import { Driver } from '../database/entities/driver.entity';
import { TransportUnit } from '../database/entities/transport-unit.entity';
import { GpsTracking } from '../database/entities/gps-tracking.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { UpdateTripStatusDto, TripStatus } from './dto/update-trip-status.dto';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantPricing } from '../database/entities/tenant-pricing.entity';
import { WalletBalance } from '../database/entities/wallet-balance.entity';
import { User, UserRole } from '../database/entities/user.entity';
import { TravelCredit } from '../database/entities/travel-credit.entity';
import { NotificationsService } from '../management/notifications.service';
import { TelegramService } from '../management/telegram.service';
import { PricingEngineService } from '../management/pricing-engine.service';
import { PricingRule } from '../database/entities/pricing-rule.entity';

@Injectable()
export class TripsService {
    constructor(
        @InjectRepository(CartaPorte) private tripsRepo: Repository<CartaPorte>,
        @InjectRepository(Client) private clientRepo: Repository<Client>,
        @InjectRepository(Driver) private driverRepo: Repository<Driver>,
        @InjectRepository(TransportUnit) private unitRepo: Repository<TransportUnit>,
        @InjectRepository(GpsTracking) private gpsRepo: Repository<GpsTracking>,
        @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        @InjectRepository(WalletBalance) private walletRepo: Repository<WalletBalance>,
        private dataSource: DataSource,
        private notificationsService: NotificationsService,
        private telegramService: TelegramService,
        private pricingEngine: PricingEngineService,
    ) { }

    async create(createTripDto: CreateTripDto): Promise<CartaPorte> {
        const { tenantId, choferId, unidadId, destinoLat, destinoLng, origenLat, origenLng, origenNombre, destinoNombre, urlFotoRemito, clientId } = createTripDto;

        return this.dataSource.transaction(async manager => {
            const tenant = await manager.findOne(Tenant, { where: { id: tenantId } });
            if (!tenant) throw new NotFoundException('Empresa Logística (Tenant) no encontrada');

            const driver = await manager.findOne(Driver, { where: { id: choferId, tenantId } });
            if (!driver) throw new NotFoundException('Chofer no encontrado');

            const unit = await manager.findOne(TransportUnit, { where: { id: unidadId, tenantId } });
            if (!unit) throw new NotFoundException('Unidad de transporte no encontrada');

            const client = await manager.findOne(Client, { where: { id: clientId } });
            if (!client) throw new NotFoundException('Dador de Carga (Cliente) no encontrado');

            // Billetera Segmentada: Buscar crédito para este dador de carga específico
            let wallet = await manager.findOne(WalletBalance, { where: { tenantId, clientId } });
            if (!wallet) {
                wallet = manager.create(WalletBalance, { tenantId, clientId, saldoCreditos: 0 });
                await manager.save(wallet);
            }

            let esCredito = false;
            let montoUpcharge = 0;
            let montoAbonadoOriginal = 0;

            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const numeroCP = `ADT-${randomSuffix}`;

            // --- 0. CALCULAR DISTANCIA (Fallback si no viene en el DTO) ---
            let effectiveDistance = createTripDto.distanciaKm;
            if (!effectiveDistance && createTripDto.origenLat && createTripDto.origenLng && createTripDto.destinoLat && createTripDto.destinoLng) {
                const distMts = await this.getDistance(
                    createTripDto.origenLat, createTripDto.origenLng,
                    createTripDto.destinoLat, createTripDto.destinoLng
                );
                effectiveDistance = distMts / 1000;
            }

            // --- 1. Calcular Ingreso (Revenue) - Siempre para el Dador ---
            const { price: revenue, ruleInfo: ruleDador } = await this.pricingEngine.calculatePrice({
                tenantId,
                entityId: clientId as string,
                entityType: 'DADOR',
                tripDate: new Date(),
                distanceKm: effectiveDistance,
                tonnage: createTripDto.pesoToneladas
            });

            // --- 2. Calcular Costo (Pago Chofer) - Para el Chofer asignado ---
            const { price: cost } = await this.pricingEngine.calculatePrice({
                tenantId,
                entityId: choferId as string,
                entityType: 'CHOFER',
                tripDate: new Date(),
                distanceKm: effectiveDistance,
                tonnage: createTripDto.pesoToneladas
            });

            // --- 3. Lógica de Cobro / Deuda / Créditos ---
            const tenantPricing = await manager.findOne(TenantPricing, {
                where: { tenantId },
                order: { fechaDesde: 'DESC' }
            });
            const adtFee = Number(tenantPricing?.precioCp || 1500);

            // Cálculo de ingreso para el dador (independiente de la deuda ADT)
            // REGLA: Si no hay tarifa pactada (motor o fija), el revenue es 0. 
            // NO debe caer en el fallback del Fee ADT (precio_congelado).
            const revenueFinal = revenue > 0 ? revenue : (client.precioPorCp > 0 ? Number(client.precioPorCp) : 0);
            const finalRuleInfo = revenue > 0 ? ruleDador : (client.precioPorCp > 0 ? 'Tarifa Fija Manual' : 'Sin Tarifa');

            if (wallet.saldoCreditos > 0) {
                // REGLA ADT: USO OBLIGATORIO DE CRÉDITO
                const travelCredit = await manager.findOne(TravelCredit, {
                    where: { tenantId, clientId, usado: false },
                    order: { createdAt: 'ASC' }
                });

                esCredito = true;
                wallet.saldoCreditos -= 1;
                await manager.save(wallet);

                if (travelCredit) {
                    travelCredit.usado = true;
                    await manager.save(travelCredit);

                    // Lógica de Diferencial (Anti-Inflación) - SOLO sobre el costo de la CP ADT
                    montoAbonadoOriginal = Number(travelCredit.precioPagadoNominal);
                    if (adtFee > montoAbonadoOriginal) {
                        montoUpcharge = adtFee - montoAbonadoOriginal;
                        tenant.deudaActual = Number(tenant.deudaActual || 0) + montoUpcharge;
                        await manager.save(tenant);
                    }
                } else {
                    montoAbonadoOriginal = adtFee;
                }
            } else {
                // NO HAY CRÉDITO: Generar cargo financiero completo (por el valor de la CP ADT)
                const nuevaDeuda = Number(tenant.deudaActual || 0) + adtFee;
                const limite = Number(tenant.limiteCreditoGlobal);

                if (limite > 0 && nuevaDeuda > limite) {
                    throw new BadRequestException('Límite de crédito global del Tenant superado.');
                }
                tenant.deudaActual = nuevaDeuda;
                await manager.save(tenant);
                montoAbonadoOriginal = adtFee;
            }

            const trip = manager.create(CartaPorte, {
                tenantId,
                choferId,
                unidadId,
                clientId,
                numeroCP,
                estado: TripStatus.PENDING,
                origenNombre,
                origenLat,
                origenLng,
                destinoNombre,
                destinoLat,
                destinoLng,
                mercaderiaTipo: createTripDto.mercaderiaTipo,
                pesoToneladas: Number(createTripDto.pesoToneladas || 0),
                precioCongelado: adtFee, // Refleja el costo de la CP para el tenant
                revenueAtExecution: revenueFinal, // Refleja lo que el dador debe pagar al tenant
                costAtExecution: cost,
                appliedRuleInfo: finalRuleInfo,
                distanciaTotalRecorridaKm: Number(effectiveDistance || 0),
                montoAbonadoOriginal,
                montoUpcharge,
                urlFotoRemito,
                radioGeocercaKm: 1,
                esCredito,
                cierreMotivo: createTripDto.adminNameBypass || 'Administrador'
            });

            const savedTrip = await manager.save(trip);

            // --- NOTIFICACIÓN TELEGRAM ---
            if (driver.telegramChatId && clientId) {
                const msg = `📦 *NUEVO VIAJE ASIGNADO*\n` +
                    `CP: ${numeroCP}\n` +
                    `Origen: ${origenNombre || 'No especificado'}\n` +
                    `Destino: ${destinoNombre || 'No especificado'}\n` +
                    `Cliente: ${client.nombreRazonSocial}\n\n` +
                    `¡Mucha suerte en el camino! 🛣️`;

                await this.telegramService.notify(clientId, 'new_trip', driver.telegramChatId, msg);
            }

            await manager.save(AuditLog, {
                accion: 'CREACIÓN DE VIAJE',
                descripcion: `Viaje ${numeroCP} creado por ${createTripDto.adminNameBypass || 'Administrador'}`,
                dataNueva: JSON.stringify(savedTrip),
                tenantId
            });

            return savedTrip;
        });
    }

    async startTrip(tripId: string, lat?: number, lng?: number): Promise<CartaPorte> {
        return this.dataSource.transaction(async manager => {
            const trip = await manager.findOne(CartaPorte, { where: { id: tripId }, relations: ['chofer', 'unidad', 'client'] });
            if (!trip) throw new NotFoundException('Viaje no encontrado');
            if (trip.estado !== TripStatus.PENDING) throw new BadRequestException('Solo PENDING puede iniciar.');

            const tenant = await manager.findOne(Tenant, { where: { id: trip.tenantId } });
            if (!tenant) throw new NotFoundException('Empresa Logística (Tenant) no encontrada');

            // Credit Limit Lock: Impedir salida a IN_PROGRESS si superó el límite de deuda
            const limite = Number(tenant.limiteCreditoGlobal);
            if (limite > 0 && Number(tenant.deudaActual) >= limite) {
                throw new BadRequestException('Bloqueo de Salida: El Tenant ha alcanzado su límite de crédito global.');
            }

            const activeTrip = await manager.findOne(CartaPorte, {
                where: [
                    { unidadId: trip.unidadId, estado: TripStatus.IN_PROGRESS },
                    { choferId: trip.choferId, estado: TripStatus.IN_PROGRESS }
                ]
            });

            if (activeTrip) {
                throw new BadRequestException(`No se puede iniciar: El chofer o la unidad ya poseen el viaje ${activeTrip.numeroCP} en curso.`);
            }

            // Marcar origen real al momento de iniciar si vienen coordenadas
            if (lat && lng) {
                trip.origenLat = lat;
                trip.origenLng = lng;
                // Si no tiene nombre de origen, le ponemos uno genérico de inicio
                if (!trip.origenNombre) trip.origenNombre = `Inicio en: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }

            trip.estado = TripStatus.IN_PROGRESS;
            trip.tsInicioReal = new Date();
            const saved = await manager.save(trip);

            // Disparar Alerta
            await this.notificationsService.notifyTripStatusChange(saved, tenant);
            return saved;
        });
    }

    async closeTrip(tripId: string, motivo: string, manager?: any): Promise<CartaPorte> {
        const repo = manager ? manager.getRepository(CartaPorte) : this.tripsRepo;
        const trip = await repo.findOne({ where: { id: tripId }, relations: ['client', 'unidad'] });
        if (!trip) throw new NotFoundException('Viaje no encontrado');

        trip.estado = TripStatus.FINALIZED;
        trip.tsFinalizacionReal = new Date();
        trip.tsCierre = trip.tsFinalizacionReal;
        trip.cierreMotivo = motivo;

        const saved = await repo.save(trip);

        // Disparar Alerta
        const tenant = await (manager ? manager.findOne(Tenant, { where: { id: trip.tenantId } }) : this.tenantRepo.findOne({ where: { id: trip.tenantId } }));
        if (tenant) await this.notificationsService.notifyTripStatusChange(saved, tenant);

        return saved;
    }

    async cancelTrip(tripId: string, motivo: string = 'Cancelación Administrativa'): Promise<CartaPorte> {
        return this.dataSource.transaction(async manager => {
            const trip = await manager.findOne(CartaPorte, { where: { id: tripId }, relations: ['client', 'unidad'] });
            if (!trip) throw new NotFoundException('Viaje no encontrado');

            const tenant = await manager.findOne(Tenant, { where: { id: trip.tenantId } });
            if (!tenant) throw new NotFoundException('Tenant no encontrado');

            // --- REGLA DE NEGOCIO ADT: LA DEUDA NO SE REVIERTE ---
            // Se genera un crédito disponible para el dador de carga por el valor que ya se devengó

            let wallet = await manager.findOne(WalletBalance, { where: { tenantId: trip.tenantId, clientId: trip.clientId } });
            if (!wallet) {
                wallet = manager.create(WalletBalance, { tenantId: trip.tenantId, clientId: trip.clientId, saldoCreditos: 0 });
            }
            wallet.saldoCreditos = Number(wallet.saldoCreditos) + 1;
            await manager.save(wallet);

            // Guardamos el registro físico del Vale con el precio original para calcular diferenciales después
            const valorNominal = Number(trip.montoAbonadoOriginal || 0);

            const travelCredit = manager.create(TravelCredit, {
                tenantId: trip.tenantId,
                clientId: trip.clientId,
                precioPagadoNominal: valorNominal,
                usado: false,
                metadata: JSON.stringify({ originTripId: trip.id, reason: motivo })
            });
            await manager.save(travelCredit);

            // Marcamos el viaje como anulado pero NO tocamos tenant.deudaActual
            trip.estado = TripStatus.VOID_CREDIT;
            trip.cierreMotivo = `CANCELADO: ${motivo}`;
            trip.tsCierre = new Date();
            const saved = await manager.save(trip);

            if (tenant) await this.notificationsService.notifyTripStatusChange(saved, tenant);

            return saved;
        });
    }

    async updateStatus(tripId: string, dto: UpdateTripStatusDto, userRole?: string): Promise<CartaPorte> {
        const { estado, lat, lng, fuera_de_rango, tipo_registro, evento_manual } = dto;

        const trip = await this.tripsRepo.findOne({ where: { id: tripId }, relations: ['chofer', 'unidad'] });
        if (!trip) throw new NotFoundException('Viaje no encontrado');

        // El Candado del "Ticket Único": Una vez que el estado cambia a FINALIZED, el registro es inalterable.
        if (trip.estado === TripStatus.FINALIZED && userRole !== 'SUPER_ADMIN') {
            throw new BadRequestException('El viaje ya está FINALIZED y es inalterable.');
        }

        let result: CartaPorte;
        if (estado === TripStatus.IN_PROGRESS) {
            result = await this.startTrip(tripId, lat, lng);
        } else if (estado === TripStatus.FINALIZED) {
            result = await this.closeTrip(tripId, 'MANUAL');
        } else if (estado === TripStatus.VOID_CREDIT) {
            result = await this.cancelTrip(tripId, dto.comentario || 'Cancelación Manual');
        } else {
            // Bypass hardlock for intermediate operational statuses (LLEGUE, CARGA_DESCARGA)
            if (estado !== TripStatus.LLEGUE && estado !== TripStatus.CARGA_DESCARGA) {
                this.checkHardLock(trip, userRole);
            }
            trip.estado = estado;
            result = await this.tripsRepo.save(trip);
        }

        // --- LÓGICA DE ALERTA POR GEOCERCA ---
        if (fuera_de_rango) {
            const tenant = await this.tenantRepo.findOne({ where: { id: trip.tenantId } });
            if (tenant) {
                const config = typeof tenant.config === 'string' ? JSON.parse(tenant.config) : tenant.config;
                const thresholdMts = config?.geocerca_mts || 3000;
                const thresholdKm = (thresholdMts / 1000).toFixed(1);

                await this.notificationsService.createAlert({
                    tenantId: trip.tenantId,
                    tripId: trip.id,
                    tipo: 'GEOCERCA_VIOLADA',
                    prioridad: 'ALTA',
                    mensaje: `ALERTA: El chofer ${trip.chofer?.nombre || 'desconocido'} marcó "${estado}" estando FUERA DE RANGO (>${thresholdKm}km) del destino.`,
                    metadata: JSON.stringify({ coords: { lat, lng }, estado })
                });
            }
        }

        const actor = userRole === 'TENANT_ADMIN' || userRole === 'SUPER_ADMIN' ? 'El administrador' : 'El chofer';
        const accionTipo = userRole === 'TENANT_ADMIN' || userRole === 'SUPER_ADMIN' ? 'CAMBIO_ESTADO_ADMIN' : 'CAMBIO_ESTADO_CHOFER';

        // Registrar hito con coordenadas si vienen en el DTO (vienen de la PWA del chofer)
        const esAuto = tipo_registro === 'AUTOMATICO';
        await this.auditRepo.save({
            accion: esAuto ? 'AUTO_LLEGADA' : accionTipo,
            descripcion: esAuto ? `Sistema detectó llegada automática (${estado})` : `${actor} cambió el estado a ${estado}`,
            dataNueva: JSON.stringify({
                tripId,
                estado,
                coords: lat && lng ? { lat, lng } : null,
                evento_manual: evento_manual || estado
            }),
            tenantId: trip.tenantId
        });

        return result;
    }

    async calculateSmartEta(tripId: string): Promise<{ etaMinutes: number; speedKmh: number }> {
        const trip = await this.tripsRepo.findOne({ where: { id: tripId } });
        if (!trip || !trip.destinoLat) return { etaMinutes: -1, speedKmh: 0 };

        // Buscamos pings de las últimas 12 horas para asegurar que siempre haya algún dato
        const recentTime = new Date(Date.now() - 12 * 60 * 60 * 1000);
        const pings = await this.gpsRepo.find({
            where: { cpId: tripId, timestampDispositivo: MoreThan(recentTime) },
            order: { timestampDispositivo: 'DESC' }
        });

        if (pings.length === 0) return { etaMinutes: -1, speedKmh: 0 };

        const lastPing = pings[0];
        const distance = await this.getDistance(
            Number(lastPing.latitud), Number(lastPing.longitud),
            Number(trip.destinoLat), Number(trip.destinoLng)
        );

        // Lógica de Velocidad Adaptativa: Si está quieto o muy lento, proyectamos a 40km/h
        let speed = Number(lastPing.velocidad) || 0;
        if (speed < 10) speed = 40;

        const etaHours = (distance / 1000) / speed;
        // Margen de seguridad del 15% para contemplar semáforos o tráfico leve
        return { etaMinutes: Math.round(etaHours * 60 * 1.15), speedKmh: Math.round(speed) };
    }

    async getBillingReport(tenantId: string, month?: number, year?: number): Promise<any> {
        const targetMonth = month ? Number(month) : new Date().getMonth() + 1;
        const targetYear = year ? Number(year) : new Date().getFullYear();

        if (isNaN(targetMonth) || isNaN(targetYear)) {
            throw new BadRequestException('Mes o Año inválidos');
        }

        const startDate = new Date(targetYear, targetMonth - 1, 1);

        // 1. Obtener Viajes (Consumos)
        const trips = await this.tripsRepo.find({
            where: { tenantId, tsCreacion: MoreThan(startDate) },
            relations: ['unidad', 'chofer', 'client']
        });

        // 2. Obtener Recargas (Compras de saldo)
        const recharges = await this.dataSource.getRepository(TravelCredit).find({
            where: { tenantId, createdAt: MoreThan(startDate) },
            relations: ['tenant']
        });

        // 3. Mapear Viajes (Consumos o Cargos)
        const tripLogs = trips.filter(t => {
            const d = new Date(t.tsCreacion);
            return (d.getMonth() + 1) === targetMonth && d.getFullYear() === targetYear;
        }).map(t => {
            const isVoid = t.estado === TripStatus.VOID_CREDIT;
            let concepto = '';
            let descripcion = '';

            if (isVoid) {
                concepto = t.esCredito ? 'CRÉDITO DEVUELTO' : 'CARGO ANULADO';
                descripcion = t.esCredito
                    ? `Anulado - Crédito devuelto a ${t.client?.nombreRazonSocial || 'dador'}`
                    : `Anulado - Cargo financiero cancelado para ${t.client?.nombreRazonSocial || 'dador'}`;
            } else {
                concepto = t.esCredito ? 'CONSUMO CRÉDITO' : 'CARGO DIRECTO';
                if (t.esCredito) {
                    const upcharge = Number(t.montoUpcharge || 0);
                    descripcion = upcharge > 0
                        ? `Consumió 1 crédito de ${t.client?.nombreRazonSocial}. Diferencial por aumento de tarifa: $${upcharge}`
                        : `Consumió 1 crédito de ${t.client?.nombreRazonSocial}`;
                } else {
                    descripcion = `Generó cargo financiero para ${t.client?.nombreRazonSocial}`;
                }
            }

            return {
                id: t.id,
                numeroCP: t.numeroCP || 'S/N',
                concepto,
                referencia: t.numeroCP || 'S/N',
                fecha: t.tsCreacion,
                unidad: t.unidad?.patente || 'N/A',
                chofer: t.chofer?.nombre || 'N/A',
                dadorCarga: t.client?.nombreRazonSocial || 'Dador Desconocido',
                dadorCargaId: t.clientId || null,
                costo: t.esCredito ? Number(t.montoUpcharge || 0) : Number(t.precioCongelado || 0),
                montoUpcharge: Number(t.montoUpcharge || 0),
                tipo: concepto,
                estado: t.estado || 'PENDIENTE',
                usuario: t.cierreMotivo || 'Administrador',
                descripcion
            };
        });

        // 4. Mapear Recargas (Ingresos de saldo)
        // Crear un mapa de IDs de cliente a Nombres para que el reporte sea legible
        const clientNamesMap = new Map();
        trips.forEach(t => {
            if (t.clientId && t.client?.nombreRazonSocial) {
                clientNamesMap.set(t.clientId, t.client.nombreRazonSocial);
            }
        });

        const rechargeLogs = recharges.filter(r => {
            const d = new Date(r.createdAt);
            return (d.getMonth() + 1) === targetMonth && d.getFullYear() === targetYear;
        }).map(r => {
            const clientName = clientNamesMap.get(r.clientId) || 'Dador de Carga';
            return {
                id: r.id,
                numeroCP: 'REC-SALDO',
                concepto: 'RECARGA',
                referencia: 'REC-SALDO',
                fecha: r.createdAt,
                unidad: '-',
                chofer: '-',
                dadorCarga: clientName,
                dadorCargaId: r.clientId,
                costo: 0,
                montoUpcharge: 0,
                tipo: 'RECARGA',
                estado: 'COMPLETADO',
                descripcion: `Generación de crédito disponible para ${clientName}`
            };
        });

        const combinedLogs = [...tripLogs, ...rechargeLogs].sort((a, b) =>
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );

        return {
            detalles: combinedLogs,
            resumenGeneral: {
                totalViajes: tripLogs.length,
                totalRecargas: rechargeLogs.length,
                totalFacturar: tripLogs.reduce((s, i) => s + i.costo, 0)
            }
        };
    }

    async generateMonthlyReportBuffer(tenantId: string, month: number, year: number, format: 'excel' | 'pdf'): Promise<any> {
        const report = await this.getBillingReport(tenantId, month, year);
        return { buffer: Buffer.from(JSON.stringify(report)), filename: 'reporte.json', mimeType: 'application/json' };
    }

    async sendSettlementSummary(tenantId: string, month: number, year: number, chatId: string) {
        const report = await this.getBillingReport(tenantId, month, year);
        const { resumenGeneral } = report;

        const totalFacturar = Number(resumenGeneral?.totalFacturar || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });

        const msg = `📊 *RESUMEN DE LIQUIDACIÓN*\n` +
            `Periodo: ${month}/${year}\n` +
            `--------------------------\n` +
            `✅ Total Viajes: ${resumenGeneral.totalViajes}\n` +
            `📥 Total Recargas: ${resumenGeneral.totalRecargas}\n` +
            `💰 *Total a Facturar: $${totalFacturar}*\n\n` +
            `_Este es un resumen automático enviado vía ADT Telegram._`;

        // Aquí usamos una clientId genérica o buscamos la del primer cliente si aplica, 
        // pero como es para el ADMIN del Tenant, verificamos una configuración global.
        await this.telegramService.sendMessage(chatId, msg);
    }

    async importBulkFromExcel(tenantId: string, buffer: Buffer): Promise<any> {
        return { success: 0, errors: ['Método no implementado tras refactorización'] };
    }

    async update(id: string, dto: any, role: string): Promise<any> {
        const trip = await this.tripsRepo.findOne({ where: { id } });
        if (!trip) throw new NotFoundException();

        // Operational Hard-Lock: Campos inmutables absolutos
        if (trip.estado !== TripStatus.PENDING) {
            const forbiddenFields = ['clientId', 'tenantId', 'origenNombre'];
            for (const field of forbiddenFields) {
                if (dto[field] !== undefined && dto[field] !== trip[field]) {
                    throw new BadRequestException(`HARD-LOCK: El campo ${field} es inmutable una vez que el viaje ha salido de PENDING.`);
                }
            }
        }

        // El destinoNombre, destinoLat y destinoLng ahora se permiten editar 
        // SIEMPRE QUE pase el checkHardLock (60 minutos)
        this.checkHardLock(trip, role);
        Object.assign(trip, dto);
        return this.tripsRepo.save(trip);
    }

    async remove(id: string, role: string): Promise<void> {
        if (role !== 'SUPER_ADMIN') throw new BadRequestException('Solo Super Admin');
        await this.tripsRepo.delete(id);
    }

    async getHistory(id: string): Promise<any> {
        const trip = await this.tripsRepo.findOne({ where: { id } });
        if (!trip) throw new NotFoundException('Viaje no encontrado');

        const pings = await this.gpsRepo.find({
            where: { cpId: id },
            order: { timestampDispositivo: 'ASC' }
        });

        const audits = await this.auditRepo.find({
            where: { dataNueva: Like(`%${id}%`) },
            order: { fecha: 'ASC' }
        });

        // Reconstrucción inteligente de la línea de tiempo
        const timeline: any[] = [];

        // 1. Agregar Pings de GPS con cálculo de distancia real al destino
        for (const p of pings) {
            let distToDest = 0;
            if (trip.destinoLat && trip.destinoLng) {
                distToDest = await this.getDistance(
                    Number(p.latitud), Number(p.longitud),
                    Number(trip.destinoLat), Number(trip.destinoLng)
                );
            }

            timeline.push({
                tipo: 'AUTO_GPS',
                fecha: p.timestampDispositivo,
                coords: { coordinates: [Number(p.longitud), Number(p.latitud)] },
                distancia: distToDest,
                fueraDeRango: distToDest > (trip.radioGeocercaKm * 1000)
            });
        }

        // 2. Procesar Auditorías
        for (const a of audits) {
            let data: any = {};
            try {
                data = typeof a.dataNueva === 'string' ? JSON.parse(a.dataNueva) : a.dataNueva;
            } catch (e) { data = a.dataNueva; }

            const esCreacion = a.accion.includes('CREACIÓN');
            const esAdmin = a.accion.includes('ADMIN');
            const esAutoLlegada = a.accion === 'AUTO_LLEGADA';

            const hito = {
                tipo: esCreacion ? 'TRIP_CREATED' : (esAdmin ? 'HITO_ADMIN' : (esAutoLlegada ? 'AUTO_LLEGADA' : 'HITO_CHOFER')),
                fecha: a.fecha,
                accion: a.accion,
                descripcion: a.descripcion,
                esManual: !esCreacion,
                coords: data?.coords ? { coordinates: [data.coords.lng, data.coords.lat] } : null,
                distanciaGps: 0,
                alertaGps: false
            };

            // Si es un hito manual con coordenadas, calcular diferencia con el GPS más cercano
            if (hito.esManual && hito.coords && pings.length > 0) {
                const hitoTime = new Date(hito.fecha).getTime();
                const closestPing = pings.reduce((prev, curr) => {
                    const prevDiff = Math.abs(new Date(prev.timestampDispositivo).getTime() - hitoTime);
                    const currDiff = Math.abs(new Date(curr.timestampDispositivo).getTime() - hitoTime);
                    return currDiff < prevDiff ? curr : prev;
                }, pings[0]);

                if (closestPing) {
                    const dist = await this.getDistance(
                        hito.coords.coordinates[1], hito.coords.coordinates[0],
                        Number(closestPing.latitud), Number(closestPing.longitud)
                    );
                    hito.distanciaGps = dist;
                    if (dist > 500) hito.alertaGps = true;
                }
            }

            timeline.push(hito);
        }

        // Ordenar cronológicamente descendente para el visor
        timeline.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        return { timeline };
    }

    async calculateStats(tenantId: string, filters: { choferId?: string, clientId?: string, period?: string }) {
        const query = this.tripsRepo.createQueryBuilder('t')
            .leftJoinAndSelect('t.client', 'c')
            .leftJoinAndSelect('t.chofer', 'd');

        // Si hay tenantId lo filtramos, si no (Super Admin) traemos todo
        if (tenantId && tenantId !== 'null' && tenantId !== 'undefined' && tenantId !== '') {
            query.where('t.tenantId = :tenantId', { tenantId });
        }

        if (filters.choferId) query.andWhere('t.choferId = :choferId', { choferId: filters.choferId });
        if (filters.clientId) query.andWhere('t.clientId = :clientId', { clientId: filters.clientId });

        const now = new Date();
        if (filters.period === 'DAY') {
            const start = new Date(now.setHours(0, 0, 0, 0));
            query.andWhere('t.tsCreacion >= :start', { start });
        } else if (filters.period === 'WEEK') {
            const start = new Date(now.setDate(now.getDate() - 7));
            query.andWhere('t.tsCreacion >= :start', { start });
        } else if (filters.period === 'MONTH') {
            const start = new Date(now.setDate(now.getDate() - 30));
            query.andWhere('t.tsCreacion >= :start', { start });
        }

        const trips = await query.getMany();

        // Conversión manual ultra-segura para MSSQL
        let totalWeight = 0;
        let totalKm = 0;
        let totalMoney = 0;

        trips.forEach(t => {
            totalWeight += parseFloat(String(t.pesoToneladas || 0));
            totalKm += parseFloat(String(t.distanciaTotalRecorridaKm || 0));

            if (filters.choferId) {
                totalMoney += parseFloat(String(t.costAtExecution || 0));
            } else {
                // Para el dador solo sumamos recaudación pactada real
                totalMoney += parseFloat(String(t.revenueAtExecution || 0));
            }
        });

        const newTripsCount = trips.filter(t => !t.esCredito).length;
        const creditTripsCount = trips.filter(t => t.esCredito).length;

        return {
            count: trips.length,
            newTripsCount,
            creditTripsCount,
            totalWeight,
            totalKm,
            totalMoney,
            trips: trips.map(t => ({
                id: t.id,
                numeroCP: t.numeroCP,
                fecha: t.tsCreacion,
                cliente: t.client?.nombreRazonSocial,
                chofer: t.chofer?.nombre,
                monto: filters.choferId ? t.costAtExecution : (t.revenueAtExecution || 0),
                km: t.distanciaTotalRecorridaKm,
                peso: Number(t.pesoToneladas || 0),
                esCredito: t.esCredito,
                estado: t.estado
            }))
        };
    }

    async findAllActive(): Promise<any[]> {
        const trips = await this.tripsRepo.find({ where: { estado: TripStatus.IN_PROGRESS }, relations: ['chofer', 'unidad'] });
        return trips.map(t => ({ ...t, pesoToneladas: Number(t.pesoToneladas || 0) }));
    }

    async findAll(tenantId: string, filters?: any): Promise<CartaPorte[]> {
        const query: any = { tenantId };
        if (filters?.choferId) query.choferId = filters.choferId;
        if (filters?.clientId) query.clientId = filters.clientId;
        if (filters?.estado) query.estado = filters.estado;
        if (filters?.cp) query.numeroCP = Like(`%${filters.cp}%`);

        const trips = await this.tripsRepo.find({
            where: query,
            relations: ['chofer', 'unidad', 'client'],
            order: { tsCreacion: 'DESC' }
        });
        return trips.map(t => ({ ...t, pesoToneladas: Number(t.pesoToneladas || 0) })) as any;
    }

    async deletePricingRule(id: string, role: string) {
        if (role !== 'SUPER_ADMIN') throw new BadRequestException('No autorizado');
        await this.dataSource.getRepository(PricingRule).delete(id);
        return { success: true };
    }

    async findActiveByDriver(driverId: string): Promise<any | null> {
        // Buscar todos los viajes activos y pendientes
        const allTrips = await this.tripsRepo.find({
            where: [
                { choferId: driverId, estado: TripStatus.IN_PROGRESS },
                { choferId: driverId, estado: TripStatus.PENDING }
            ],
            relations: ['chofer', 'unidad', 'client'],
            order: { estado: 'DESC', tsCreacion: 'ASC' }
        });

        if (allTrips.length === 0) return null;

        // El primero es el "activo" (si hay uno IN_PROGRESS estará primero por el orden DESC de estado)
        const activeTrip = allTrips[0];

        // El resto son informativos (la cola)
        const queue = allTrips.slice(1).map(t => ({
            id: t.id,
            numeroCP: t.numeroCP,
            origenNombre: t.origenNombre,
            destinoNombre: t.destinoNombre,
            clientNombre: t.client?.nombreRazonSocial,
            estado: t.estado
        }));

        return {
            ...activeTrip,
            cola: queue
        };
    }

    async getDriverQueue(driverId: string): Promise<CartaPorte[]> {
        return this.tripsRepo.find({
            where: [
                { choferId: driverId, estado: TripStatus.IN_PROGRESS },
                { choferId: driverId, estado: TripStatus.PENDING }
            ],
            relations: ['chofer', 'unidad', 'client'],
            order: { estado: 'DESC', tsCreacion: 'ASC' } // IN_PROGRESS (I) antes que PENDING (P) alfabéticamente invertido o por lógica de negocio
        });
    }

    async getDistance(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> {
        const result = await this.tripsRepo.query(
            `SELECT geography::Point(@0, @1, 4326).STDistance(geography::Point(@2, @3, 4326)) as distance`,
            [lat1, lng1, lat2, lng2]
        );
        return result[0]?.distance || 0;
    }

    async getTenant(id: string): Promise<Tenant | null> {
        return this.tenantRepo.findOne({ where: { id } });
    }

    async getTenantAdmin(tenantId: string): Promise<User | null> {
        return this.dataSource.getRepository(User).findOne({
            where: { tenantId, role: UserRole.TENANT_ADMIN }
        });
    }

    async createAuditLog(data: { tenantId: string, accion: string, descripcion: string, dataNueva?: string }) {
        const log = this.auditRepo.create(data);
        return this.auditRepo.save(log);
    }

    private checkHardLock(trip: CartaPorte, userRole?: string) {
        if (userRole === 'SUPER_ADMIN') return;
        const diff = (Date.now() - new Date(trip.tsCreacion).getTime()) / 1000 / 60;
        if (diff > 60) throw new BadRequestException('HARD LOCK: > 60 min');
    }
}
