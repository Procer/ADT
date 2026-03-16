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
var TripClosureService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripClosureService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const carta_porte_entity_1 = require("../database/entities/carta-porte.entity");
const gps_tracking_entity_1 = require("../database/entities/gps-tracking.entity");
const trips_service_1 = require("./trips.service");
const schedule_1 = require("@nestjs/schedule");
let TripClosureService = TripClosureService_1 = class TripClosureService {
    tripsRepo;
    gpsRepo;
    tripsService;
    logger = new common_1.Logger(TripClosureService_1.name);
    constructor(tripsRepo, gpsRepo, tripsService) {
        this.tripsRepo = tripsRepo;
        this.gpsRepo = gpsRepo;
        this.tripsService = tripsService;
    }
    async handleAutoClosures() {
        this.logger.log('Running automatic trip closure check...');
        const activeTrips = await this.tripsRepo.find({
            where: [
                { estado: 'EN_CAMINO' },
                { estado: 'LLEGUE' },
                { estado: 'OPERANDO' }
            ]
        });
        for (const trip of activeTrips) {
            try {
                const lastPing = await this.gpsRepo.findOne({
                    where: { cpId: trip.id },
                    order: { timestampDispositivo: 'DESC' }
                });
                if (!lastPing)
                    continue;
                if (trip.destinoLat && trip.destinoLng) {
                    const distance = await this.tripsService.getDistance(Number(lastPing.latitud), Number(lastPing.longitud), Number(trip.destinoLat), Number(trip.destinoLng));
                    if (distance > 20000 && (trip.estado === 'LLEGUE' || trip.estado === 'OPERANDO')) {
                        this.logger.warn(`Auto-closing trip ${trip.numeroCP}: device is ${Math.round(distance / 1000)}km away from destination.`);
                        await this.tripsService.closeTrip(trip.id, 'AUTO_GEO');
                    }
                }
                const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
                if (new Date(lastPing.timestampDispositivo) < twelveHoursAgo) {
                    this.logger.warn(`Auto-closing trip ${trip.numeroCP} due to inactivity (last ping: ${lastPing.timestampDispositivo})`);
                    await this.tripsService.closeTrip(trip.id, 'AUTO_INACTIVITY');
                }
            }
            catch (error) {
                this.logger.error(`Error processing auto-closure for trip ${trip.id}: ${error.message}`);
            }
        }
    }
};
exports.TripClosureService = TripClosureService;
__decorate([
    (0, schedule_1.Cron)('0 */15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TripClosureService.prototype, "handleAutoClosures", null);
exports.TripClosureService = TripClosureService = TripClosureService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(carta_porte_entity_1.CartaPorte)),
    __param(1, (0, typeorm_1.InjectRepository)(gps_tracking_entity_1.GpsTracking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        trips_service_1.TripsService])
], TripClosureService);
//# sourceMappingURL=trip-closure.service.js.map