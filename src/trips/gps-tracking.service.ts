import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GpsTracking } from '../database/entities/gps-tracking.entity';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { CreateGpsPingDto } from './dto/create-gps-ping.dto';
import { GpsGateway } from './gps.gateway';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TripsService } from './trips.service';
import { TelegramService } from '../management/telegram.service';
import { TripStatus } from './dto/update-trip-status.dto';

@Injectable()
export class GpsTrackingService {
    constructor(
        @InjectRepository(GpsTracking)
        private readonly gpsRepo: Repository<GpsTracking>,
        @InjectRepository(CartaPorte)
        private readonly tripsRepo: Repository<CartaPorte>,
        private readonly gpsGateway: GpsGateway,
        @Inject(forwardRef(() => TripsService))
        private readonly tripsService: TripsService,
        @InjectQueue('gps-ping-queue') private readonly gpsQueue: Queue,
        private readonly telegramService: TelegramService,
    ) { }

    async recordPing(dto: CreateGpsPingDto): Promise<{ status: string }> {
        const { cpId, lat, lng } = dto;

        const trip = await this.tripsRepo.findOne({
            where: { id: cpId },
            relations: ['unidad']
        });

        if (!trip) throw new NotFoundException(`Trip with ID ${cpId} not found`);

        this.gpsGateway.emitGpsPing({
            cpId,
            lat,
            lng,
            patente: trip.unidad?.patente,
            estado: trip.estado,
        });

        await this.gpsQueue.add('ping-job', dto);
        return { status: 'queued' };
    }

    async processPingFromQueue(data: any): Promise<GpsTracking> {
        const { cpId, lat, lng, velocidad, timestamp, tipo_registro, evento_manual, cierre_interno_disparado } = data;

        const trip = await this.tripsRepo.findOne({
            where: { id: cpId },
            relations: ['chofer', 'unidad']
        });

        if (!trip) throw new Error(`Trip ${cpId} not found in background processor`);

        // --- ALERTA DE EXCESO DE VELOCIDAD (> 90 km/h) ---
        if (velocidad > 90) {
            // Aviso al Cliente Logístico (Tenant)
            const admin = await this.tripsService.getTenantAdmin(trip.tenantId);
            
            if (admin?.telegramChatId) {
                const msgAdmin = `🚩 *EXCESO DE VELOCIDAD DETECTADO*\n` +
                               `Chofer: ${trip.chofer?.nombre}\n` +
                               `Unidad: ${trip.unidad?.patente}\n` +
                               `Velocidad: *${Math.round(velocidad)} km/h*\n` +
                               `Viaje: ${trip.numeroCP}\n` +
                               `Ubicación: [Ver en Mapa](https://www.google.com/maps?q=${lat},${lng})`;
                await this.telegramService.sendMessage(admin.telegramChatId, msgAdmin);
            }

            // Registro para consultas futuras en el Dashboard
            await this.tripsService.createAuditLog({
                tenantId: trip.tenantId,
                accion: 'ALERTA_VELOCIDAD',
                descripcion: `Exceso de velocidad: ${Math.round(velocidad)} km/h - Chofer: ${trip.chofer?.nombre} - Unidad: ${trip.unidad?.patente}`,
                dataNueva: JSON.stringify({ tripId: trip.id, velocidad, lat, lng })
            });
        }

        let distanceToDest = 0;
        if (trip.destinoLat && trip.destinoLng) {
            distanceToDest = await this.tripsService.getDistance(lat, lng, Number(trip.destinoLat), Number(trip.destinoLng));
            
            // Regla: Si entra en la Geofence_Destino (< radioGeocercaKm)
            if (distanceToDest < (trip.radioGeocercaKm * 1000)) {
                if (!trip.reachedDestination) {
                    trip.reachedDestination = true;
                    // REGLA: Hito de auditoría interno - Marcamos como ENTREGADO
                    // Pero NO cerramos el viaje, eso lo hace el chofer.
                    if (trip.estado === TripStatus.IN_PROGRESS || trip.estado === TripStatus.LLEGUE || trip.estado === TripStatus.CARGA_DESCARGA) {
                        trip.estado = TripStatus.ENTREGADO;
                    }
                    await this.tripsRepo.save(trip);
                }
            }

            // REGLA ADT: Cierre Interno por alejamiento (> 10km del destino sin haber cerrado)
            // Si el dispositivo disparó el flag de alejamiento o lo detectamos aquí
            if (trip.estado === TripStatus.IN_PROGRESS && (cierre_interno_disparado || distanceToDest > 10000)) {
                // No cerramos el viaje para el chofer, pero marcamos el hito de auditoría
                // El sistema ya lo considera "Cerrado Internamente" para medir demoras
                if (!trip.tsCierreInterno) {
                    trip.cierreMotivo = 'AUTO_GEO_ALEJAMIENTO';
                    trip.tsCierreInterno = new Date();
                }
            }
        }
        
        // --- CÁLCULO DE ODÓMETRO (Kilómetros recorridos) ---
        // Recuperamos el último ping para calcular el delta de distancia (antes de guardar el nuevo)
        const lastPing = await this.gpsRepo.findOne({
            where: { cpId },
            order: { timestampDispositivo: 'DESC' }
        });

        if (lastPing && trip.estado === TripStatus.IN_PROGRESS) {
            const distanceDeltaMts = await this.tripsService.getDistance(
                lat, lng,
                Number(lastPing.latitud), Number(lastPing.longitud)
            );

            // Evitar saltos erráticos por error de GPS (ej. > 5km en pocos segundos)
            // Estándar logístico: 90km/h = 25m/s. Un ping cada 10s son 250m. 5000m es margen de seguridad alto.
            if (distanceDeltaMts > 0 && distanceDeltaMts < 5000) {
                const deltaKm = distanceDeltaMts / 1000;
                trip.distanciaTotalRecorridaKm = Number(trip.distanciaTotalRecorridaKm || 0) + deltaKm;
                // Guardamos el progreso en el viaje
                await this.tripsRepo.save(trip);
            }
        }

        const ping = this.gpsRepo.create({
            cpId,
            latitud: lat,
            longitud: lng,
            velocidad: velocidad || 0,
            timestampDispositivo: new Date(timestamp),
            tipoRegistro: tipo_registro || 'AUTOMATICO',
            eventoManual: evento_manual || null,
            cierreInternoDisparado: cierre_interno_disparado || false,
            distanciaDestinoMetros: distanceToDest
        });

        return this.gpsRepo.save(ping);
    }
}

