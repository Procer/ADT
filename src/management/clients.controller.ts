import { Controller, Get, Query, Param, UseGuards, UnauthorizedException, Post, Body, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartaPorte } from '../database/entities/carta-porte.entity';
import { GpsTracking } from '../database/entities/gps-tracking.entity';
import { Client } from '../database/entities/client.entity';
import { Public } from '../auth/public.decorator';
import { TripsService } from '../trips/trips.service';
import { ClientCreateTripDto } from '../trips/dto/client-create-trip.dto';
import { TripStatus } from '../trips/dto/update-trip-status.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import type { Response } from 'express';

@Controller('client-portal')
export class ClientsController {
    constructor(
        @InjectRepository(CartaPorte) private readonly tripsRepo: Repository<CartaPorte>,
        @InjectRepository(GpsTracking) private readonly gpsRepo: Repository<GpsTracking>,
        @InjectRepository(Client) private readonly clientRepo: Repository<Client>,
        private readonly tripsService: TripsService
    ) { }

    @Public()
    @Post('trips')
    async createTrip(@Query('clientId') clientId: string, @Body() dto: ClientCreateTripDto) {
        if (!clientId) throw new UnauthorizedException('ClientId is required');
        
        const client = await this.clientRepo.findOne({ where: { id: clientId } });
        if (!client) throw new UnauthorizedException('Client not found');

        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const numeroCP = `REQ-${randomSuffix}-${Date.now().toString().slice(-4)}`;

        const trip = this.tripsRepo.create({
            ...dto,
            clientId,
            tenantId: client.tenantId,
            estado: TripStatus.SOLICITADO,
            numeroCP,
            cierreMotivo: 'Solicitado por Cliente'
        });

        return this.tripsRepo.save(trip);
    }

    @Public()
    @Get('template')
    async getTemplate(@Res() res: Response) {
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

    @Public()
    @Post('trips/upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadTrips(@Query('clientId') clientId: string, @UploadedFile() file: any) {
        if (!clientId) throw new UnauthorizedException('ClientId is required');
        const client = await this.clientRepo.findOne({ where: { id: clientId } });
        if (!client) throw new UnauthorizedException('Client not found');

        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        const trips = rows.map((row, idx) => {
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            return this.tripsRepo.create({
                origenNombre: row.Origen || 'No especificado',
                destinoNombre: row.Destino || 'No especificado',
                destinoLat: row.Latitud_Destino || 0,
                destinoLng: row.Longitud_Destino || 0,
                clientId,
                tenantId: client.tenantId,
                estado: TripStatus.SOLICITADO,
                numeroCP: `CP-MAS-${randomSuffix}-${idx + 1}`,
                cierreMotivo: row.Referencia || 'Carga Masiva'
            });
        });

        return this.tripsRepo.save(trips);
    }

    @Public()
    @Get('trips')
    async getMyTrips(@Query('clientId') clientId: string) {
        if (!clientId) throw new UnauthorizedException('ClientId is required');

        return this.tripsRepo.find({
            where: { clientId },
            relations: ['unidad', 'chofer'],
            order: { tsCreacion: 'DESC' }
        });
    }

    @Public()
    @Get('trips/:id/tracking')
    async getTripTracking(@Param('id') id: string, @Query('clientId') clientId: string) {
        const trip = await this.tripsRepo.findOne({ 
            where: { id, clientId },
            relations: ['unidad'] 
        });
        if (!trip) throw new UnauthorizedException('Trip not found or access denied');

        // 1. Buscamos el reporte GPS más reciente vinculado a este viaje (SIN LIMITE DE TIEMPO)
        let lastPing = await this.gpsRepo.findOne({
            where: { cpId: id },
            order: { timestampDispositivo: 'DESC' }
        });

        // 2. FALLBACK AGRESIVO: Si el viaje no tiene pings, buscamos el de la UNIDAD físicamente
        if (!lastPing && trip.unidadId) {
            const rawPings = await this.gpsRepo.query(`
                SELECT TOP 1 g.* FROM gps_tracking g
                INNER JOIN cartas_de_porte c ON g.cp_id = c.id
                WHERE c.unidad_id = @0
                ORDER BY g.timestamp_dispositivo DESC
            `, [trip.unidadId]);

            if (rawPings && rawPings.length > 0) {
                const rawPing = rawPings[0];
                // Normalización segura de nombres de campos SQL -> Entity
                lastPing = {
                    ...rawPing,
                    latitud: rawPing.latitud ?? rawPing.lat,
                    longitud: rawPing.longitud ?? rawPing.lng
                } as GpsTracking;
            }
        }

        // 3. Smart ETA
        const etaResult = await this.tripsService.calculateSmartEta(id);
        let smartEta = etaResult.etaMinutes;
        
        // 4. FALLBACK ETA POR DISTANCIA (Infalible)
        if ((smartEta <= 0 || smartEta === -1) && lastPing && trip.destinoLat && trip.destinoLng) {
            try {
                const distance = await this.tripsService.getDistance(
                    Number(lastPing.latitud), Number(lastPing.longitud), 
                    Number(trip.destinoLat), Number(trip.destinoLng)
                );
                
                let speed = Number(lastPing.velocidad) || 0;
                if (speed < 10) speed = 40; // Proyectar a 40km/h si está detenido o en tráfico denso
                
                const etaHours = (distance / 1000) / speed;
                smartEta = Math.round(etaHours * 60 * 1.25); // +25% de margen operativo
            } catch (e) {
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

    private applySmartFactors(baseMinutes: number): number {
        const hour = new Date().getHours();
        const isRushHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
        let multiplier = 1.0;
        if (isRushHour) multiplier += 0.2;
        return Math.round(baseMinutes * multiplier);
    }
}
