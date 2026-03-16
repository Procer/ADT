import { Repository } from 'typeorm';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { GpsTracking } from '../database/entities/gps-tracking.entity';
import { Client } from '../database/entities/client.entity';
import { TripsService } from '../trips/trips.service';
import { ClientCreateTripDto } from '../trips/dto/client-create-trip.dto';
import type { Response } from 'express';
export declare class ClientsController {
    private readonly tripsRepo;
    private readonly gpsRepo;
    private readonly clientRepo;
    private readonly tripsService;
    constructor(tripsRepo: Repository<CartaPorte>, gpsRepo: Repository<GpsTracking>, clientRepo: Repository<Client>, tripsService: TripsService);
    createTrip(clientId: string, dto: ClientCreateTripDto): Promise<CartaPorte>;
    getTemplate(res: Response): Promise<void>;
    uploadTrips(clientId: string, file: any): Promise<CartaPorte[]>;
    getMyTrips(clientId: string): Promise<CartaPorte[]>;
    getTripTracking(id: string, clientId: string): Promise<{
        trip: CartaPorte;
        lastLocation: {
            latitud: number;
            longitud: number;
            id: string;
            cpId: string;
            cartaPorte: CartaPorte;
            velocidad: number;
            esManual: boolean;
            tipoRegistro: string;
            eventoManual: string;
            cierreInternoDisparado: boolean;
            fueraDeRango: boolean;
            resuelto: boolean;
            comentarioResolucion: string;
            resueltoPor: string;
            distanciaDestinoMetros: number;
            timestampDispositivo: Date;
            timestampServidor: Date;
        } | null;
        smartEtaMinutes: number;
    }>;
    private applySmartFactors;
}
