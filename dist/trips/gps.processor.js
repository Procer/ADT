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
var GpsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GpsProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const gps_tracking_service_1 = require("./gps-tracking.service");
const common_1 = require("@nestjs/common");
let GpsProcessor = GpsProcessor_1 = class GpsProcessor extends bullmq_1.WorkerHost {
    gpsTrackingService;
    logger = new common_1.Logger(GpsProcessor_1.name);
    constructor(gpsTrackingService) {
        super();
        this.gpsTrackingService = gpsTrackingService;
    }
    async process(job) {
        this.logger.log(`Processing background GPS ping for trip ${job.data.cpId}`);
        try {
            await this.gpsTrackingService.processPingFromQueue(job.data);
        }
        catch (error) {
            this.logger.error(`Error processing job ${job.id}: ${error.message}`);
            throw error;
        }
    }
};
exports.GpsProcessor = GpsProcessor;
exports.GpsProcessor = GpsProcessor = GpsProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('gps-ping-queue'),
    __metadata("design:paramtypes", [gps_tracking_service_1.GpsTrackingService])
], GpsProcessor);
//# sourceMappingURL=gps.processor.js.map