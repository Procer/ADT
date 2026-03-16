import { Repository } from 'typeorm';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { GpsTracking } from '../database/entities/gps-tracking.entity';
import { TripsService } from './trips.service';
export declare class TripClosureService {
    private readonly tripsRepo;
    private readonly gpsRepo;
    private readonly tripsService;
    private readonly logger;
    constructor(tripsRepo: Repository<CartaPorte>, gpsRepo: Repository<GpsTracking>, tripsService: TripsService);
    handleAutoClosures(): Promise<void>;
}
