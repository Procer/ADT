export declare class CreateTripDto {
    tenantId: string;
    choferId: string;
    unidadId: string;
    origenNombre?: string;
    origenLat?: number;
    origenLng?: number;
    destinoNombre?: string;
    destinoLat: number;
    destinoLng: number;
    urlFotoRemito?: string;
    bypassExpirations?: boolean;
    adminNameBypass?: string;
    clientId?: string;
    pesoToneladas?: number;
    distanciaKm?: number;
    mercaderiaTipo?: string;
}
