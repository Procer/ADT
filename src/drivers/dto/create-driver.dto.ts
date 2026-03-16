import { IsString, IsNotEmpty, IsUUID, IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateDriverDto {
    @IsUUID()
    @IsNotEmpty()
    tenantId: string;

    @IsString()
    @IsNotEmpty()
    dni: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    telegramUser?: string;

    @IsString()
    @IsOptional()
    telefono?: string;

    @IsString()
    @IsOptional()
    licenciaNumero?: string;

    @IsString()
    @IsOptional()
    licenciaCategoria?: string;

    @IsString()
    @IsOptional()
    art?: string;

    @IsDateString()
    @IsOptional()
    fechaIngreso?: string;

    @IsDateString()
    @IsOptional()
    fechaNacimiento?: string;

    @IsString()
    @IsOptional()
    pin?: string;

    @IsDateString()
    @IsOptional()
    vencimientoLicencia?: string;

    @IsString()
    @IsOptional()
    paymentCycle?: string;

    @IsInt()
    @Min(0)
    @Max(100)
    @IsOptional()
    scoreConfianza?: number;
}
