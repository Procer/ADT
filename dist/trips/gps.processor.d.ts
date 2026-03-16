import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GpsTrackingService } from './gps-tracking.service';
export declare class GpsProcessor extends WorkerHost {
    private readonly gpsTrackingService;
    private readonly logger;
    constructor(gpsTrackingService: GpsTrackingService);
    process(job: Job<any, any, string>): Promise<any>;
}
