import { IsUUID, IsNumber, IsBoolean, IsISO8601, IsOptional } from 'class-validator';

export class CreateGpsPingDto {
    @IsUUID()
    cpId: string;

    @IsNumber()
    lat: number;

    @IsNumber()
    lng: number;

    @IsNumber()
    @IsOptional()
    velocidad?: number;

    @IsBoolean()
    @IsOptional()
    esManual?: boolean;

    @IsISO8601()
    timestamp: string;

    @IsOptional()
    tipo_registro?: string;

    @IsOptional()
    evento_manual?: string;

    @IsOptional()
    cierre_interno_disparado?: boolean;

    @IsOptional()
    metadata?: string;
}
