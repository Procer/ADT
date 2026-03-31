import { IsUUID, IsNumber, IsBoolean, IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateGpsPingDto {
    @IsUUID()
    @IsOptional()
    cpId?: string;

    @IsUUID()
    @IsOptional()
    tripId?: string; // Alias legacy

    @IsNumber()
    @IsOptional()
    lat?: number;

    @IsNumber()
    @IsOptional()
    lng?: number;

    @IsNumber()
    @IsOptional()
    latitude?: number; // Alias legacy

    @IsNumber()
    @IsOptional()
    longitude?: number; // Alias legacy

    @IsNumber()
    @IsOptional()
    velocidad?: number;

    @IsNumber()
    @IsOptional()
    speed?: number; // Alias legacy

    @IsBoolean()
    @IsOptional()
    esManual?: boolean;

    @IsISO8601()
    timestamp: string;

    @IsOptional()
    @IsString()
    tipo_registro?: string;

    @IsOptional()
    @IsString()
    evento_manual?: string;

    @IsOptional()
    @IsBoolean()
    cierre_interno_disparado?: boolean;

    @IsOptional()
    @IsNumber()
    kilometers?: number;

    @IsOptional()
    @IsString()
    metadata?: string;
}

