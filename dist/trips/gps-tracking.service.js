"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GpsTrackingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gps_tracking_entity_1 = require("../database/entities/gps-tracking.entity");
const carta_porte_entity_1 = require("../database/entities/carta-porte.entity");
const gps_gateway_1 = require("./gps.gateway");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const trips_service_1 = require("./trips.service");
const telegram_service_1 = require("../management/telegram.service");
const update_trip_status_dto_1 = require("./dto/update-trip-status.dto");
let GpsTrackingService = class GpsTrackingService {
    gpsRepo;
    tripsRepo;
    gpsGateway;
    tripsService;
    gpsQueue;
    telegramService;
    constructor(gpsRepo, tripsRepo, gpsGateway, tripsService, gpsQueue, telegramService) {
        this.gpsRepo = gpsRepo;
        this.tripsRepo = tripsRepo;
        this.gpsGateway = gpsGateway;
        this.tripsService = tripsService;
        this.gpsQueue = gpsQueue;
        this.telegramService = telegramService;
    }
    async recordPing(dto) {
        const { cpId, lat, lng } = dto;
        const trip = await this.tripsRepo.findOne({
            where: { id: cpId },
            relations: ['unidad']
        });
        if (!trip)
            throw new common_1.NotFoundException(`Trip with ID ${cpId} not found`);
        this.gpsGateway.emitGpsPing({
            cpId,
            lat,
            lng,
            patente: trip.unidad?.patente,
            estado: trip.estado,
        });
        await this.gpsQueue.add('ping-job', dto);
        return { status: 'queued' };
    }
    async processPingFromQueue(data) {
        const { cpId, lat, lng, velocidad, timestamp, tipo_registro, evento_manual, cierre_interno_disparado } = data;
        const trip = await this.tripsRepo.findOne({
            where: { id: cpId },
            relations: ['chofer', 'unidad']
        });
        if (!trip)
            throw new Error(`Trip ${cpId} not found in background processor`);
        if (velocidad > 90) {
            const admin = await this.tripsService.getTenantAdmin(trip.tenantId);
            if (admin?.telegramChatId) {
                const msgAdmin = `🚩 *EXCESO DE VELOCIDAD DETECTADO*\n` +
                    `Chofer: ${trip.chofer?.nombre}\n` +
                    `Unidad: ${trip.unidad?.patente}\n` +
                    `Velocidad: *${Math.round(velocidad)} km/h*\n` +
                    `Viaje: ${trip.numeroCP}\n` +
                    `Ubicación: [Ver en Mapa](https://www.google.com/maps?q=${lat},${lng})`;
                await this.telegramService.sendMessage(admin.telegramChatId, msgAdmin);
            }
            await this.tripsService.createAuditLog({
                tenantId: trip.tenantId,
                accion: 'ALERTA_VELOCIDAD',
                descripcion: `Exceso de velocidad: ${Math.round(velocidad)} km/h - Chofer: ${trip.chofer?.nombre} - Unidad: ${trip.unidad?.patente}`,
                dataNueva: JSON.stringify({ tripId: trip.id, velocidad, lat, lng })
            });
        }
        let distanceToDest = 0;
        if (trip.destinoLat && trip.destinoLng) {
            distanceToDest = await this.tripsService.getDistance(lat, lng, Number(trip.destinoLat), Number(trip.destinoLng));
            if (distanceToDest < (trip.radioGeocercaKm * 1000)) {
                if (!trip.reachedDestination) {
                    trip.reachedDestination = true;
                    if (trip.estado === update_trip_status_dto_1.TripStatus.IN_PROGRESS || trip.estado === update_trip_status_dto_1.TripStatus.LLEGUE || trip.estado === update_trip_status_dto_1.TripStatus.CARGA_DESCARGA) {
                        trip.estado = update_trip_status_dto_1.TripStatus.ENTREGADO;
                    }
                    await this.tripsRepo.save(trip);
                }
            }
            if (trip.estado === update_trip_status_dto_1.TripStatus.IN_PROGRESS && (cierre_interno_disparado || distanceToDest > 10000)) {
                if (!trip.tsCierreInterno) {
                    trip.cierreMotivo = 'AUTO_GEO_ALEJAMIENTO';
                    trip.tsCierreInterno = new Date();
                }
            }
        }
        const ping = this.gpsRepo.create({
            cpId,
            latitud: lat,
            longitud: lng,
            velocidad: velocidad || 0,
            timestampDispositivo: new Date(timestamp),
            tipoRegistro: tipo_registro || 'AUTOMATICO',
            eventoManual: evento_manual || null,
            cierreInternoDisparado: cierre_interno_disparado || false,
            distanciaDestinoMetros: distanceToDest
        });
        return this.gpsRepo.save(ping);
    }
};
exports.GpsTrackingService = GpsTrackingService;
exports.GpsTrackingService = GpsTrackingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gps_tracking_entity_1.GpsTracking)),
    __param(1, (0, typeorm_1.InjectRepository)(carta_porte_entity_1.CartaPorte)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => trips_service_1.TripsService))),
    __param(4, (0, bullmq_1.InjectQueue)('gps-ping-queue')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        gps_gateway_1.GpsGateway,
        trips_service_1.TripsService,
        bullmq_2.Queue,
        telegram_service_1.TelegramService])
], GpsTrackingService);
//# sourceMappingURL=gps-tracking.service.js.map