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
exports.ClientsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const carta_porte_entity_1 = require("../database/entities/carta-porte.entity");
const gps_tracking_entity_1 = require("../database/entities/gps-tracking.entity");
const client_entity_1 = require("../database/entities/client.entity");
const public_decorator_1 = require("../auth/public.decorator");
const trips_service_1 = require("../trips/trips.service");
const client_create_trip_dto_1 = require("../trips/dto/client-create-trip.dto");
const update_trip_status_dto_1 = require("../trips/dto/update-trip-status.dto");
const platform_express_1 = require("@nestjs/platform-express");
const XLSX = __importStar(require("xlsx"));
let ClientsController = class ClientsController {
    tripsRepo;
    gpsRepo;
    clientRepo;
    tripsService;
    constructor(tripsRepo, gpsRepo, clientRepo, tripsService) {
        this.tripsRepo = tripsRepo;
        this.gpsRepo = gpsRepo;
        this.clientRepo = clientRepo;
        this.tripsService = tripsService;
    }
    async createTrip(clientId, dto) {
        if (!clientId)
            throw new common_1.UnauthorizedException('ClientId is required');
        const client = await this.clientRepo.findOne({ where: { id: clientId } });
        if (!client)
            throw new common_1.UnauthorizedException('Client not found');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const numeroCP = `REQ-${randomSuffix}-${Date.now().toString().slice(-4)}`;
        const trip = this.tripsRepo.create({
            ...dto,
            clientId,
            tenantId: client.tenantId,
            estado: update_trip_status_dto_1.TripStatus.SOLICITADO,
            numeroCP,
            cierreMotivo: 'Solicitado por Cliente'
        });
        return this.tripsRepo.save(trip);
    }
    async getTemplate(res) {
        const data = [
            { Origen: 'Planta Zarate', Destino: 'Puerto Rosario', Latitud_Destino: -32.9468, Longitud_Destino: -60.6393, Referencia: 'Carga Semillas A1' },
            { Origen: 'Deposito Central', Destino: 'Fabrica Cordoba', Latitud_Destino: -31.4135, Longitud_Destino: -64.1811, Referencia: 'Repuestos Maquinaria' }
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Viajes');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_viajes_adt.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    }
    async uploadTrips(clientId, file) {
        if (!clientId)
            throw new common_1.UnauthorizedException('ClientId is required');
        const client = await this.clientRepo.findOne({ where: { id: clientId } });
        if (!client)
            throw new common_1.UnauthorizedException('Client not found');
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        const trips = rows.map((row, idx) => {
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            return this.tripsRepo.create({
                origenNombre: row.Origen || 'No especificado',
                destinoNombre: row.Destino || 'No especificado',
                destinoLat: row.Latitud_Destino || 0,
                destinoLng: row.Longitud_Destino || 0,
                clientId,
                tenantId: client.tenantId,
                estado: update_trip_status_dto_1.TripStatus.SOLICITADO,
                numeroCP: `CP-MAS-${randomSuffix}-${idx + 1}`,
                cierreMotivo: row.Referencia || 'Carga Masiva'
            });
        });
        return this.tripsRepo.save(trips);
    }
    async getMyTrips(clientId) {
        if (!clientId)
            throw new common_1.UnauthorizedException('ClientId is required');
        return this.tripsRepo.find({
            where: { clientId },
            relations: ['unidad', 'chofer'],
            order: { tsCreacion: 'DESC' }
        });
    }
    async getTripTracking(id, clientId) {
        const trip = await this.tripsRepo.findOne({
            where: { id, clientId },
            relations: ['unidad']
        });
        if (!trip)
            throw new common_1.UnauthorizedException('Trip not found or access denied');
        let lastPing = await this.gpsRepo.findOne({
            where: { cpId: id },
            order: { timestampDispositivo: 'DESC' }
        });
        if (!lastPing && trip.unidadId) {
            const rawPings = await this.gpsRepo.query(`
                SELECT TOP 1 g.* FROM gps_tracking g
                INNER JOIN cartas_de_porte c ON g.cp_id = c.id
                WHERE c.unidad_id = @0
                ORDER BY g.timestamp_dispositivo DESC
            `, [trip.unidadId]);
            if (rawPings && rawPings.length > 0) {
                const rawPing = rawPings[0];
                lastPing = {
                    ...rawPing,
                    latitud: rawPing.latitud ?? rawPing.lat,
                    longitud: rawPing.longitud ?? rawPing.lng
                };
            }
        }
        const etaResult = await this.tripsService.calculateSmartEta(id);
        let smartEta = etaResult.etaMinutes;
        if ((smartEta <= 0 || smartEta === -1) && lastPing && trip.destinoLat && trip.destinoLng) {
            try {
                const distance = await this.tripsService.getDistance(Number(lastPing.latitud), Number(lastPing.longitud), Number(trip.destinoLat), Number(trip.destinoLng));
                let speed = Number(lastPing.velocidad) || 0;
                if (speed < 10)
                    speed = 40;
                const etaHours = (distance / 1000) / speed;
                smartEta = Math.round(etaHours * 60 * 1.25);
            }
            catch (e) {
                console.error('Error in fallback ETA calculation', e);
                smartEta = -1;
            }
        }
        const finalEta = smartEta > 0 ? this.applySmartFactors(smartEta) : smartEta;
        return {
            trip,
            lastLocation: lastPing ? {
                ...lastPing,
                latitud: parseFloat(String(lastPing.latitud)),
                longitud: parseFloat(String(lastPing.longitud))
            } : null,
            smartEtaMinutes: finalEta
        };
    }
    applySmartFactors(baseMinutes) {
        const hour = new Date().getHours();
        const isRushHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
        let multiplier = 1.0;
        if (isRushHour)
            multiplier += 0.2;
        return Math.round(baseMinutes * multiplier);
    }
};
exports.ClientsController = ClientsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('trips'),
    __param(0, (0, common_1.Query)('clientId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, client_create_trip_dto_1.ClientCreateTripDto]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "createTrip", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('template'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "getTemplate", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('trips/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Query)('clientId')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "uploadTrips", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('trips'),
    __param(0, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "getMyTrips", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('trips/:id/tracking'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "getTripTracking", null);
exports.ClientsController = ClientsController = __decorate([
    (0, common_1.Controller)('client-portal'),
    __param(0, (0, typeorm_1.InjectRepository)(carta_porte_entity_1.CartaPorte)),
    __param(1, (0, typeorm_1.InjectRepository)(gps_tracking_entity_1.GpsTracking)),
    __param(2, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        trips_service_1.TripsService])
], ClientsController);
//# sourceMappingURL=clients.controller.js.map