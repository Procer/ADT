import { Repository } from 'typeorm';
import { GpsTracking } from '../database/entities/gps-tracking.entity';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { CreateGpsPingDto } from './dto/create-gps-ping.dto';
import { GpsGateway } from './gps.gateway';
import { Queue } from 'bullmq';
import { TripsService } from './trips.service';
import { TelegramService } from '../management/telegram.service';
export declare class GpsTrackingService {
    private readonly gpsRepo;
    private readonly tripsRepo;
    private readonly gpsGateway;
    private readonly tripsService;
    private readonly gpsQueue;
    private readonly telegramService;
    constructor(gpsRepo: Repository<GpsTracking>, tripsRepo: Repository<CartaPorte>, gpsGateway: GpsGateway, tripsService: TripsService, gpsQueue: Queue, telegramService: TelegramService);
    recordPing(dto: CreateGpsPingDto): Promise<{
        status: string;
    }>;
    processPingFromQueue(data: any): Promise<GpsTracking>;
}
