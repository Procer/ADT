import { IsUUID, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTripDto {
    @IsUUID()
    @IsNotEmpty()
    tenantId: string;

    @IsUUID()
    @IsNotEmpty()
    choferId: string;

    @IsUUID()
    @IsNotEmpty()
    unidadId: string;

    @IsString()
    @IsOptional()
    origenNombre?: string;

    @IsNumber()
    @IsOptional()
    origenLat?: number;

    @IsNumber()
    @IsOptional()
    origenLng?: number;

    @IsString()
    @IsOptional()
    destinoNombre?: string;

    @IsNumber()
    @IsNotEmpty()
    destinoLat: number;

    @IsNumber()
    @IsNotEmpty()
    destinoLng: number;

    @IsOptional()
    urlFotoRemito?: string;

    @IsOptional()
    bypassExpirations?: boolean;

    @IsOptional()
    adminNameBypass?: string;

    @IsOptional()
    @IsUUID()
    clientId?: string;

    @IsOptional()
    @IsNumber()
    pesoToneladas?: number;

    @IsOptional()
    @IsNumber()
    distanciaKm?: number;

    @IsOptional()
    @IsString()
    mercaderiaTipo?: string;
}
