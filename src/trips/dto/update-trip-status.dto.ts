import { IsEnum, IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';

export enum TripStatus {
    SOLICITADO = 'SOLICITADO',
    PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
    PENDING = 'PENDIENTE',
    IN_PROGRESS = 'EN_CAMINO',
    LLEGUE = 'LLEGUE',
    CARGA_DESCARGA = 'CARGA_DESCARGA',
    ENTREGADO = 'ENTREGADO',
    FINALIZED = 'FINALIZADO',
    VOID_CREDIT = 'ANULADO'
}

export class UpdateTripStatusDto {
    @IsEnum(TripStatus)
    estado: TripStatus;

    @IsOptional()
    @IsString()
    urlFotoRemito?: string;

    @IsOptional()
    @IsNumber()
    lat?: number;

    @IsOptional()
    @IsNumber()
    lng?: number;

    @IsOptional()
    @IsBoolean()
    fuera_de_rango?: boolean;

    @IsOptional()
    @IsString()
    comentario?: string;
}
