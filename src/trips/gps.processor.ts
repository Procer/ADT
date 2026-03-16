import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GpsTrackingService } from './gps-tracking.service';
import { Logger } from '@nestjs/common';

@Processor('gps-ping-queue')
export class GpsProcessor extends WorkerHost {
    private readonly logger = new Logger(GpsProcessor.name);

    constructor(private readonly gpsTrackingService: GpsTrackingService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing background GPS ping for trip ${job.data.cpId}`);

        try {
            // This is where we call the original logic to save to MSSQL
            // We might need to refactor recordPing to separate "enqueue" from "write"
            await this.gpsTrackingService.processPingFromQueue(job.data);
        } catch (error) {
            this.logger.error(`Error processing job ${job.id}: ${error.message}`);
            throw error;
        }
    }
}
