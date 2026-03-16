export declare enum TripStatus {
    SOLICITADO = "SOLICITADO",
    PENDING_CONFIRMATION = "PENDING_CONFIRMATION",
    PENDING = "PENDIENTE",
    IN_PROGRESS = "EN_CAMINO",
    LLEGUE = "LLEGUE",
    CARGA_DESCARGA = "CARGA_DESCARGA",
    ENTREGADO = "ENTREGADO",
    FINALIZED = "FINALIZADO",
    VOID_CREDIT = "ANULADO"
}
export declare class UpdateTripStatusDto {
    estado: TripStatus;
    urlFotoRemito?: string;
    lat?: number;
    lng?: number;
    fuera_de_rango?: boolean;
    comentario?: string;
}
