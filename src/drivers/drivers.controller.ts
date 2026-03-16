import { Controller, Get, Post, Body, Query, Param, Patch, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('drivers')
export class DriversController {
    constructor(private readonly driversService: DriversService) { }

    @Post('bulk-import')
    @UseInterceptors(FileInterceptor('file'))
    bulkImport(@UploadedFile() file: any, @Request() req: any) {
        // En un entorno real, el tenantId vendría del token JWT (req.user.tenantId)
        // Por ahora, lo sacaremos de la query o del body si es necesario, 
        // pero siguiendo el patrón de Trips, usaremos req.user.tenantId si está disponible
        // o un parámetro de query para flexibilidad.
        const tenantId = req.user?.tenantId || req.query.tenantId;
        return this.driversService.importBulkFromExcel(tenantId, file.buffer);
    }

    @Post()
    create(@Body() createDriverDto: CreateDriverDto) {
        return this.driversService.create(createDriverDto);
    }

    @Get()
    findAll(@Query('tenantId') tenantId: string) {
        return this.driversService.findAll(tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.driversService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.driversService.update(id, updateDto);
    }
}
