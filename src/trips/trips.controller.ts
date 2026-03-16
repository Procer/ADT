import { Controller, Post, Body, Param, Put, Patch, Get, Delete, UseGuards, Request, Query, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripStatusDto, TripStatus } from './dto/update-trip-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { GpsTrackingService } from './gps-tracking.service';
import { CreateGpsPingDto } from './dto/create-gps-ping.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as express from 'express';

@Controller('trips')
export class TripsController {
    constructor(
        private readonly tripsService: TripsService,
        private readonly gpsService: GpsTrackingService,
    ) { }

    @Public()
    @Get('monthly-report')
    async getMonthlyReport(
        @Query('month') month: number,
        @Query('year') year: number,
        @Query('format') format: 'excel' | 'pdf',
        @Request() req: any,
        @Res() res: express.Response
    ) {
        // En rutas públicas req.user puede no existir
        const tenantId = req.user?.tenantId;
        const { buffer, filename, mimeType } = await this.tripsService.generateMonthlyReportBuffer(tenantId, month, year, format);
        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }

    @UseGuards(JwtAuthGuard)
    @Post('bulk-import')
    @UseInterceptors(FileInterceptor('file'))
    bulkImport(@UploadedFile() file: any, @Request() req: any) {
        return this.tripsService.importBulkFromExcel(req.user.tenantId, file.buffer);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createTripDto: CreateTripDto, @Request() req: any) {
        const tenantId = (req.user && req.user.role === 'SUPER_ADMIN')
            ? (createTripDto.tenantId || req.user.tenantId)
            : (req.user ? req.user.tenantId : createTripDto.tenantId);

        return this.tripsService.create({ ...createTripDto, tenantId });
    }

    @Public()
    @Post('ping')
    recordPing(@Body() dto: CreateGpsPingDto) {
        return this.gpsService.recordPing(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() dto: UpdateTripStatusDto, @Request() req: any) {
        return this.tripsService.updateStatus(id, dto, req.user?.role);
    }

    @UseGuards(JwtAuthGuard)
    @Get('active/driver')
    findActiveByDriver(@Request() req: any) {
        return this.tripsService.findActiveByDriver(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('queue')
    getQueue(@Request() req: any) {
        return this.tripsService.getDriverQueue(req.user.userId);
    }

    @Public()
    @Get('stats')
    async getStats(
        @Query('tenantId') tenantId: string,
        @Query('choferId') choferId?: string,
        @Query('clientId') clientId?: string,
        @Query('period') period: 'DAY' | 'WEEK' | 'FORTNIGHT' | 'MONTH' | 'ALL' = 'ALL'
    ) {
        return this.tripsService.calculateStats(tenantId, { choferId, clientId, period });
    }

    @Public()
    @Get()
    findAll(
        @Query('tenantId') queryTenantId: string,
        @Query('choferId') choferId: string,
        @Query('clientId') clientId: string,
        @Query('cp') cp: string,
        @Request() req: any
    ) {
        // Al no tener Guard, req.user será undefined si no hay token válido
        let tenantId = queryTenantId;
        if (req.user) {
            tenantId = req.user.role === 'SUPER_ADMIN' ? (queryTenantId || req.user.tenantId) : req.user.tenantId;
        }
        return this.tripsService.findAll(tenantId, { choferId, clientId, cp });
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: Partial<CreateTripDto>, @Request() req: any) {
        return this.tripsService.update(id, dto, req.user?.role);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/cancel')
    cancel(@Param('id') id: string, @Body() body: { comentario?: string }, @Request() req: any) {
        return this.tripsService.updateStatus(id, {
            estado: TripStatus.VOID_CREDIT,
            comentario: body.comentario
        }, req.user?.role);
    }

    @Public()
    @Delete('pricing/rules/:id')
    async deletePricingRule(@Param('id') id: string, @Query('role') role: string) {
        console.log(`[TRIPS CONTROLLER] Eliminando tarifa ID: ${id} solicitado por ${role}`);
        return this.tripsService.deletePricingRule(id, role);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/history')
    getHistory(@Param('id') id: string) {
        return this.tripsService.getHistory(id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.tripsService.remove(id, req.user?.role);
    }

    @Public()
    @Get('geocode')
    async geocode(@Query('q') q: string) {
        try {
            const axios = require('axios');
            const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: { format: 'json', q, limit: 5, countrycodes: 'ar' },
                headers: { 'User-Agent': 'ADT-App/1.0' }
            });
            return res.data;
        } catch (e) { return []; }
    }
}
