import { IsNotEmpty, IsOptional, IsNumber, IsString } from 'class-validator';

export class ClientCreateTripDto {
    @IsNotEmpty()
    @IsString()
    origenNombre: string;

    @IsOptional()
    @IsNumber()
    origenLat: number;

    @IsOptional()
    @IsNumber()
    origenLng: number;

    @IsNotEmpty()
    @IsString()
    destinoNombre: string;

    @IsNotEmpty()
    @IsNumber()
    destinoLat: number;

    @IsNotEmpty()
    @IsNumber()
    destinoLng: number;

    @IsOptional()
    @IsString()
    referenciaCliente: string;
}
