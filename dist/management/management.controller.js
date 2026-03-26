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
exports.ManagementController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const trips_service_1 = require("../trips/trips.service");
const update_trip_status_dto_1 = require("../trips/dto/update-trip-status.dto");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const carta_porte_entity_1 = require("../database/entities/carta-porte.entity");
const gps_tracking_entity_1 = require("../database/entities/gps-tracking.entity");
const audit_log_entity_1 = require("../database/entities/audit-log.entity");
const transport_unit_entity_1 = require("../database/entities/transport-unit.entity");
const driver_entity_1 = require("../database/entities/driver.entity");
const tenant_entity_1 = require("../database/entities/tenant.entity");
const tenant_pricing_entity_1 = require("../database/entities/tenant-pricing.entity");
const travel_credit_entity_1 = require("../database/entities/travel-credit.entity");
const user_entity_1 = require("../database/entities/user.entity");
const client_entity_1 = require("../database/entities/client.entity");
const client_authorized_email_entity_1 = require("../database/entities/client-authorized-email.entity");
const wallet_balance_entity_1 = require("../database/entities/wallet-balance.entity");
const tenant_payment_entity_1 = require("../database/entities/tenant-payment.entity");
const telegram_service_1 = require("./telegram.service");
const email_ingestion_service_1 = require("./email-ingestion.service");
const settlement_batch_entity_1 = require("../database/entities/settlement-batch.entity");
const payment_lot_entity_1 = require("../database/entities/payment-lot.entity");
const pricing_rule_entity_1 = require("../database/entities/pricing-rule.entity");
const pricing_engine_service_1 = require("./pricing-engine.service");
const financial_reporting_service_1 = require("./financial-reporting.service");
const ai_extractor_service_1 = require("./ai-extractor.service");
const adt_credit_entity_1 = require("../database/entities/adt-credit.entity");
const adt_recaudacion_entity_1 = require("../database/entities/adt-recaudacion.entity");
const notifications_service_1 = require("./notifications.service");
const system_config_entity_1 = require("../database/entities/system-config.entity");
const email_ingestion_log_entity_1 = require("../database/entities/email-ingestion-log.entity");
const app_log_entity_1 = require("../database/entities/app-log.entity");
const public_decorator_1 = require("../auth/public.decorator");
const bcrypt = __importStar(require("bcrypt"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
let ManagementController = class ManagementController {
    tripsRepo;
    gpsRepo;
    auditRepo;
    unitRepo;
    driverRepo;
    tenantRepo;
    pricingRepo;
    creditsRepo;
    clientRepo;
    userRepo;
    paymentRepo;
    walletRepo;
    systemConfigRepo;
    batchRepo;
    paymentLotRepo;
    adtCreditRepo;
    adtRecaudacionRepo;
    tripsService;
    pricingEngine;
    reportingService;
    aiExtractorService;
    notificationsService;
    telegramService;
    emailIngestionService;
    dataSource;
    constructor(tripsRepo, gpsRepo, auditRepo, unitRepo, driverRepo, tenantRepo, pricingRepo, creditsRepo, clientRepo, userRepo, paymentRepo, walletRepo, systemConfigRepo, batchRepo, paymentLotRepo, adtCreditRepo, adtRecaudacionRepo, tripsService, pricingEngine, reportingService, aiExtractorService, notificationsService, telegramService, emailIngestionService, dataSource) {
        this.tripsRepo = tripsRepo;
        this.gpsRepo = gpsRepo;
        this.auditRepo = auditRepo;
        this.unitRepo = unitRepo;
        this.driverRepo = driverRepo;
        this.tenantRepo = tenantRepo;
        this.pricingRepo = pricingRepo;
        this.creditsRepo = creditsRepo;
        this.clientRepo = clientRepo;
        this.userRepo = userRepo;
        this.paymentRepo = paymentRepo;
        this.walletRepo = walletRepo;
        this.systemConfigRepo = systemConfigRepo;
        this.batchRepo = batchRepo;
        this.paymentLotRepo = paymentLotRepo;
        this.adtCreditRepo = adtCreditRepo;
        this.adtRecaudacionRepo = adtRecaudacionRepo;
        this.tripsService = tripsService;
        this.pricingEngine = pricingEngine;
        this.reportingService = reportingService;
        this.aiExtractorService = aiExtractorService;
        this.notificationsService = notificationsService;
        this.telegramService = telegramService;
        this.emailIngestionService = emailIngestionService;
        this.dataSource = dataSource;
    }
    async findAllTrips(tenantId, estado, choferId, clientId) {
        return this.tripsService.findAll(tenantId, { estado, choferId, clientId });
    }
    async publicContact(body) {
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
        const sent1 = await this.notificationsService.sendEmail('sistema.anka@gmail.com', `Nueva Consulta Web: ${nombre}`, html);
        const sent2 = await this.notificationsService.sendEmail('derosasjm@gmail.com', `Nueva Consulta Web: ${nombre}`, html);
        if (!sent1 && !sent2) {
            throw new common_1.BadRequestException('El servidor no pudo procesar el envío. Verifique la configuración SMTP en el sistema.');
        }
        return { success: true, message: 'Consulta enviada correctamente.' };
    }
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
    async updateSystemConfig(body) {
        let config = await this.systemConfigRepo.findOne({ where: { configKey: 'GLOBAL_SETTINGS' } });
        if (!config)
            config = this.systemConfigRepo.create({ configKey: 'GLOBAL_SETTINGS' });
        const oldData = { ...config };
        config.smtpConfig = body.smtpConfig;
        config.telegramConfig = body.telegramConfig;
        config.geminiApiKey = body.geminiApiKey;
        const saved = await this.systemConfigRepo.save(config);
        await this.auditRepo.save({ accion: 'GLOBAL_CONFIG_UPDATE', descripcion: 'Se actualizó la configuración global (SMTP/Telegram)', resueltoPor: 'SuperAdmin', dataAnterior: oldData, dataNueva: saved });
        return saved;
    }
    async getTenants() {
        const tenants = await this.tenantRepo.createQueryBuilder('tenant').leftJoinAndSelect('tenant.pricings', 'pricing').orderBy('tenant.nombreEmpresa', 'ASC').addOrderBy('pricing.id', 'DESC').getMany();
        return Promise.all(tenants.map(async (tenant) => {
            const admin = await this.userRepo.findOne({ where: { tenantId: tenant.id, role: user_entity_1.UserRole.TENANT_ADMIN } });
            return { ...tenant, claveActualizada: admin ? !admin.mustChangePassword : true };
        }));
    }
    async getTenant(id) {
        if (!id || id === 'null')
            throw new common_1.BadRequestException('ID inválido');
        const tenant = await this.tenantRepo.findOne({ where: { id } });
        if (!tenant)
            throw new common_1.NotFoundException('Empresa no encontrada');
        return tenant;
    }
    async createTenant(body) {
        return await this.dataSource.transaction(async (manager) => {
            const tenant = manager.create(tenant_entity_1.Tenant, {
                nombreEmpresa: body.nombreEmpresa,
                logoUrl: body.logoUrl,
                telegramChatId: body.telegramChatId,
                config: body.config || { radio_geocerca: 500, moneda: 'ARS', frecuencia_gps: 120 }
            });
            const savedTenant = await manager.save(tenant);
            await manager.save(manager.create(tenant_pricing_entity_1.TenantPricing, {
                tenantId: savedTenant.id,
                precioCp: Number(body.precioUnidad || 150),
                moneda: body.config?.moneda || 'ARS',
                fechaDesde: new Date()
            }));
            const passwordHash = await bcrypt.hash(body.adminPassword || '123456', 10);
            const user = manager.create(user_entity_1.User, {
                email: body.adminEmail,
                passwordHash,
                nombreCompleto: body.adminName || body.nombreEmpresa,
                role: user_entity_1.UserRole.TENANT_ADMIN,
                tenantId: savedTenant.id,
                mustChangePassword: false
            });
            await manager.save(user);
            await manager.save(manager.create(wallet_balance_entity_1.WalletBalance, {
                tenantId: savedTenant.id,
                clientId: null,
                saldoCreditos: 0
            }));
            await manager.save(manager.create(audit_log_entity_1.AuditLog, {
                accion: 'ALTA_TENANT',
                descripcion: `Empresa creada: ${savedTenant.nombreEmpresa}`,
                resueltoPor: 'Sistema',
                tenantId: savedTenant.id,
                resuelto: false
            }));
            return savedTenant;
        });
    }
    async updateTenant(id, body) {
        const tenant = await this.tenantRepo.findOne({ where: { id } });
        if (!tenant)
            throw new common_1.NotFoundException();
        const oldData = { ...tenant };
        Object.assign(tenant, body);
        const saved = await this.tenantRepo.save(tenant);
        if (body.precioUnidad)
            await this.pricingRepo.save(this.pricingRepo.create({ tenantId: id, precioCp: Number(body.precioUnidad), moneda: tenant.config?.moneda || 'ARS', fechaDesde: new Date() }));
        await this.auditRepo.save({ accion: 'CONFIG_UPDATE', descripcion: `Actualización empresa ${tenant.nombreEmpresa}`, tenantId: id, dataAnterior: oldData, dataNueva: saved });
        return saved;
    }
    async getTenantPayments(id) {
        return this.paymentRepo.find({
            where: { tenantId: id },
            order: { fechaPago: 'DESC' }
        });
    }
    async deleteTenant(id, force) {
        const tenant = await this.tenantRepo.findOne({ where: { id } });
        if (!tenant)
            throw new common_1.NotFoundException('Empresa no encontrada');
        return await this.dataSource.transaction(async (manager) => {
            const isForce = force === 'true';
            const tripsCount = await manager.count(carta_porte_entity_1.CartaPorte, { where: { tenantId: id } });
            if (tripsCount > 0 && !isForce) {
                throw new common_1.BadRequestException(`No se puede eliminar la empresa: tiene ${tripsCount} viajes registrados. Use 'force=true' para borrar todo o considere desactivarla.`);
            }
            await manager.save(audit_log_entity_1.AuditLog, {
                accion: 'BAJA_TENANT',
                descripcion: `Empresa eliminada: ${tenant.nombreEmpresa} (ID: ${id}) ${isForce ? '[FORCE DELETE]' : ''}`,
                resueltoPor: 'Sistema'
            });
            if (isForce) {
                const trips = await manager.find(carta_porte_entity_1.CartaPorte, { where: { tenantId: id } });
                const tripIds = trips.map(t => t.id);
                if (tripIds.length > 0) {
                    await manager.delete(gps_tracking_entity_1.GpsTracking, { cpId: (0, typeorm_2.In)(tripIds) });
                    await manager.delete(carta_porte_entity_1.CartaPorte, { tenantId: id });
                }
            }
            await manager.delete(user_entity_1.User, { tenantId: id });
            await manager.delete(wallet_balance_entity_1.WalletBalance, { tenantId: id });
            await manager.delete(tenant_pricing_entity_1.TenantPricing, { tenantId: id });
            await manager.delete(pricing_rule_entity_1.PricingRule, { tenantId: id });
            await manager.delete(driver_entity_1.Driver, { tenantId: id });
            await manager.delete(transport_unit_entity_1.TransportUnit, { tenantId: id });
            await manager.delete(client_entity_1.Client, { tenantId: id });
            await manager.delete(tenant_entity_1.Tenant, { id });
            return { success: true, message: `Empresa ${tenant.nombreEmpresa} eliminada correctamente${isForce ? ' incluyendo todo su historial.' : '.'}` };
        });
    }
    async resetSystem(body) {
        if (body.confirmation !== 'RESETEAR SISTEMA TOTAL') {
            throw new common_1.BadRequestException('Confirmación inválida para el reset del sistema.');
        }
        console.log('!!! INICIANDO RESET TOTAL DEL SISTEMA !!!');
        return await this.dataSource.transaction(async (manager) => {
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
                }
                catch (e) {
                    console.warn(`Error al borrar ${table} (ignorando):`, e.message);
                }
            }
            try {
                console.log('Borrando usuarios (excepto admin@adt.com)...');
                await manager.query("DELETE FROM users WHERE email NOT IN ('admin@adt.com')");
            }
            catch (e) {
                console.warn('Error al borrar users:', e.message);
            }
            try {
                console.log('Borrando tenants...');
                await manager.query('DELETE FROM tenants');
            }
            catch (e) {
                console.warn('Error al borrar tenants:', e.message);
            }
            console.log('!!! RESET TOTAL COMPLETADO !!!');
            return { success: true, message: 'Sistema restaurado a cero satisfactoriamente.' };
        });
    }
    async getClients(tenantId) {
        const isGlobal = !tenantId || tenantId === 'null' || tenantId === 'undefined';
        try {
            const pricing = !isGlobal ? await this.pricingRepo.findOne({ where: { tenantId }, order: { fechaDesde: 'DESC' } }) : null;
            const query = this.dataSource.getRepository(client_entity_1.Client).createQueryBuilder('client').leftJoin(wallet_balance_entity_1.WalletBalance, 'wallet', 'wallet.clientId = client.id AND wallet.tenantId = client.tenantId').select(['client.id AS id', 'client.nombreRazonSocial AS nombreRazonSocial', 'client.email AS email', 'client.notify_new_trip AS notifyNewTrip', 'client.notify_settlement AS notifySettlement', 'client.asunto_clave AS asuntoClave', 'ISNULL(wallet.saldo_creditos, 0) AS saldoCreditos']);
            if (!isGlobal)
                query.where('client.tenantId = :tenantId', { tenantId });
            const rawClients = await query.getRawMany();
            return Promise.all(rawClients.map(async (c) => {
                const userCount = await this.userRepo.count({ where: { clientId: c.id, role: user_entity_1.UserRole.CLIENT } });
                return { ...c, hasUser: userCount > 0, precioPorCp: Number(pricing?.precioCp || 0), monedaPreferida: pricing?.moneda || 'ARS', saldoCreditos: Number(c.saldoCreditos || 0) };
            }));
        }
        catch (e) {
            return [];
        }
    }
    async createClient(body) {
        const client = this.clientRepo.create(body);
        return this.clientRepo.save(client);
    }
    async updateClient(id, body) {
        const client = await this.clientRepo.findOne({ where: { id } });
        if (!client)
            throw new common_1.NotFoundException();
        Object.assign(client, body);
        return this.clientRepo.save(client);
    }
    async emptyClient(id, body) {
        if (body.secret !== 'ADT_CONFIRM_DELETE') {
            throw new common_1.BadRequestException('Secreto de confirmación inválido');
        }
        const client = await this.clientRepo.findOne({ where: { id } });
        if (!client)
            throw new common_1.NotFoundException('Dador de carga no encontrado');
        console.log(`[EMPTY CLIENT] Iniciando limpieza total para dador: ${client.nombreRazonSocial} (${id})`);
        return await this.dataSource.transaction(async (manager) => {
            const trips = await manager.query(`SELECT id, revenue_at_execution as revenueAtExecution, precio_congelado as precioCongelado, es_credito as esCredito, monto_upcharge as montoUpcharge, estado FROM cartas_de_porte WHERE client_id = '${id}'`);
            let debtToSubtract = 0;
            for (const t of trips) {
                if (t.esCredito) {
                    debtToSubtract += Number(t.montoUpcharge || 0);
                }
                else {
                    debtToSubtract += Number(t.precioCongelado || 0);
                }
            }
            if (debtToSubtract > 0) {
                console.log(`[EMPTY CLIENT] Restando $${debtToSubtract} de la deuda del tenant.`);
                const tenant = await manager.findOne(tenant_entity_1.Tenant, { where: { id: client.tenantId } });
                if (tenant) {
                    tenant.deudaActual = Math.max(0, Number(tenant.deudaActual || 0) - debtToSubtract);
                    await manager.save(tenant);
                }
            }
            const tripIds = trips.map(t => t.id);
            if (tripIds.length > 0) {
                console.log(`[EMPTY CLIENT] Procesando ${tripIds.length} viajes para dador ${id}`);
                await manager.query(`UPDATE cartas_de_porte SET payment_lot_id = NULL, settlement_id = NULL, financial_lot_id = NULL WHERE id IN (${tripIds.map(id => `'${id}'`).join(',')})`);
                console.log(`[EMPTY CLIENT] Borrando tracks asociados...`);
                await manager.query(`DELETE FROM gps_tracking WHERE cp_id IN (${tripIds.map(tid => `'${tid}'`).join(',')})`);
                console.log(`[EMPTY CLIENT] Borrando viajes (cartas_de_porte)...`);
                await manager.query(`DELETE FROM cartas_de_porte WHERE id IN (${tripIds.map(tid => `'${tid}'`).join(',')})`);
            }
            console.log(`[EMPTY CLIENT] Borrando registros periféricos del dador ${id}`);
            try {
                await manager.query(`DELETE FROM financial_lotes WHERE client_id = '${id}'`);
                await manager.query(`DELETE FROM settlement_batches WHERE entity_id = '${id}' AND entity_type = 'DADOR'`);
                await manager.query(`DELETE FROM travel_credits WHERE client_id = '${id}'`);
                if (tripIds.length > 0) {
                    await manager.query(`DELETE FROM adt_credits WHERE viaje_original_id IN (${tripIds.map(tid => `'${tid}'`).join(',')})`);
                }
                await manager.query(`DELETE FROM pricing_rules WHERE entity_id = '${id}' AND entity_type = 'DADOR'`);
                await manager.query(`DELETE FROM client_authorized_emails WHERE client_id = '${id}'`);
                await manager.query(`UPDATE billetera_saldos SET saldo_creditos = 0 WHERE client_id = '${id}'`);
                await manager.query(`DELETE FROM users WHERE client_id = '${id}' AND role = 'CLIENT'`);
                console.log(`[EMPTY CLIENT] Vaciado de registros periféricos para ${id} OK.`);
            }
            catch (e) {
                console.error(`[EMPTY CLIENT] FALLO EN SQL NATIVO:`, e.message);
                throw e;
            }
            console.log(`[EMPTY CLIENT] Vaciado de ${client.nombreRazonSocial} completado con éxito.`);
            await manager.save(audit_log_entity_1.AuditLog, {
                accion: 'VACIAR_DADOR',
                descripcion: `VACIADO TOTAL EFECTIVO (Nativo) para ${client.nombreRazonSocial}. Deuda descontada: $${debtToSubtract}`,
                tenantId: client.tenantId,
                resueltoPor: 'Admin',
                dataNueva: JSON.stringify({ clientId: id, tripsRemoved: tripIds.length })
            });
            return { success: true, message: `Historial de ${client.nombreRazonSocial} vaciado completamente con éxito.` };
        }).catch(err => {
            console.error('[EMPTY CLIENT] FALLO CRÍTICO EN OPERACIÓN ROBUSTA:', err);
            throw new common_1.BadRequestException(`No se pudo completar el vaciado robusto: ${err.message}`);
        });
    }
    async getPricingRules(tenantId, entityId) {
        return this.dataSource.getRepository(pricing_rule_entity_1.PricingRule).find({ where: { tenantId, entityId }, order: { validFrom: 'DESC' } });
    }
    async createPricingRule(body) {
        const repo = this.dataSource.getRepository(pricing_rule_entity_1.PricingRule);
        const rule = repo.create({ tenantId: body.tenantId, entityId: body.entityId, entityType: body.entityType, baseCalculation: body.baseCalculation, baseValue: Number(body.baseValue), conditionals: body.conditionals || [], validFrom: body.validFrom || new Date() });
        const saved = await repo.save(rule);
        await this.pricingEngine.recalculatePendingTrips(body.tenantId, body.entityId, body.entityType);
        return saved;
    }
    async simulatePricingImpact(proposal) {
        return this.pricingEngine.simulateImpact(proposal);
    }
    async forceDeletePricingRule(id, role) {
        console.log(`[FORCE DELETE] Solicitado borrado de tarifa ${id} por ${role}`);
        if (role !== 'SUPER_ADMIN')
            throw new common_1.BadRequestException('Privilegios insuficientes');
        await this.pricingEngine.deleteRule(id, role);
        return { success: true };
    }
    async getDrivers(tenantId) {
        const where = (!tenantId || tenantId === 'null' || tenantId === 'undefined') ? {} : { tenantId };
        const drivers = await this.driverRepo.find({ where, order: { nombre: 'ASC' } });
        return Promise.all(drivers.map(async (d) => {
            const pricing = await this.dataSource.getRepository(pricing_rule_entity_1.PricingRule).findOne({ where: { entityId: d.id, entityType: 'CHOFER' }, order: { validFrom: 'DESC' } });
            return { ...d, precioPorViaje: pricing?.baseValue || 0 };
        }));
    }
    async getUnits(tenantId) {
        const where = (!tenantId || tenantId === 'null' || tenantId === 'undefined') ? {} : { tenantId };
        return this.unitRepo.find({ where, order: { patente: 'ASC' } });
    }
    async getStats(tenantId) {
        const where = tenantId ? { tenantId } : {};
        const [trips, clients, drivers, units] = await Promise.all([
            this.tripsRepo.count({ where }),
            this.clientRepo.count({ where }),
            this.driverRepo.count({ where }),
            this.unitRepo.count({ where })
        ]);
        return { trips, clients, drivers, units };
    }
    async getSettlementsV2(tenantId, entityType, month, year) {
        if (!tenantId)
            throw new common_1.BadRequestException('tenantId is required');
        const m = parseInt(month);
        const y = parseInt(year);
        const legacyBatches = await this.batchRepo.find({
            where: { tenantId, entityType }
        });
        let newLots = [];
        if (entityType === 'CHOFER') {
            newLots = await this.paymentLotRepo.find({
                where: { tenantId },
                relations: ['chofer']
            });
        }
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
                periodStart: l.createdAt,
                periodEnd: l.createdAt,
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
    async getCreditsHistory(tenantId, month, year) {
        if (!tenantId)
            throw new common_1.BadRequestException('tenantId is required');
        const m = parseInt(month);
        const y = parseInt(year);
        const credits = await this.creditsRepo.find({
            where: { tenantId },
            relations: ['tenant']
        });
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
                cantidadCreditos: 1,
                montoPagado: Number(c.precioPagadoNominal || 0),
                aprobado: true,
                referenciaPago: 'Recarga de Saldo / Cancelación'
            };
        });
        return items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }
    async getBillingAudit(tenantId) {
        if (!tenantId)
            throw new common_1.BadRequestException('tenantId is required');
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
            }
            else {
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
    async getClientAdminInfo(id) {
        return this.userRepo.find({
            where: { clientId: id, role: user_entity_1.UserRole.CLIENT },
            select: ['id', 'email', 'nombreCompleto', 'mustChangePassword']
        });
    }
    async createClientUser(id, body) {
        const client = await this.clientRepo.findOne({ where: { id } });
        if (!client)
            throw new common_1.NotFoundException('Cliente no encontrado');
        const passwordHash = await bcrypt.hash('ADT-321', 10);
        const user = this.userRepo.create({
            email: body.email,
            nombreCompleto: body.nombreCompleto || client.nombreRazonSocial,
            passwordHash,
            role: user_entity_1.UserRole.CLIENT,
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
        if (!tenant)
            throw new common_1.NotFoundException('Empresa no encontrada');
        const sent = await this.notificationsService.sendEmail(body.email, 'Accesos al Portal ADT', html, tenant || undefined);
        if (!sent) {
            throw new common_1.BadRequestException('Error al enviar el email. Verifique la configuración SMTP.');
        }
        return saved;
    }
    async updateUserEmail(userId, body) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        user.email = body.email;
        return this.userRepo.save(user);
    }
    async resendCredentials(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        const passwordHash = await bcrypt.hash('ADT-321', 10);
        user.passwordHash = passwordHash;
        user.mustChangePassword = true;
        await this.userRepo.save(user);
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
            throw new common_1.BadRequestException('Error al enviar el email. Verifique la configuración SMTP.');
        }
        return { success: true, message: `Credenciales re-enviadas a ${user.email}` };
    }
    async sendClientCredentials(id) {
        const client = await this.clientRepo.findOne({ where: { id } });
        if (!client)
            throw new common_1.NotFoundException('Dador de carga no encontrado');
        const user = await this.userRepo.findOne({
            where: { clientId: id, role: user_entity_1.UserRole.CLIENT }
        });
        if (!user) {
            throw new common_1.BadRequestException('Este dador no tiene un usuario de acceso creado. Por favor, créelo desde el botón Acceso.');
        }
        const passwordHash = await bcrypt.hash('ADT-321', 10);
        user.passwordHash = passwordHash;
        user.mustChangePassword = true;
        await this.userRepo.save(user);
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
            throw new common_1.BadRequestException('Error al enviar el email. Si usa Gmail, verifique que use "Contraseña de Aplicación". Más detalles en Errores de Apps.');
        }
        return { success: true, message: `Credenciales enviadas a ${recipientEmail} con éxito.` };
    }
    async getAuthorizedEmails(clientId) {
        return this.dataSource.getRepository(client_authorized_email_entity_1.ClientAuthorizedEmail).find({
            where: { clientId }
        });
    }
    async addAuthorizedEmail(body) {
        const repo = this.dataSource.getRepository(client_authorized_email_entity_1.ClientAuthorizedEmail);
        const authEmail = repo.create({
            clientId: body.clientId,
            emailAutorizado: body.email,
            asuntoClave: body.asunto || 'SOLICITUD VIAJE'
        });
        return repo.save(authEmail);
    }
    async deleteAuthorizedEmail(id) {
        await this.dataSource.getRepository(client_authorized_email_entity_1.ClientAuthorizedEmail).delete(id);
        return { success: true };
    }
    async updateClientSubject(id, body) {
        const client = await this.clientRepo.findOne({ where: { id } });
        if (!client)
            throw new common_1.NotFoundException('Cliente no encontrado');
        client.asuntoClave = body.asunto.toUpperCase();
        return this.clientRepo.save(client);
    }
    async getTenantAdminInfo(id) {
        const user = await this.userRepo.findOne({
            where: { tenantId: id, role: user_entity_1.UserRole.TENANT_ADMIN }
        });
        if (!user)
            throw new common_1.NotFoundException('Administrador no encontrado');
        return { nombre: user.nombreCompleto, email: user.email };
    }
    async toggleTenantStatus(id) {
        const tenant = await this.tenantRepo.findOne({ where: { id } });
        if (!tenant)
            throw new common_1.NotFoundException('Empresa no encontrada');
        tenant.activo = !tenant.activo;
        return this.tenantRepo.save(tenant);
    }
    async resetTenantPassword(id) {
        const user = await this.userRepo.findOne({
            where: { tenantId: id, role: user_entity_1.UserRole.TENANT_ADMIN }
        });
        if (!user)
            throw new common_1.NotFoundException('Administrador no encontrado');
        const tempPass = 'ADT-TEMP-' + Math.floor(1000 + Math.random() * 9000);
        user.passwordHash = await bcrypt.hash(tempPass, 10);
        user.mustChangePassword = true;
        await this.userRepo.save(user);
        return { email: user.email, temporaryPassword: tempPass };
    }
    async updateTenantAdmin(id, body) {
        const user = await this.userRepo.findOne({
            where: { tenantId: id, role: user_entity_1.UserRole.TENANT_ADMIN }
        });
        if (!user)
            throw new common_1.NotFoundException('Administrador no encontrado');
        user.nombreCompleto = body.nombre;
        user.email = body.email;
        return this.userRepo.save(user);
    }
    async sendTenantCredentials(id) {
        const tenant = await this.tenantRepo.findOne({ where: { id } });
        if (!tenant)
            throw new common_1.NotFoundException('Empresa no encontrada');
        const user = await this.userRepo.findOne({
            where: { tenantId: id, role: user_entity_1.UserRole.TENANT_ADMIN }
        });
        if (!user)
            throw new common_1.NotFoundException('Administrador no encontrado');
        const tempPass = 'ADT-321';
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
            throw new common_1.BadRequestException('El sistema no pudo enviar el email. Si usa Gmail, verifique que esté usando una "Contraseña de Aplicación". Más info en Errores de Apps.');
        }
        return { success: true, message: `Credenciales enviadas a ${user.email} con éxito.` };
    }
    async cleanupTenantData(body) {
        if (body.secret !== 'ADT_CONFIRM_DELETE') {
            throw new common_1.BadRequestException('Secreto de confirmación inválido');
        }
        const tenant = await this.tenantRepo.findOne({ where: { id: body.tenantId } });
        if (!tenant)
            throw new common_1.NotFoundException('Empresa no encontrada');
        return await this.dataSource.transaction(async (manager) => {
            const tenantId = body.tenantId;
            await manager.delete(gps_tracking_entity_1.GpsTracking, { cpId: (0, typeorm_2.In)(await manager.find(carta_porte_entity_1.CartaPorte, { where: { tenantId }, select: ['id'] }).then(ts => ts.map(t => t.id))) });
            await manager.delete(carta_porte_entity_1.CartaPorte, { tenantId });
            await manager.delete(settlement_batch_entity_1.SettlementBatch, { tenantId });
            await manager.delete(payment_lot_entity_1.PaymentLot, { tenantId });
            await manager.delete(audit_log_entity_1.AuditLog, { tenantId });
            return { success: true, message: `Datos operativos de ${tenant.nombreEmpresa} eliminados.` };
        });
    }
    async getPendingTrips(tenantId) {
        return this.tripsRepo.find({
            where: { tenantId, pagoConfirmado: false },
            relations: ['client'],
            order: { tsCreacion: 'DESC' }
        });
    }
    async recordPayment(tenantId, body) {
        const { tripIds, monto, referencia, metodo, adminName } = body;
        return await this.dataSource.transaction(async (manager) => {
            const payment = manager.create(tenant_payment_entity_1.TenantPayment, {
                tenantId,
                monto: Number(monto),
                referencia,
                metodoPago: metodo,
                registradoPor: adminName
            });
            const savedPayment = await manager.save(payment);
            if (tripIds && tripIds.length > 0) {
                await manager.update(carta_porte_entity_1.CartaPorte, { id: (0, typeorm_2.In)(tripIds) }, { pagoConfirmado: true, batchCobroId: savedPayment.id });
            }
            const tenant = await manager.findOne(tenant_entity_1.Tenant, { where: { id: tenantId } });
            if (tenant) {
                tenant.deudaActual = Math.max(0, Number(tenant.deudaActual || 0) - Number(monto));
                await manager.save(tenant);
            }
            return savedPayment;
        });
    }
    async deletePayment(paymentId) {
        return await this.dataSource.transaction(async (manager) => {
            const payment = await manager.findOne(tenant_payment_entity_1.TenantPayment, { where: { id: paymentId } });
            if (!payment)
                throw new common_1.NotFoundException('Pago no encontrado');
            await manager.update(carta_porte_entity_1.CartaPorte, { batchCobroId: paymentId }, { pagoConfirmado: false, batchCobroId: null });
            const tenant = await manager.findOne(tenant_entity_1.Tenant, { where: { id: payment.tenantId } });
            if (tenant) {
                tenant.deudaActual = Number(tenant.deudaActual || 0) + Number(payment.monto);
                await manager.save(tenant);
            }
            await manager.delete(tenant_payment_entity_1.TenantPayment, { id: paymentId });
            return { success: true };
        });
    }
    async sendSettlement(tenantId, month, year) {
        const m = parseInt(month);
        const y = parseInt(year);
        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        if (!tenant)
            throw new common_1.NotFoundException('Empresa no encontrada');
        if (!tenant.telegramChatId) {
            throw new common_1.BadRequestException('La empresa no tiene configurado un ID de Telegram para notificaciones.');
        }
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
    async getIncomingRequests(tenantId) {
        if (!tenantId)
            throw new common_1.BadRequestException('tenantId is required');
        return this.tripsRepo.find({
            where: {
                tenantId,
                estado: update_trip_status_dto_1.TripStatus.PENDING_CONFIRMATION
            },
            relations: ['client'],
            order: { tsCreacion: 'DESC' }
        });
    }
    async getEmailLogs(tenantId) {
        if (!tenantId)
            throw new common_1.BadRequestException('tenantId is required');
        return this.dataSource.getRepository(email_ingestion_log_entity_1.EmailIngestionLog).find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
            take: 20
        });
    }
    async triggerIngestion(tenantId) {
        if (!tenantId)
            throw new common_1.BadRequestException('tenantId is required');
        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        if (!tenant)
            throw new common_1.BadRequestException('Tenant not found');
        const oneHourAgo = new Date(Date.now() - 3600 * 1000);
        await this.emailIngestionService.processEmailsForTenant(tenant, { since: oneHourAgo });
        return { message: 'Ingesta finalizada (última 1 hora). Revisa los email-logs.' };
    }
    async processAiCopilot(body, req) {
        const { userInput, tenantId } = body;
        const user = req.user;
        if (!userInput || !tenantId)
            throw new common_1.BadRequestException('userInput and tenantId are required');
        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        let clientName = null;
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
        return await this.aiExtractorService.processFinanceCopilot(userInput, context, tenant.geminiApiKey);
    }
    async getPwaLogs() {
        return this.dataSource.getRepository(app_log_entity_1.AppLog).find({
            order: { timestamp: 'DESC' },
            take: 100
        });
    }
    async getAudits(tenantId) {
        if (!tenantId)
            throw new common_1.BadRequestException('tenantId is required');
        return this.auditRepo.find({
            where: { tenantId },
            order: { fecha: 'DESC' },
            take: 100
        });
    }
    async getSystemLogs() {
        return this.getPwaLogs();
    }
    async getServerPm2Logs(type = 'error', role) {
        if (role !== 'SUPER_ADMIN')
            throw new common_1.BadRequestException('Acceso denegado');
        const logFileName = type === 'error' ? 'sistema-adt-error.log' : 'sistema-adt-out.log';
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
                    const stats = fs.statSync(p);
                    const start = Math.max(0, stats.size - (50 * 1024));
                    const buffer = Buffer.alloc(stats.size - start);
                    const fd = fs.openSync(p, 'r');
                    fs.readSync(fd, buffer, 0, buffer.length, start);
                    fs.closeSync(fd);
                    logContent = buffer.toString('utf8');
                    break;
                }
                catch (e) {
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
};
exports.ManagementController = ManagementController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('trips'),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('estado')),
    __param(2, (0, common_1.Query)('choferId')),
    __param(3, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "findAllTrips", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('public/web-contact'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "publicContact", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('system-config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getSystemConfig", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('system-config'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "updateSystemConfig", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tenants'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getTenants", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tenants/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getTenant", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('tenants'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "createTenant", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('tenants/:id/update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "updateTenant", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tenants/:id/payments'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getTenantPayments", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('tenants/:id/delete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('force')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "deleteTenant", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('system/reset'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "resetSystem", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('clients'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getClients", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('clients'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "createClient", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Patch)('clients/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "updateClient", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('clients/:id/empty'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "emptyClient", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('pricing/rules'),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('entityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getPricingRules", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('pricing/rules'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "createPricingRule", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('pricing/simulate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "simulatePricingImpact", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Delete)('force-delete-pricing/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "forceDeletePricingRule", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('drivers'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getDrivers", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('units'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getUnits", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getStats", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('finance/settlements-v2'),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('entityType')),
    __param(2, (0, common_1.Query)('month')),
    __param(3, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getSettlementsV2", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('credits/history'),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getCreditsHistory", null);
__decorate([
    (0, common_1.Get)('billing-audit'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getBillingAudit", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('clients/:id/admin-info'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getClientAdminInfo", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('clients/:id/create-user'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "createClientUser", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Patch)('users/:userId/email'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "updateUserEmail", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('users/:userId/resend-credentials'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "resendCredentials", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('clients/:id/send-credentials'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "sendClientCredentials", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('authorized-emails'),
    __param(0, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getAuthorizedEmails", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('authorized-emails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "addAuthorizedEmail", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Delete)('authorized-emails/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "deleteAuthorizedEmail", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('clients/:id/update-subject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "updateClientSubject", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tenants/:id/admin-info'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getTenantAdminInfo", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('tenants/:id/toggle-status'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "toggleTenantStatus", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('tenants/:id/reset-password'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "resetTenantPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('tenants/:id/admin-update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "updateTenantAdmin", null);
__decorate([
    (0, common_1.Post)('tenants/:id/send-credentials'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "sendTenantCredentials", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('cleanup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "cleanupTenantData", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tenants/:tenantId/pending-trips'),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getPendingTrips", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('tenants/:tenantId/record-payment'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "recordPayment", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Delete)('payments/:paymentId'),
    __param(0, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "deletePayment", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('tenants/:tenantId/send-settlement'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "sendSettlement", null);
__decorate([
    (0, common_1.Get)('trips/incoming-requests'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getIncomingRequests", null);
__decorate([
    (0, common_1.Get)('email-logs'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getEmailLogs", null);
__decorate([
    (0, common_1.Post)('ingest-emails'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "triggerIngestion", null);
__decorate([
    (0, common_1.Post)('ai/copilot'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "processAiCopilot", null);
__decorate([
    (0, common_1.Get)('pwa-logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getPwaLogs", null);
__decorate([
    (0, common_1.Get)('audits'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getAudits", null);
__decorate([
    (0, common_1.Get)('logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getSystemLogs", null);
__decorate([
    (0, common_1.Get)('server-pm2-logs'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ManagementController.prototype, "getServerPm2Logs", null);
exports.ManagementController = ManagementController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('management'),
    __param(0, (0, typeorm_1.InjectRepository)(carta_porte_entity_1.CartaPorte)),
    __param(1, (0, typeorm_1.InjectRepository)(gps_tracking_entity_1.GpsTracking)),
    __param(2, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(3, (0, typeorm_1.InjectRepository)(transport_unit_entity_1.TransportUnit)),
    __param(4, (0, typeorm_1.InjectRepository)(driver_entity_1.Driver)),
    __param(5, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __param(6, (0, typeorm_1.InjectRepository)(tenant_pricing_entity_1.TenantPricing)),
    __param(7, (0, typeorm_1.InjectRepository)(travel_credit_entity_1.TravelCredit)),
    __param(8, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __param(9, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(10, (0, typeorm_1.InjectRepository)(tenant_payment_entity_1.TenantPayment)),
    __param(11, (0, typeorm_1.InjectRepository)(wallet_balance_entity_1.WalletBalance)),
    __param(12, (0, typeorm_1.InjectRepository)(system_config_entity_1.SystemConfig)),
    __param(13, (0, typeorm_1.InjectRepository)(settlement_batch_entity_1.SettlementBatch)),
    __param(14, (0, typeorm_1.InjectRepository)(payment_lot_entity_1.PaymentLot)),
    __param(15, (0, typeorm_1.InjectRepository)(adt_credit_entity_1.AdtCredit)),
    __param(16, (0, typeorm_1.InjectRepository)(adt_recaudacion_entity_1.AdtRecaudacion)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        trips_service_1.TripsService,
        pricing_engine_service_1.PricingEngineService,
        financial_reporting_service_1.FinancialReportingService,
        ai_extractor_service_1.AiExtractorService,
        notifications_service_1.NotificationsService,
        telegram_service_1.TelegramService,
        email_ingestion_service_1.EmailIngestionService,
        typeorm_2.DataSource])
], ManagementController);
//# sourceMappingURL=management.controller.js.map