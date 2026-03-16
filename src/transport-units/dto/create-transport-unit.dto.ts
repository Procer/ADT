import { IsString, IsNotEmpty, IsUUID, IsDateString, IsOptional, MaxLength } from 'class-validator';

export class CreateTransportUnitDto {
    @IsUUID()
    @IsNotEmpty()
    tenantId: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    patente: string;

    @IsDateString()
    @IsOptional()
    vencimientoVtv?: string;

    @IsDateString()
    @IsOptional()
    vencimientoSeguro?: string;

    @IsString()
    @IsOptional()
    marca?: string;

    @IsString()
    @IsOptional()
    modelo?: string;

    @IsOptional()
    kmInicial?: number;

    @IsOptional()
    odometroActual?: number;
}
