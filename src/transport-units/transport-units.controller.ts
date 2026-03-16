import { Controller, Get, Post, Body, Query, Param, Patch, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import { TransportUnitsService } from './transport-units.service';
import { CreateTransportUnitDto } from './dto/create-transport-unit.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('units')
export class TransportUnitsController {
    constructor(private readonly unitsService: TransportUnitsService) { }

    @Post('bulk-import')
    @UseInterceptors(FileInterceptor('file'))
    bulkImport(@UploadedFile() file: any, @Request() req: any) {
        const tenantId = req.user?.tenantId || req.query.tenantId;
        return this.unitsService.importBulkFromExcel(tenantId, file.buffer);
    }

    @Post()
    create(@Body() createUnitDto: CreateTransportUnitDto) {
        return this.unitsService.create(createUnitDto);
    }

    @Get()
    findAll(@Query('tenantId') tenantId?: string) {
        if (!tenantId) return this.unitsService.findAllAdmin();
        return this.unitsService.findAll(tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.unitsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.unitsService.update(id, updateDto);
    }
}
