import { Controller, Get, Post, Query, Body, Param, Res, Delete, BadRequestException, NotFoundException, Patch, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TripsService } from '../trips/trips.service';
import { TripStatus } from '../trips/dto/update-trip-status.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { GpsTracking } from '../database/entities/gps-tracking.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { TransportUnit } from '../database/entities/transport-unit.entity';
import { Driver } from '../database/entities/driver.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantPricing } from '../database/entities/tenant-pricing.entity';
import { TravelCredit } from '../database/entities/travel-credit.entity';
import { User, UserRole } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';
import { ClientAuthorizedEmail } from '../database/entities/client-authorized-email.entity';
import { WalletBalance } from '../database/entities/wallet-balance.entity';
import { TenantPayment } from '../database/entities/tenant-payment.entity';
import { TelegramService } from './telegram.service';
import { EmailIngestionService } from './email-ingestion.service';
import { SettlementBatch } from '../database/entities/settlement-batch.entity';
import { PaymentLot } from '../database/entities/payment-lot.entity';
import { PricingRule } from '../database/entities/pricing-rule.entity';
import { FinancialLot } from '../database/entities/financial-lot.entity';
import { PricingEngineService } from './pricing-engine.service';
import { FinancialReportingService } from './financial-reporting.service';
import { AiExtractorService } from './ai-extractor.service';
import { AdtCredit } from '../database/entities/adt-credit.entity';
import { AdtRecaudacion } from '../database/entities/adt-recaudacion.entity';
import { NotificationsService } from './notifications.service';
import { SystemConfig } from '../database/entities/system-config.entity';
import { EmailIngestionLog } from '../database/entities/email-ingestion-log.entity';
import { AppLog } from '../database/entities/app-log.entity';
import { Public } from '../auth/public.decorator';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@UseGuards(JwtAuthGuard)
@Controller('management')
export class ManagementController {
    constructor(
        @InjectRepository(CartaPorte) private tripsRepo: Repository<CartaPorte>,
        @InjectRepository(GpsTracking) private gpsRepo: Repository<GpsTracking>,
        @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
        @InjectRepository(TransportUnit) private unitRepo: Repository<TransportUnit>,
        @InjectRepository(Driver) private driverRepo: Repository<Driver>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        @InjectRepository(TenantPricing) private pricingRepo: Repository<TenantPricing>,
        @InjectRepository(TravelCredit) private creditsRepo: Repository<TravelCredit>,
        @InjectRepository(Client) private clientRepo: Repository<Client>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(TenantPayment) private readonly paymentRepo: Repository<TenantPayment>,
        @InjectRepository(WalletBalance) private readonly walletRepo: Repository<WalletBalance>,
        @InjectRepository(SystemConfig) private readonly systemConfigRepo: Repository<SystemConfig>,
        @InjectRepository(SettlementBatch) private readonly batchRepo: Repository<SettlementBatch>,
        @InjectRepository(PaymentLot) private readonly paymentLotRepo: Repository<PaymentLot>,
        @InjectRepository(AdtCredit) private readonly adtCreditRepo: Repository<AdtCredit>,
        @InjectRepository(AdtRecaudacion) private readonly adtRecaudacionRepo: Repository<AdtRecaudacion>,
        private readonly tripsService: TripsService,
        private readonly pricingEngine: PricingEngineService,
        private readonly reportingService: FinancialReportingService,
        private readonly aiExtractorService: AiExtractorService,
        private readonly notificationsService: NotificationsService,
        private readonly telegramService: TelegramService,
        private readonly emailIngestionService: EmailIngestionService,
        private dataSource: DataSource,
    ) { }

    @Public()
    @Get('trips')
    async findAllTrips(
        @Query('tenantId') tenantId: string,
        @Query('estado') estado?: string,
        @Query('choferId') choferId?: string,
        @Query('clientId') clientId?: string,
    ) {
        return this.tripsService.findAll(tenantId, { estado, choferId, clientId });
    }

    @Public()
    @Post('public/web-contact')
    async publicContact(@Body() body: { nombre: string, email: string, mensaje: string }) {
        const { nombre, email, mensaje } = body;

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #6366f1;">Nueva Consulta desde la Web ANKA</h2>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Remitente:</strong> ${nombre}</p>
                    <p><strong>Email de contacto:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Mensaje:</strong></p>
                    <p style="white-space: pre-wrap; font-style: italic;">${mensaje}</p>
                </div>
                <p style="font-size: 0.8em; color: #999;">Enviado automáticamente desde el sitio oficial anka.ar</p>
            </div>
        `;

        // Enviamos el email a ambos destinatarios
        const sent1 = await this.notificationsService.sendEmail('sistema.anka@gmail.com', `Nueva Consulta Web: ${nombre}`, html);
        const sent2 = await this.notificationsService.sendEmail('derosasjm@gmail.com', `Nueva Consulta Web: ${nombre}`, html);

        if (!sent1 && !sent2) {
            throw new BadRequestException('El servidor no pudo procesar el envío. Verifique la configuración SMTP en el sistema.');
        }

        return { success: true, message: 'Consulta enviada correctamente.' };
    }

    // --- CONFIGURACIÓN GLOBAL ---

    @Public()
    @Get('system-config')
    async getSystemConfig() {
        let config = await this.systemConfigRepo.findOne({ where: { configKey: 'GLOBAL_SETTINGS' } });
        if (!config) {
            config = this.systemConfigRepo.create({
                configKey: 'GLOBAL_SETTINGS',
                smtpConfig: { host: '', port: 587, user: '', pass: '', from: '', secure: false },
                telegramConfig: { botToken: '', globalChatId: '', enabled: false },
                geminiApiKey: ''
            });
            await this.systemConfigRepo.save(config);
        }
        return config;
    }

    @Public()
    @Post('system-config')
    async updateSystemConfig(@Body() body: any) {
        let config = await this.systemConfigRepo.findOne({ where: { configKey: 'GLOBAL_SETTINGS' } });
        if (!config) config = this.systemConfigRepo.create({ configKey: 'GLOBAL_SETTINGS' });
        const oldData = { ...config };
        config.smtpConfig = body.smtpConfig;
        config.telegramConfig = body.telegramConfig;
        config.geminiApiKey = body.geminiApiKey;
        const saved = await this.systemConfigRepo.save(config);
        await this.auditRepo.save({ accion: 'GLOBAL_CONFIG_UPDATE', descripcion: 'Se actualizó la configuración global (SMTP/Telegram)', resueltoPor: 'SuperAdmin', dataAnterior: oldData, dataNueva: saved });
        return saved;
    }

    // --- TENANTS ---

    @Public()
    @Get('tenants')
    async getTenants() {
        const tenants = await this.tenantRepo.createQueryBuilder('tenant').leftJoinAndSelect('tenant.pricings', 'pricing').orderBy('tenant.nombreEmpresa', 'ASC').addOrderBy('pricing.id', 'DESC').getMany();
        return Promise.all(tenants.map(async (tenant) => {
            const admin = await this.userRepo.findOne({ where: { tenantId: tenant.id, role: UserRole.TENANT_ADMIN } });
            return { ...tenant, claveActualizada: admin ? !admin.mustChangePassword : true };
        }));
    }

    @Public()
    @Get('tenants/:id')
    async getTenant(@Param('id') id: string) {
        if (!id || id === 'null') throw new BadRequestException('ID inválido');
        const tenant = await this.tenantRepo.findOne({ where: { id } });
        if (!tenant) throw new NotFoundException('Empresa no encontrada');
        return tenant;
    }

    @Public()
    @Post('tenants')
    async createTenant(@Body() body: any) {
        return await this.dataSource.transaction(async manager => {
            const tenant = manager.create(Tenant, {
                nombreEmpresa: body.nombreEmpresa,
                logoUrl: body.logoUrl,
                telegramChatId: body.telegramChatId,
                config: body.config || { radio_geocerca: 500, moneda: 'ARS', frecuencia_gps: 120 }
            });
            const savedTenant = await manager.save(tenant);

            await manager.save(manager.create(TenantPricing, {
                tenantId: savedTenant.id,
                precioCp: Number(body.precioUnidad || 150),
                moneda: body.config?.moneda || 'ARS',
                fechaDesde: new Date()
            }));

            const passwordHash = await bcrypt.hash(body.adminPassword || '123456', 10);

            // Usamos manager.create para asegurar que se apliquen los defaults del Entity (como role y must_change_password)
            const user = manager.create(User, {
                email: body.adminEmail,
                passwordHash,
                nombreCompleto: body.adminName || body.nombreEmpresa,
                role: UserRole.TENANT_ADMIN,
                tenantId: savedTenant.id,
                mustChangePassword: false
            });
            await manager.save(user);

            await manager.save(manager.create(WalletBalance, {
                tenantId: savedTenant.id,
                clientId: null,
                saldoCreditos: 0
            }));

            // Usamos manager.create para AuditLog para asegurar que 'resuelto' (NOT NULL) se ponga en false por defecto
            await manager.save(manager.create(AuditLog, {
                accion: 'ALTA_TENANT',
                descripcion: `Empresa creada: ${savedTenant.nombreEmpresa}`,
                resueltoPor: 'Sistema',
                tenantId: savedTenant.id,
                resuelto: false
            }));

            return savedTenant;
        });
    }

    @Public()
    @Post('tenants/:id/update')
    async updateTenant(@Param('id') id: string, @Body() body: any) {
        const tenant = await this.tenantRepo.findOne({ where: { id } });
        if (!tenant) throw new NotFoundException();
        const oldData = { ...tenant };
        Object.assign(tenant, body);
        const saved = await this.tenantRepo.save(tenant);
        if (body.precioUnidad) await this.pricingRepo.save(this.pricingRepo.create({ tenantId: id, precioCp: Number(body.precioUnidad), moneda: tenant.config?.moneda || 'ARS', fechaDesde: new Date() }));
        await this.auditRepo.save({ accion: 'CONFIG_UPDATE', descripcion: `Actualización empresa ${tenant.nombreEmpresa}`, tenantId: id, dataAnterior: oldData, dataNueva: saved });
        return saved;
    }

    @Public()
    @Get('tenants/:id/payments')
    async getTenantPayments(@Param('id') id: string) {
        return this.paymentRepo.find({
            where: { tenantId: id },
            order: { fechaPago: 'DESC' }
        });
    }

    @Public()
    @Post('tenants/:id/delete')
    async deleteTenant(@Param('id') id: string, @Query('force') force: string) {
        const tenant = await this.tenantRepo.findOne({ where: { id } });
        if (!tenant) throw new NotFoundException('Empresa no encontrada');

        return await this.dataSource.transaction(async manager => {
            const isForce = force === 'true';

            // 1. Verificar si hay viajes vinculados
            const tripsCount = await manager.count(CartaPorte, { where: { tenantId: id } });

            if (tripsCount > 0 && !isForce) {
                throw new BadRequestException(`No se puede eliminar la empresa: tiene ${tripsCount} viajes registrados. Use 'force=true' para borrar todo o considere desactivarla.`);
            }

            // 2. Registrar auditoría
            await manager.save(AuditLog, {
                accion: 'BAJA_TENANT',
                descripcion: `Empresa eliminada: ${tenant.nombreEmpresa} (ID: ${id}) ${isForce ? '[FORCE DELETE]' : ''}`,
                resueltoPor: 'Sistema'
            });

            // 3. Borrado en cascada manual
            if (isForce) {
                // Borrar datos vinculados a los viajes primero
                const trips = await manager.find(CartaPorte, { where: { tenantId: id } });
                const tripIds = trips.map(t => t.id);

                if (tripIds.length > 0) {
                    await manager.delete(GpsTracking, { cpId: In(tripIds) });
                    // Limpiar referencias en cartas_de_porte para evitar FK issues si es necesario
                    await manager.delete(CartaPorte, { tenantId: id });
                }

                // Borrar otros datos vinculados al tenant
                // Assuming AdtCredit is an entity or similar structure that might exist
                // If AdtCredit is not an entity, this line would cause an error.
                // For now, it's kept as per the instruction.
                // await manager.delete(AdtCredit, { client: { tenantId: id } }); // Usando join implícito o subquery si es necesario
                // Nota: Algunos deletes podrían requerir lógica más compleja dependiendo de las FKs
            }

            await manager.delete(User, { tenantId: id });
            await manager.delete(WalletBalance, { tenantId: id });
            await manager.delete(TenantPricing, { tenantId: id });
            await manager.delete(PricingRule, { tenantId: id });
            await manager.delete(Driver, { tenantId: id });
            await manager.delete(TransportUnit, { tenantId: id });
            await manager.delete(Client, { tenantId: id });

            // Finalmente borrar el tenant
            await manager.delete(Tenant, { id });

            return { success: true, message: `Empresa ${tenant.nombreEmpresa} eliminada correctamente${isForce ? ' incluyendo todo su historial.' : '.'}` };
        });
    }

    @Public()
    @Post('system/reset')
    async resetSystem(@Body() body: { confirmation: string }) {
        if (body.confirmation !== 'RESETEAR SISTEMA TOTAL') {
            throw new BadRequestException('Confirmación inválida para el reset del sistema.');
        }

        console.log('!!! INICIANDO RESET TOTAL DEL SISTEMA !!!');

        return await this.dataSource.transaction(async manager => {
            const tables = [
                'gps_tracking',
                'audit_logs',
                'email_ingestion_logs',
                'lote_deducciones',
                'payment_lotes',
                'financial_lotes',
                'adt_credits',
                'adt_recaudaciones',
                'cartas_de_porte',
                'settlement_batches',
                'travel_credits',
                'client_authorized_emails',
                'tenant_payments',
                'billetera_saldos',
                'pricing_rules',
                'tenant_pricing',
                'drivers',
                'transport_units',
                'clients'
            ];

            for (const table of tables) {
                try {
                    console.log(`Borrando tabla: ${table}...`);
                    await manager.query(`DELETE FROM ${table}`);
                } catch (e) {
                    console.warn(`Error al borrar ${table} (ignorando):`, e.message);
                }
            }

            try {
                console.log('Borrando usuarios (excepto admin@adt.com)...');
                await manager.query("DELETE FROM users WHERE email NOT IN ('admin@adt.com')");
            } catch (e) { console.warn('Error al borrar users:', e.message); }

            try {
                console.log('Borrando tenants...');
                await manager.query('DELETE FROM tenants');
            } catch (e) { console.warn('Error al borrar tenants:', e.message); }

            console.log('!!! RESET TOTAL COMPLETADO !!!');
            return { success: true, message: 'Sistema restaurado a cero satisfactoriamente.' };
        });
    }

    // --- CLIENTES ---

    @Public()
    @Get('clients')
    async getClients(@Query('tenantId') tenantId: string) {
        const isGlobal = !tenantId || tenantId === 'null' || tenantId === 'undefined';
        try {
            const pricing = !isGlobal ? await this.pricingRepo.findOne({ where: { tenantId }, order: { fechaDesde: 'DESC' } }) : null;
            const query = this.dataSource.getRepository(Client).createQueryBuilder('client').leftJoin(WalletBalance, 'wallet', 'wallet.clientId = client.id AND wallet.tenantId = client.tenantId').select(['client.id AS id', 'client.nombreRazonSocial AS nombreRazonSocial', 'client.email AS email', 'client.notify_new_trip AS notifyNewTrip', 'client.notify_settlement AS notifySettlement', 'client.asunto_clave AS asuntoClave', 'ISNULL(wallet.saldo_creditos, 0) AS saldoCreditos']);
            if (!isGlobal) query.where('client.tenantId = :tenantId', { tenantId });
            const rawClients = await query.getRawMany();
            return Promise.all(rawClients.map(async c => {
                const userCount = await this.userRepo.count({ where: { clientId: c.id, role: UserRole.CLIENT } });
                return { ...c, hasUser: userCount > 0, precioPorCp: Number(pricing?.precioCp || 0), monedaPreferida: pricing?.moneda || 'ARS', saldoCreditos: Number(c.saldoCreditos || 0) };
            }));
        } catch (e) { return []; }
    }

    @Public()
    @Post('clients')
    async createClient(@Body() body: any) {
        const client = this.clientRepo.create(body);
        return this.clientRepo.save(client);
    }

    @Public()
    @Patch('clients/:id')
    async updateClient(@Param('id') id: string, @Body() body: any) {
        const client = await this.clientRepo.findOne({ where: { id } });
        if (!client) throw new NotFoundException();
        Object.assign(client, body);
        return this.clientRepo.save(client);
    }

    @Public()
    @Post('clients/:id/empty')
    async emptyClient(@Param('id') id: string, @Body() body: { secret: string }) {
        if (body.secret !== 'ADT_CONFIRM_DELETE') {
            throw new BadRequestException('Secreto de confirmación inválido');
        }

        const client = await this.clientRepo.findOne({ where: { id } });
        if (!client) throw new NotFoundException('Dador de carga no encontrado');

        console.log(`[EMPTY CLIENT] Iniciando limpieza total para dador: ${client.nombreRazonSocial} (${id})`);

        return await this.dataSource.transaction(async manager => {
            // 1. Calcular deuda a descontar antes de borrar (Uso de SQL Nativo para evitar errores de mapeo)
            const trips = await manager.query(`SELECT id, revenue_at_execution as revenueAtExecution, precio_congelado as precioCongelado, es_credito as esCredito, monto_upcharge as montoUpcharge, estado FROM cartas_de_porte WHERE client_id = '${id}'`);

            let debtToSubtract = 0;
            for (const t of trips) {
                if (t.esCredito) {
                    debtToSubtract += Number(t.montoUpcharge || 0);
                } else {
                    // Para viajes normales (incluyendo ANULADOS/VOID_CREDIT), 
                    // restamos el costo de la CP que ADT cobró al Tenant.
                    debtToSubtract += Number(t.precioCongelado || 0);
                }
            }

            if (debtToSubtract > 0) {
                console.log(`[EMPTY CLIENT] Restando $${debtToSubtract} de la deuda del tenant.`);
                const tenant = await manager.findOne(Tenant, { where: { id: client.tenantId } });
                if (tenant) {
                    tenant.deudaActual = Math.max(0, Number(tenant.deudaActual || 0) - debtToSubtract);
                    await manager.save(tenant);
                }
            }

            // 2. Obtener IDs de viajes para borrar tracks y desvincular
            const tripIds = trips.map(t => t.id);

            if (tripIds.length > 0) {
                console.log(`[EMPTY CLIENT] Procesando ${tripIds.length} viajes para dador ${id}`);

                // Desvincular de lotes de pago y liquidaciones para evitar fallos de FK (aunque sean nullables)
                // Usamos query nativa para mayor velocidad y efectividad en masa
                await manager.query(`UPDATE cartas_de_porte SET payment_lot_id = NULL, settlement_id = NULL, financial_lot_id = NULL WHERE id IN (${tripIds.map(id => `'${id}'`).join(',')})`);

                console.log(`[EMPTY CLIENT] Borrando tracks asociados...`);
                await manager.query(`DELETE FROM gps_tracking WHERE cp_id IN (${tripIds.map(tid => `'${tid}'`).join(',')})`);

                console.log(`[EMPTY CLIENT] Borrando viajes (cartas_de_porte)...`);
                await manager.query(`DELETE FROM cartas_de_porte WHERE id IN (${tripIds.map(tid => `'${tid}'`).join(',')})`);
            }

            // 3. Borrar Lotes y Liquidaciones del Dador con SQL Nativo (Efectividad 100%)
            console.log(`[EMPTY CLIENT] Borrando registros periféricos del dador ${id}`);

            try {
                // Borrar Lotes Financieros y Liquidaciones
                await manager.query(`DELETE FROM financial_lotes WHERE client_id = '${id}'`);
                await manager.query(`DELETE FROM settlement_batches WHERE entity_id = '${id}' AND entity_type = 'DADOR'`);

                // Borrar Créditos, Vales y Reglas
                await manager.query(`DELETE FROM travel_credits WHERE client_id = '${id}'`);
                // AdtCredit se borra vinculando con los viajes del dador (no tiene col directa client_id en DB)
                if (tripIds.length > 0) {
                    await manager.query(`DELETE FROM adt_credits WHERE viaje_original_id IN (${tripIds.map(tid => `'${tid}'`).join(',')})`);
                }
                await manager.query(`DELETE FROM pricing_rules WHERE entity_id = '${id}' AND entity_type = 'DADOR'`);
                await manager.query(`DELETE FROM client_authorized_emails WHERE client_id = '${id}'`);

                // Reset billetera
                await manager.query(`UPDATE billetera_saldos SET saldo_creditos = 0 WHERE client_id = '${id}'`);

                // Borrar Usuarios vinculados
                await manager.query(`DELETE FROM users WHERE client_id = '${id}' AND role = 'CLIENT'`);

                console.log(`[EMPTY CLIENT] Vaciado de registros periféricos para ${id} OK.`);
            } catch (e) {
                console.error(`[EMPTY CLIENT] FALLO EN SQL NATIVO:`, e.message);
                throw e;
            }

            console.log(`[EMPTY CLIENT] Vaciado de ${client.nombreRazonSocial} completado con éxito.`);

            // 7. Auditoría final
            await manager.save(AuditLog, {
                accion: 'VACIAR_DADOR',
                descripcion: `VACIADO TOTAL EFECTIVO (Nativo) para ${client.nombreRazonSocial}. Deuda descontada: $${debtToSubtract}`,
                tenantId: client.tenantId,
                resueltoPor: 'Admin',
                dataNueva: JSON.stringify({ clientId: id, tripsRemoved: tripIds.length })
            });

            return { success: true, message: `Historial de ${client.nombreRazonSocial} vaciado completamente con éxito.` };
        }).catch(err => {
            console.error('[EMPTY CLIENT] FALLO CRÍTICO EN OPERACIÓN ROBUSTA:', err);
            throw new BadRequestException(`No se pudo completar el vaciado robusto: ${err.message}`);
        });
    }

    // --- INTELIGENCIA FINANCIERA (PRICING ENGINE) ---

    @Public()
    @Get('pricing/rules')
    async getPricingRules(@Query('tenantId') tenantId: string, @Query('entityId') entityId: string) {
        return this.dataSource.getRepository(PricingRule).find({ where: { tenantId, entityId }, order: { validFrom: 'DESC' } });
    }

    @Public()
    @Post('pricing/rules')
    async createPricingRule(@Body() body: any) {
        const repo = this.dataSource.getRepository(PricingRule);
        const rule = repo.create({ tenantId: body.tenantId, entityId: body.entityId, entityType: body.entityType, baseCalculation: body.baseCalculation, baseValue: Number(body.baseValue), conditionals: body.conditionals || [], validFrom: body.validFrom || new Date() });
        const saved = await repo.save(rule);
        // Sincronización Automática: Recalcular viajes pendientes
        await this.pricingEngine.recalculatePendingTrips(body.tenantId, body.entityId, body.entityType);
        return saved;
    }

    @Public()
    @Post('pricing/simulate')
    async simulatePricingImpact(@Body() proposal: any) {
        return this.pricingEngine.simulateImpact(proposal);
    }

    @Public()
    @Delete('force-delete-pricing/:id')
    async forceDeletePricingRule(@Param('id') id: string, @Query('role') role: string) {
        console.log(`[FORCE DELETE] Solicitado borrado de tarifa ${id} por ${role}`);
        if (role !== 'SUPER_ADMIN') throw new BadRequestException('Privilegios insuficientes');
        await this.pricingEngine.deleteRule(id, role);
        return { success: true };
    }

    // --- GESTIÓN DE PERSONAL Y UNIDADES ---

    @Public()
    @Get('drivers')
    async getDrivers(@Query('tenantId') tenantId: string) {
        const where = (!tenantId || tenantId === 'null' || tenantId === 'undefined') ? {} : { tenantId };
        const drivers = await this.driverRepo.find({ where, order: { nombre: 'ASC' } });
        return Promise.all(drivers.map(async d => {
            const pricing = await this.dataSource.getRepository(PricingRule).findOne({ where: { entityId: d.id, entityType: 'CHOFER' }, order: { validFrom: 'DESC' } });
            return { ...d, precioPorViaje: pricing?.baseValue || 0 };
        }));
    }

    @Public()
    @Get('units')
    async getUnits(@Query('tenantId') tenantId: string) {
        const where = (!tenantId || tenantId === 'null' || tenantId === 'undefined') ? {} : { tenantId };
        return this.unitRepo.find({ where, order: { patente: 'ASC' } });
    }

    @Public()
    @Get('stats')
    async getStats(@Query('tenantId') tenantId?: string) {
        const where = tenantId ? { tenantId } : {};
        const [trips, clients, drivers, units] = await Promise.all([
            this.tripsRepo.count({ where }),
            this.clientRepo.count({ where }),
            this.driverRepo.count({ where }),
            this.unitRepo.count({ where })
        ]);
        return { trips, clients, drivers, units };
    }

    @Public()
    @Get('finance/settlements-v2')
    async getSettlementsV2(
        @Query('tenantId') tenantId: string,
        @Query('entityType') entityType: string,
        @Query('month') month: string,
        @Query('year') year: string
    ) {
        if (!tenantId) throw new BadRequestException('tenantId is required');
        const m = parseInt(month);
        const y = parseInt(year);

        // 1. Obtener lotes de la tabla legacy SettlementBatch
        const legacyBatches = await this.batchRepo.find({
            where: { tenantId, entityType }
        });

        // 2. Obtener lotes de la tabla nueva PaymentLot (solo si es CHOFER)
        let newLots: any[] = [];
        if (entityType === 'CHOFER') {
            newLots = await this.paymentLotRepo.find({
                where: { tenantId },
                relations: ['chofer']
            });
        }

        // 3. Mapear todo al formato esperado por el frontend
        const items = [
            ...legacyBatches.filter(b => {
                const d = new Date(b.createdAt);
                return d.getMonth() + 1 === m && d.getFullYear() === y;
            }),
            ...newLots.filter(l => {
                const d = new Date(l.createdAt);
                return d.getMonth() + 1 === m && d.getFullYear() === y;
            }).map(l => ({
                id: l.id,
                createdAt: l.createdAt,
                entityId: l.choferId,
                periodStart: l.createdAt, // Fallback
                periodEnd: l.createdAt,   // Fallback
                totalNet: Number(l.netoFinal),
                status: 'PAID',
                pdfUrl: l.comprobantePath
            }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const stats = {
            totalNet: items.reduce((s, i) => s + Number(i.totalNet || 0), 0),
            paid: items.filter(i => i.status === 'PAID').length,
            pending: items.filter(i => i.status !== 'PAID').length
        };

        return { items, stats };
    }

    @Public()
    @Get('credits/history')
    async getCreditsHistory(
        @Query('tenantId') tenantId: string,
        @Query('month') month: string,
        @Query('year') year: string
    ) {
        if (!tenantId) throw new BadRequestException('tenantId is required');
        const m = parseInt(month);
        const y = parseInt(year);

        const credits = await this.creditsRepo.find({
            where: { tenantId },
            relations: ['tenant'] // No hay relación directa con client en la entidad actual, solo clientId
        });

        // Como no hay relación directa con Client en TravelCredit entity (según vi), 
        // necesitamos cargar los nombres de los clientes.
        const clients = await this.clientRepo.find({ where: { tenantId } });
        const clientMap = new Map(clients.map(c => [c.id, c]));

        const items = credits.filter(c => {
            const d = new Date(c.createdAt);
            return d.getMonth() + 1 === m && d.getFullYear() === y;
        }).map(c => {
            const client = clientMap.get(c.clientId);
            return {
                id: c.id,
                fecha: c.createdAt,
                client: client ? { id: client.id, nombreRazonSocial: client.nombreRazonSocial } : null,
                cantidadCreditos: 1, // Por ahora 1 por fila
                montoPagado: Number(c.precioPagadoNominal || 0),
                aprobado: true,
                referenciaPago: 'Recarga de Saldo / Cancelación'
            };
        });

        return items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }

    @Get('billing-audit')
    async getBillingAudit(@Query('tenantId') tenantId: string) {
        if (!tenantId) throw new BadRequestException('tenantId is required');

        const trips = await this.tripsRepo.find({
            where: { tenantId },
            relations: ['client'],
            order: { tsCreacion: 'DESC' }
        });

        const detalles = trips.map(t => {
            let tipo = 'CONSUMO NORMAL';
            let costo = 0;

            if (t.esCredito) {
                tipo = 'CONSUMO CRÉDITO';
                costo = Number(t.montoUpcharge || 0);
            } else {
                tipo = 'CONSUMO NORMAL';
                costo = Number(t.precioCongelado || 0);
            }

            return {
                id: t.id,
                fecha: t.tsCreacion,
                dadorCarga: t.client?.nombreRazonSocial || 'N/A',
                dadorCargaId: t.clientId,
                numeroCP: t.numeroCP || t.id.split('-')[0].toUpperCase(),
                tipo,
                costo,
                estado: t.estado,
                montoUpcharge: Number(t.montoUpcharge || 0)
            };
        });

        return { detalles };
    }


    // --- GESTIÓN DE ACCESOS Y USUARIOS DE CLIENTES ---

    @Public()
    @Get('clients/:id/admin-info')
    async getClientAdminInfo(@Param('id') id: string) {
        return this.userRepo.find({
            where: { clientId: id, role: UserRole.CLIENT },
            select: ['id', 'email', 'nombreCompleto', 'mustChangePassword']
        });
    }

    @Public()
    @Post('clients/:id/create-user')
    async createClientUser(@Param('id') id: string, @Body() body: any) {
        const client = await this.clientRepo.findOne({ where: { id } });
        if (!client) throw new NotFoundException('Cliente no encontrado');

        const passwordHash = await bcrypt.hash('ADT-321', 10);
        const user = this.userRepo.create({
            email: body.email,
            nombreCompleto: body.nombreCompleto || client.nombreRazonSocial,
            passwordHash,
            role: UserRole.CLIENT,
            tenantId: client.tenantId,
            clientId: id,
            mustChangePassword: true
        });

        const saved = await this.userRepo.save(user);
        await this.auditRepo.save({
            accion: 'ALTA_USUARIO_CLIENTE',
            descripcion: `Acceso creado para ${body.email} (Cliente: ${client.nombreRazonSocial})`,
            tenantId: client.tenantId,
            resueltoPor: 'Admin'
        });

        // Enviar email de bienvenida
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #6366f1;">Bienvenido a ADT</h2>
                <p>Se ha creado un nuevo acceso para su cuenta de dador de carga: <strong>${client.nombreRazonSocial}</strong>.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Usuario:</strong> ${body.email}</p>
                    <p><strong>Contraseña Temporal:</strong> ADT-321</p>
                </div>
                <p>Puede ingresar al portal desde el siguiente enlace:</p>
                <a href="${process.env.FRONTEND_URL || 'https://adt-logistica.com'}" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Ir al Portal</a>
                <p style="margin-top: 20px; font-size: 0.8em; color: #666;">Por seguridad, se le solicitará cambiar la contraseña en su primer ingreso.</p>
            </div>
        `;

        const tenant = await this.tenantRepo.findOne({ where: { id: client.tenantId } });
        if (!tenant) throw new NotFoundException('Empresa no encontrada');
        const sent = await this.notificationsService.sendEmail(body.email, 'Accesos al Portal ADT', html, tenant || undefined);
        if (!sent) {
            throw new BadRequestException('Error al enviar el email. Verifique la configuración SMTP.');
        }

        return saved;
    }

    @Public()
    @Patch('users/:userId/email')
    async updateUserEmail(@Param('userId') userId: string, @Body() body: { email: string }) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuario no encontrado');

        user.email = body.email;
        return this.userRepo.save(user);
    }

    @Public()
    @Post('users/:userId/resend-credentials')
    async resendCredentials(@Param('userId') userId: string) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuario no encontrado');

        const passwordHash = await bcrypt.hash('ADT-321', 10);
        user.passwordHash = passwordHash;
        user.mustChangePassword = true;
        await this.userRepo.save(user);

        // Enviar email
        const tenant = await this.tenantRepo.findOne({ where: { id: user.tenantId } });
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #22c55e;">Restablecimiento de Credenciales</h2>
                <p>Se ha restablecido su acceso al sistema logístico.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Nueva Contraseña Temporal:</strong> ADT-321</p>
                </div>
                <p>Por seguridad, se le solicitará cambiar la contraseña al ingresar.</p>
            </div>
        `;
        const sent = await this.notificationsService.sendEmail(user.email, 'Sus Credenciales ADT', html);
        if (!sent) {
            throw new BadRequestException('Error al enviar el email. Verifique la configuración SMTP.');
        }

        return { success: true, message: `Credenciales re-enviadas a ${user.email}` };
    }

    @Public()
    @Post('clients/:id/send-credentials')
    async sendClientCredentials(@Param('id') id: string) {
        const client = await this.clientRepo.findOne({ where: { id } });
        if (!client) throw new NotFoundException('Dador de carga no encontrado');

        const user = await this.userRepo.findOne({
            where: { clientId: id, role: UserRole.CLIENT }
        });

        if (!user) {
            throw new BadRequestException('Este dador no tiene un usuario de acceso creado. Por favor, créelo desde el botón Acceso.');
        }

        // Restablecer contraseña a la estándar ADT-321
        const passwordHash = await bcrypt.hash('ADT-321', 10);
        user.passwordHash = passwordHash;
        user.mustChangePassword = true;
        await this.userRepo.save(user);

        // Enviar email al email configurado en el CLIENTE (no necesariamente el del usuario)
        const recipientEmail = client.email || user.email;

        const tenant = await this.tenantRepo.findOne({ where: { id: client.tenantId } });
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #6366f1;">Sus Credenciales de Acceso - ANKA</h2>
                <p>Se han generado los datos para que ingrese al portal de seguimiento operativo de <strong>${client.nombreRazonSocial}</strong>.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Usuario / Email:</strong> ${user.email}</p>
                    <p><strong>Contraseña Temporal:</strong> ADT-321</p>
                </div>
                <p>Puede ingresar aquí:</p>
                <a href="${process.env.FRONTEND_URL || 'https://sistema.anka.ar'}" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Ir al Portal Operativo</a>
                <p style="margin-top: 20px; font-size: 0.8em; color: #666;">Por seguridad, cambie la contraseña al ingresar por primera vez.</p>
            </div>
        `;

        const sent = await this.notificationsService.sendEmail(recipientEmail, 'Accesos al Portal ANKA Logística', html);
        if (!sent) {
            throw new BadRequestException('Error al enviar el email. Si usa Gmail, verifique que use "Contraseña de Aplicación". Más detalles en Errores de Apps.');
        }

        return { success: true, message: `Credenciales enviadas a ${recipientEmail} con éxito.` };
    }

    // --- EMAILS AUTORIZADOS IA ---

    @Public()
    @Get('authorized-emails')
    async getAuthorizedEmails(@Query('clientId') clientId: string) {
        return this.dataSource.getRepository(ClientAuthorizedEmail).find({
            where: { clientId }
        });
    }

    @Public()
    @Post('authorized-emails')
    async addAuthorizedEmail(@Body() body: any) {
        const repo = this.dataSource.getRepository(ClientAuthorizedEmail);
        const authEmail = repo.create({
            clientId: body.clientId,
            emailAutorizado: body.email,
            asuntoClave: body.asunto || 'SOLICITUD VIAJE'
        });
        return repo.save(authEmail);
    }

    @Public()
    @Delete('authorized-emails/:id')
    async deleteAuthorizedEmail(@Param('id') id: string) {
        await this.dataSource.getRepository(ClientAuthorizedEmail).delete(id);
        return { success: true };
    }

    @Public()
    @Post('clients/:id/update-subject')
    async updateClientSubject(@Param('id') id: string, @Body() body: { asunto: string }) {
        const client = await this.clientRepo.findOne({ where: { id } });
        if (!client) throw new NotFoundException('Cliente no encontrado');

        client.asuntoClave = body.asunto.toUpperCase();
        return this.clientRepo.save(client);
    }

    // --- GESTIÓN AVANZADA DE TENANTS ---

    @Public()
    @Get('tenants/:id/admin-info')
    async getTenantAdminInfo(@Param('id') id: string) {
        const user = await this.userRepo.findOne({
            where: { tenantId: id, role: UserRole.TENANT_ADMIN }
        });
        if (!user) throw new NotFoundException('Administrador no encontrado');
        return { nombre: user.nombreCompleto, email: user.email };
    }

    @Public()
    @Post('tenants/:id/toggle-status')
    async toggleTenantStatus(@Param('id') id: string) {
        const tenant = await this.tenantRepo.findOne({ where: { id } });
        if (!tenant) throw new NotFoundException('Empresa no encontrada');
        tenant.activo = !tenant.activo;
        return this.tenantRepo.save(tenant);
    }

    @Public()
    @Post('tenants/:id/reset-password')
    async resetTenantPassword(@Param('id') id: string) {
        const user = await this.userRepo.findOne({
            where: { tenantId: id, role: UserRole.TENANT_ADMIN }
        });
        if (!user) throw new NotFoundException('Administrador no encontrado');

        const tempPass = 'ADT-TEMP-' + Math.floor(1000 + Math.random() * 9000);
        user.passwordHash = await bcrypt.hash(tempPass, 10);
        user.mustChangePassword = true;
        await this.userRepo.save(user);

        return { email: user.email, temporaryPassword: tempPass };
    }

    @Public()
    @Post('tenants/:id/admin-update')
    async updateTenantAdmin(@Param('id') id: string, @Body() body: any) {
        const user = await this.userRepo.findOne({
            where: { tenantId: id, role: UserRole.TENANT_ADMIN }
        });
        if (!user) throw new NotFoundException('Administrador no encontrado');

        user.nombreCompleto = body.nombre;
        user.email = body.email;
        return this.userRepo.save(user);
    }

    @Post('tenants/:id/send-credentials')
    async sendTenantCredentials(@Param('id') id: string) {
        const tenant = await this.tenantRepo.findOne({ where: { id } });
        if (!tenant) throw new NotFoundException('Empresa no encontrada');
        const user = await this.userRepo.findOne({
            where: { tenantId: id, role: UserRole.TENANT_ADMIN }
        });
        if (!user) throw new NotFoundException('Administrador no encontrado');

        const tempPass = 'ADT-321'; // Usamos la estándar por simplicidad o podríamos resetear a random
        user.passwordHash = await bcrypt.hash(tempPass, 10);
        user.mustChangePassword = true;
        await this.userRepo.save(user);

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #3b82f6;">Bienvenido al Ecosistema ADT</h2>
                <p>Hola <strong>${user.nombreCompleto}</strong>,</p>
                <p>Se han generado sus credenciales de administrador para <strong>${tenant.nombreEmpresa}</strong>.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Email de Acceso:</strong> ${user.email}</p>
                    <p><strong>Contraseña Temporal:</strong> ${tempPass}</p>
                </div>
                <p>Puede iniciar sesión aquí:</p>
                <a href="${process.env.FRONTEND_URL || 'https://adt-logistica.com'}" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Acceder al Panel</a>
                <p style="margin-top: 20px; font-size: 0.8em; color: #666;">Se le pedirá cambiar esta contraseña en su primer ingreso.</p>
            </div>
        `;

        const sent = await this.notificationsService.sendEmail(user.email, 'Accesos ADT - ' + (tenant?.nombreEmpresa || ''), html);

        if (!sent) {
            throw new BadRequestException('El sistema no pudo enviar el email. Si usa Gmail, verifique que esté usando una "Contraseña de Aplicación". Más info en Errores de Apps.');
        }

        return { success: true, message: `Credenciales enviadas a ${user.email} con éxito.` };
    }

    @Public()
    @Post('cleanup')
    async cleanupTenantData(@Body() body: { tenantId: string, secret: string }) {
        if (body.secret !== 'ADT_CONFIRM_DELETE') {
            throw new BadRequestException('Secreto de confirmación inválido');
        }

        const tenant = await this.tenantRepo.findOne({ where: { id: body.tenantId } });
        if (!tenant) throw new NotFoundException('Empresa no encontrada');

        return await this.dataSource.transaction(async manager => {
            const tenantId = body.tenantId;

            // Orden de borrado transaccional para el tenant específico
            await manager.delete(GpsTracking, { cpId: In(await manager.find(CartaPorte, { where: { tenantId }, select: ['id'] }).then(ts => ts.map(t => t.id))) });
            await manager.delete(CartaPorte, { tenantId });
            await manager.delete(SettlementBatch, { tenantId });
            await manager.delete(PaymentLot, { tenantId });
            await manager.delete(AuditLog, { tenantId });

            return { success: true, message: `Datos operativos de ${tenant.nombreEmpresa} eliminados.` };
        });
    }

    @Public()
    @Get('tenants/:tenantId/pending-trips')
    async getPendingTrips(@Param('tenantId') tenantId: string) {
        return this.tripsRepo.find({
            where: { tenantId, pagoConfirmado: false },
            relations: ['client'],
            order: { tsCreacion: 'DESC' }
        });
    }

    @Public()
    @Post('tenants/:tenantId/record-payment')
    async recordPayment(@Param('tenantId') tenantId: string, @Body() body: any) {
        const { tripIds, monto, referencia, metodo, adminName } = body;

        return await this.dataSource.transaction(async manager => {
            // 1. Crear registro de pago
            const payment = manager.create(TenantPayment, {
                tenantId,
                monto: Number(monto),
                referencia,
                metodoPago: metodo,
                registradoPor: adminName
            });
            const savedPayment = await manager.save(payment);

            // 2. Marcar viajes como confirmados
            if (tripIds && tripIds.length > 0) {
                await manager.update(CartaPorte,
                    { id: In(tripIds) },
                    { pagoConfirmado: true, batchCobroId: savedPayment.id }
                );
            }

            // 3. Actualizar deuda del tenant
            const tenant = await manager.findOne(Tenant, { where: { id: tenantId } });
            if (tenant) {
                tenant.deudaActual = Math.max(0, Number(tenant.deudaActual || 0) - Number(monto));
                await manager.save(tenant);
            }

            return savedPayment;
        });
    }

    @Public()
    @Delete('payments/:paymentId')
    async deletePayment(@Param('paymentId') paymentId: string) {
        return await this.dataSource.transaction(async manager => {
            const payment = await manager.findOne(TenantPayment, { where: { id: paymentId } });
            if (!payment) throw new NotFoundException('Pago no encontrado');

            // 1. Revertir confirmación de viajes
            await manager.update(CartaPorte,
                { batchCobroId: paymentId },
                { pagoConfirmado: false, batchCobroId: null as any }
            );

            // 2. Revertir deuda del tenant
            const tenant = await manager.findOne(Tenant, { where: { id: payment.tenantId } });
            if (tenant) {
                tenant.deudaActual = Number(tenant.deudaActual || 0) + Number(payment.monto);
                await manager.save(tenant);
            }

            // 3. Borrar el pago
            await manager.delete(TenantPayment, { id: paymentId });

            return { success: true };
        });
    }

    @Public()
    @Post('tenants/:tenantId/send-settlement')
    async sendSettlement(
        @Param('tenantId') tenantId: string,
        @Query('month') month: string,
        @Query('year') year: string
    ) {
        const m = parseInt(month);
        const y = parseInt(year);
        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Empresa no encontrada');

        if (!tenant.telegramChatId) {
            throw new BadRequestException('La empresa no tiene configurado un ID de Telegram para notificaciones.');
        }

        // Obtener viajes del periodo
        const trips = await this.tripsRepo.find({ where: { tenantId } });
        const filtered = trips.filter(t => {
            const d = new Date(t.tsCreacion);
            return d.getMonth() + 1 === m && d.getFullYear() === y;
        });

        const totalDeudaMes = filtered.reduce((s, t) => s + (t.esCredito ? Number(t.montoUpcharge || 0) : Number(t.precioCongelado || 0)), 0);
        const mName = new Date(y, m - 1).toLocaleString('es-AR', { month: 'long' }).toUpperCase();

        const message = `📊 *RESUMEN DE LIQUIDACIÓN - ${mName} ${y}*\n\n` +
            `🏢 *Empresa:* ${tenant.nombreEmpresa}\n` +
            `📦 *Total Despachos:* ${filtered.length}\n` +
            `💰 *Deuda del Mes:* $${totalDeudaMes.toLocaleString('es-AR')}\n` +
            `🛑 *Deuda Total Acumulada:* $${Number(tenant.deudaActual || 0).toLocaleString('es-AR')}\n\n` +
            `_Por favor, proceda a la conciliación en el panel administrativo._`;

        await this.telegramService.sendMessage(tenant.telegramChatId, message);
        return { success: true };
    }

    @Get('trips/incoming-requests')
    async getIncomingRequests(@Query('tenantId') tenantId: string) {
        if (!tenantId) throw new BadRequestException('tenantId is required');
        return this.tripsRepo.find({
            where: {
                tenantId,
                estado: TripStatus.PENDING_CONFIRMATION
            },
            relations: ['client'],
            order: { tsCreacion: 'DESC' }
        });
    }

    @Get('email-logs')
    async getEmailLogs(@Query('tenantId') tenantId: string) {
        if (!tenantId) throw new BadRequestException('tenantId is required');
        return this.dataSource.getRepository(EmailIngestionLog).find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
            take: 20
        });
    }

    @Post('ingest-emails')
    async triggerIngestion(@Query('tenantId') tenantId: string) {
        if (!tenantId) throw new BadRequestException('tenantId is required');
        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        if (!tenant) throw new BadRequestException('Tenant not found');
        const oneHourAgo = new Date(Date.now() - 3600 * 1000);
        await this.emailIngestionService.processEmailsForTenant(tenant, { since: oneHourAgo });
        return { message: 'Ingesta finalizada (última 1 hora). Revisa los email-logs.' };
    }

    @Post('ai/copilot')
    async processAiCopilot(@Body() body: { userInput: string, tenantId: string }, @Req() req: any) {
        const { userInput, tenantId } = body;
        const user = req.user;
        if (!userInput || !tenantId) throw new BadRequestException('userInput and tenantId are required');

        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Tenant not found');

        // Contexto enriquecido para el Copilot
        let clientName: string | null = null;
        if (user.clientId) {
            const client = await this.clientRepo.findOne({ where: { id: user.clientId } });
            clientName = client?.nombreRazonSocial ?? null;
        }

        const context = {
            tenantId,
            userId: user.userId,
            role: user.role,
            clientId: user.clientId,
            clientName: clientName ?? null,
            serverTime: new Date().toISOString()
        };

        return await this.aiExtractorService.processFinanceCopilot(
            userInput,
            context,
            tenant.geminiApiKey
        );
    }

    @Get('pwa-logs')
    async getPwaLogs() {
        return this.dataSource.getRepository(AppLog).find({
            order: { timestamp: 'DESC' },
            take: 100
        });
    }

    @Get('audits')
    async getAudits(@Query('tenantId') tenantId: string) {
        if (!tenantId) throw new BadRequestException('tenantId is required');
        return this.auditRepo.find({
            where: { tenantId },
            order: { fecha: 'DESC' },
            take: 100
        });
    }

    @Get('logs')
    async getSystemLogs() {
        // Alias para pwa-logs si el frontend lo pide como logs
        return this.getPwaLogs();
    }

    @Get('server-pm2-logs')
    async getServerPm2Logs(@Query('type') type: 'error' | 'out' = 'error', @Query('role') role: string) {
        // Validación de seguridad simple basada en el patrón actual del proyecto
        if (role !== 'SUPER_ADMIN') throw new BadRequestException('Acceso denegado');

        // Intentamos detectar la ruta de PM2 basándonos en el sistema operativo
        // En el log previo vimos que es: /root/.pm2/logs/sistema-adt-error.log
        const logFileName = type === 'error' ? 'sistema-adt-error.log' : 'sistema-adt-out.log';

        // Rutas candidatas para el VPS (root o home del usuario)
        const paths = [
            path.join('/root', '.pm2', 'logs', logFileName),
            path.join(os.homedir(), '.pm2', 'logs', logFileName)
        ];

        let logContent = '';
        let foundPath = '';

        for (const p of paths) {
            if (fs.existsSync(p)) {
                foundPath = p;
                try {
                    // Leemos los últimos 50KB para no saturar la memoria
                    const stats = fs.statSync(p);
                    const start = Math.max(0, stats.size - (50 * 1024)); // Últimos 50KB
                    const buffer = Buffer.alloc(stats.size - start);
                    const fd = fs.openSync(p, 'r');
                    fs.readSync(fd, buffer, 0, buffer.length, start);
                    fs.closeSync(fd);
                    logContent = buffer.toString('utf8');
                    break;
                } catch (e) {
                    console.error(`Error leyendo log: ${p}`, e);
                }
            }
        }

        if (!logContent) {
            return {
                content: `No se encontró el archivo de log en las rutas escaneadas.\nRuta intentada: ${paths.join(' o ')}`,
                path: paths[0],
                timestamp: new Date().toISOString()
            };
        }

        return {
            content: logContent,
            path: foundPath,
            timestamp: new Date().toISOString()
        };
    }
}
