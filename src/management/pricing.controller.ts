import { Controller, Delete, Param, Query, BadRequestException } from '@nestjs/common';
import { PricingEngineService } from './pricing-engine.service';
import { Public } from '../auth/public.decorator';

@Controller('pricing')
export class PricingController {
    constructor(private readonly pricingEngine: PricingEngineService) {}

    @Public()
    @Delete('rules/:id')
    async deletePricingRule(@Param('id') id: string, @Query('role') role: string) {
        if (role !== 'SUPER_ADMIN') {
            throw new BadRequestException('Solo el Dueño de ADT puede eliminar registros.');
        }
        console.log(`[PRICING CONTROLLER] Eliminando tarifa ID: ${id} solicitado por ${role}`);
        return this.pricingEngine.deleteRule(id, role);
    }
}
