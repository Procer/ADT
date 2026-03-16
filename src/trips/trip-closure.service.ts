import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { GpsTracking } from '../database/entities/gps-tracking.entity';
import { TripsService } from './trips.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TripClosureService {
    private readonly logger = new Logger(TripClosureService.name);

    constructor(
        @InjectRepository(CartaPorte) private readonly tripsRepo: Repository<CartaPorte>,
        @InjectRepository(GpsTracking) private readonly gpsRepo: Repository<GpsTracking>,
        private readonly tripsService: TripsService,
    ) { }

    @Cron('0 */15 * * * *')
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

                if (!lastPing) continue;

                // 1. Geofence Auto-Close: If device is > 20km from destination after arriving
                if (trip.destinoLat && trip.destinoLng) {
                    const distance = await this.tripsService.getDistance(
                        Number(lastPing.latitud), 
                        Number(lastPing.longitud), 
                        Number(trip.destinoLat), 
                        Number(trip.destinoLng)
                    );

                    // Si ya marcó que llegó o si detectamos que se alejó demasiado del destino
                    if (distance > 20000 && (trip.estado === 'LLEGUE' || trip.estado === 'OPERANDO')) {
                        this.logger.warn(`Auto-closing trip ${trip.numeroCP}: device is ${Math.round(distance/1000)}km away from destination.`);
                        await this.tripsService.closeTrip(trip.id, 'AUTO_GEO');
                    }
                }

                // 2. Inactivity Auto-Close: If no pings for > 12 hours
                const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
                if (new Date(lastPing.timestampDispositivo) < twelveHoursAgo) {
                    this.logger.warn(`Auto-closing trip ${trip.numeroCP} due to inactivity (last ping: ${lastPing.timestampDispositivo})`);
                    await this.tripsService.closeTrip(trip.id, 'AUTO_INACTIVITY');
                }

            } catch (error) {
                this.logger.error(`Error processing auto-closure for trip ${trip.id}: ${error.message}`);
            }
        }
    }
}
