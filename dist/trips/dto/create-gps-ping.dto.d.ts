export declare class CreateGpsPingDto {
    cpId: string;
    lat: number;
    lng: number;
    velocidad?: number;
    esManual?: boolean;
    timestamp: string;
    tipo_registro?: string;
    evento_manual?: string;
    cierre_interno_disparado?: boolean;
    metadata?: string;
}
