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
exports.TripsController = void 0;
const common_1 = require("@nestjs/common");
const trips_service_1 = require("./trips.service");
const create_trip_dto_1 = require("./dto/create-trip.dto");
const update_trip_status_dto_1 = require("./dto/update-trip-status.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const public_decorator_1 = require("../auth/public.decorator");
const gps_tracking_service_1 = require("./gps-tracking.service");
const create_gps_ping_dto_1 = require("./dto/create-gps-ping.dto");
const platform_express_1 = require("@nestjs/platform-express");
const express = __importStar(require("express"));
let TripsController = class TripsController {
    tripsService;
    gpsService;
    constructor(tripsService, gpsService) {
        this.tripsService = tripsService;
        this.gpsService = gpsService;
    }
    async getMonthlyReport(month, year, format, req, res) {
        const tenantId = req.user?.tenantId;
        const { buffer, filename, mimeType } = await this.tripsService.generateMonthlyReportBuffer(tenantId, month, year, format);
        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
    bulkImport(file, req) {
        return this.tripsService.importBulkFromExcel(req.user.tenantId, file.buffer);
    }
    create(createTripDto, req) {
        const tenantId = (req.user && req.user.role === 'SUPER_ADMIN')
            ? (createTripDto.tenantId || req.user.tenantId)
            : (req.user ? req.user.tenantId : createTripDto.tenantId);
        return this.tripsService.create({ ...createTripDto, tenantId });
    }
    recordPing(dto) {
        return this.gpsService.recordPing(dto);
    }
    updateStatus(id, dto, req) {
        return this.tripsService.updateStatus(id, dto, req.user?.role);
    }
    findActiveByDriver(req) {
        return this.tripsService.findActiveByDriver(req.user.userId);
    }
    getQueue(req) {
        return this.tripsService.getDriverQueue(req.user.userId);
    }
    async getStats(tenantId, choferId, clientId, period = 'ALL') {
        return this.tripsService.calculateStats(tenantId, { choferId, clientId, period });
    }
    findAll(queryTenantId, choferId, clientId, cp, req) {
        let tenantId = queryTenantId;
        if (req.user) {
            tenantId = req.user.role === 'SUPER_ADMIN' ? (queryTenantId || req.user.tenantId) : req.user.tenantId;
        }
        return this.tripsService.findAll(tenantId, { choferId, clientId, cp });
    }
    update(id, dto, req) {
        return this.tripsService.update(id, dto, req.user?.role);
    }
    cancel(id, body, req) {
        return this.tripsService.updateStatus(id, {
            estado: update_trip_status_dto_1.TripStatus.VOID_CREDIT,
            comentario: body.comentario
        }, req.user?.role);
    }
    async deletePricingRule(id, role) {
        console.log(`[TRIPS CONTROLLER] Eliminando tarifa ID: ${id} solicitado por ${role}`);
        return this.tripsService.deletePricingRule(id, role);
    }
    getHistory(id) {
        return this.tripsService.getHistory(id);
    }
    remove(id, req) {
        return this.tripsService.remove(id, req.user?.role);
    }
    async geocode(q) {
        try {
            const axios = require('axios');
            const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: { format: 'json', q, limit: 5, countrycodes: 'ar' },
                headers: { 'User-Agent': 'ADT-App/1.0' }
            });
            return res.data;
        }
        catch (e) {
            return [];
        }
    }
};
exports.TripsController = TripsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('monthly-report'),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, common_1.Request)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, Object, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getMonthlyReport", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('bulk-import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_trip_dto_1.CreateTripDto, Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "create", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('ping'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_gps_ping_dto_1.CreateGpsPingDto]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "recordPing", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_trip_status_dto_1.UpdateTripStatusDto, Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('active/driver'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "findActiveByDriver", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('queue'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "getQueue", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('choferId')),
    __param(2, (0, common_1.Query)('clientId')),
    __param(3, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getStats", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('choferId')),
    __param(2, (0, common_1.Query)('clientId')),
    __param(3, (0, common_1.Query)('cp')),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "cancel", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Delete)('pricing/rules/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "deletePricingRule", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id/history'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "remove", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('geocode'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "geocode", null);
exports.TripsController = TripsController = __decorate([
    (0, common_1.Controller)('trips'),
    __metadata("design:paramtypes", [trips_service_1.TripsService,
        gps_tracking_service_1.GpsTrackingService])
], TripsController);
//# sourceMappingURL=trips.controller.js.map